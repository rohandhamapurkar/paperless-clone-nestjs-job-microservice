import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { existsSync, mkdirSync, rm, unlinkSync } from 'fs';
import mongoose from 'mongoose';
import { GoogleService } from 'src/google/google.service';
import { v4 } from 'uuid';
import { ArchiveHelperService } from './archive-helper.service';
import { DATA_CONFIG_TYPES, TEMPLATES_COLLECTION_NAME } from './constants';
import { CreateJobDto } from './dto/create-job.dto';
import { JobChangelog, JOB_STATUS } from './entities/job-changelog.entity';
import { Job } from './entities/job.entity';
import { ImageProcessorService } from './image-processor.service';
const logger = new Logger('JobsService');

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name)
    private readonly jobRepository: mongoose.Model<Job>,
    @InjectModel(JobChangelog.name)
    private readonly jobChangelogRepository: mongoose.Model<JobChangelog>,

    @InjectConnection('paperless-db')
    private readonly paperlessDbConnection: mongoose.Connection,
    @InjectConnection('datasets-db')
    private readonly datasetsDbConnection: mongoose.Connection,

    private readonly imageProcessorService: ImageProcessorService,
    private readonly archiveService: ArchiveHelperService,
    private readonly googleService: GoogleService,
  ) {}

  async assertJob(data: CreateJobDto) {
    try {
      const doc = new this.jobRepository({
        userId: new mongoose.Types.ObjectId(data.userId),
        templateId: new mongoose.Types.ObjectId(data.templateId),
        uuid: data.uuid,
        dataConfig: data.dataConfig,
        retryCount: 0,
        createdOn: new Date(),
      });
      const job = await doc.save();
      await this.recordJobChangelog({
        userId: job.userId,
        jobId: job._id,
        status: JOB_STATUS.ASSERTING_JOB,
        message: 'Job entry created in the database',
      });
      return job;
    } catch (err) {
      if (err.code === 11000) {
        return await this.jobRepository.findOne({ uuid: data.uuid });
      } else {
        throw new ServiceUnavailableException(err);
      }
    }
  }

  private recordJobChangelog({
    userId,
    jobId,
    status,
    message,
  }: {
    userId: mongoose.Types.ObjectId;
    jobId: mongoose.Types.ObjectId;
    message: string;
    status: JOB_STATUS;
  }) {
    const doc = new this.jobChangelogRepository({
      userId,
      jobId,
      status,
      message,
      createdOn: new Date(),
    });
    return doc.save();
  }

  private async incJobRetry(
    job: mongoose.Document<unknown, any, Job> &
      Job & { _id: mongoose.Types.ObjectId },
  ) {
    await this.jobRepository.updateOne(
      { _id: job._id },
      { $inc: { retryCount: 1 } },
    );
  }

  async updateJob(
    job: mongoose.Document<unknown, any, Job> &
      Job & { _id: mongoose.Types.ObjectId },
    updateObj: any,
  ) {
    return this.jobRepository.updateOne({ _id: job._id }, updateObj);
  }

  async processJob(
    job: mongoose.Document<unknown, any, Job> &
      Job & { _id: mongoose.Types.ObjectId },
  ) {
    const tempFolder = v4();
    const tempFolderPath = `./tmp/${tempFolder}`;
    !existsSync('./tmp') && mkdirSync('./tmp');
    mkdirSync(tempFolderPath);
    try {
      await this.recordJobChangelog({
        userId: job.userId,
        jobId: job._id,
        status: JOB_STATUS.PROCESSING_FILES,
        message: 'Started Job Processing',
      });

      const template = await this.paperlessDbConnection
        .collection(TEMPLATES_COLLECTION_NAME)
        .findOne({ _id: job.templateId });
      const templateUrl: string = template.imageUrl;

      const staticConfig = job.dataConfig.filter(
        (elem) =>
          elem.type === DATA_CONFIG_TYPES.STATIC_TEXT ||
          elem.type === DATA_CONFIG_TYPES.IMAGE,
      );
      const dynamicConfig = job.dataConfig.filter(
        (elem) => elem.type === DATA_CONFIG_TYPES.FROM_DATASET,
      );

      const canvas = await this.imageProcessorService.addTemplateImage(
        templateUrl,
      );

      const result0 = await this.imageProcessorService.addStaticObjects({
        canvas,
        staticConfig,
      });
      if (!result0) {
        throw new Error("Couldn't add static objects");
      }

      const tempImageFile = `${v4()}.png`;

      const intermediateOutputImage = tempFolderPath + '/' + tempImageFile;

      const imageWriteRes = await this.imageProcessorService.imageWrite({
        path: intermediateOutputImage,
        canvas,
      });
      if (!imageWriteRes) {
        throw new Error("Couldn't write staticImage output");
      }
      if (dynamicConfig.length) {
        for (const config of dynamicConfig) {
          switch (config.type) {
            case DATA_CONFIG_TYPES.FROM_DATASET: {
              try {
                const datasetCursor = await this.datasetsDbConnection
                  .collection(config.datasetId)
                  .find();

                const templateImage =
                  await this.imageProcessorService.readImage({
                    url: 'file://' + intermediateOutputImage,
                  });
                logger.debug(templateImage);

                unlinkSync(intermediateOutputImage);
                while (await datasetCursor.hasNext()) {
                  const row = await datasetCursor.next();
                  logger.debug(row);
                  const result =
                    await this.imageProcessorService.addFromDataset({
                      canvas,
                      templateImage,
                      datasetObj: row,
                      config,
                      outputFolderPath: tempFolderPath,
                    });
                  if (!result) throw new Error('addFromDataset error');
                }
                await datasetCursor.close();
              } catch (err) {
                logger.error(err);
                throw new Error('Could not add from dynamic config');
              }
            }
          }
        }
      }

      const outputZipFileStream = await this.archiveService.archiveFolder({
        folderPath: tempFolderPath,
      });

      let result1: { link: string; fileId: string };
      try {
        result1 = await this.googleService.uploadPublicFile({
          filename: tempFolder + '.zip',
          folderId: this.googleService.GDRIVE_OUTPUT_FOLDER_ID,
          fileStream: outputZipFileStream,
          mimeType: 'application/zip',
        });
      } catch (err) {
        throw new Error('Google Service Error:' + err.message);
      }

      this.updateJob(job, {
        $set: { outputFileLink: result1.link, outputFileId: result1.fileId },
      });

      await this.recordJobChangelog({
        userId: job.userId,
        jobId: job._id,
        status: JOB_STATUS.SUCCESS,
        message: 'Job completed successfully',
      });
      logger.log('Job Completed');
    } catch (err) {
      logger.error(err);
      await this.recordJobChangelog({
        userId: job.userId,
        jobId: job._id,
        status: JOB_STATUS.ERROR,
        message: err.message,
      });
      await this.incJobRetry(job);
      throw err;
    } finally {
      rm(tempFolderPath, { recursive: true, force: true }, function (err) {
        if (err) logger.error('Temp folder could not be deleted', err);
      });
    }
  }
}
