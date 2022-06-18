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
import { JobChangelog, JOB_STATUS } from './entities/job-changelog.entity';
import { DataConfigType, Job } from './entities/job.entity';
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

  /**
   * Asserts and returns the user job document in the jobs collection
   */
  async getJob({
    jobId,
    eventReceiptHandle,
  }: {
    jobId: string;
    eventReceiptHandle: string;
  }) {
    try {
      await this.jobRepository.updateOne(
        { _id: new mongoose.Types.ObjectId(jobId) },
        { $set: { receiptHandle: eventReceiptHandle } },
      );
      return await this.jobRepository.findOne({
        _id: new mongoose.Types.ObjectId(jobId),
      });
    } catch (err) {
      throw new ServiceUnavailableException(err);
    }
  }

  /**
   * Adds an document to the jobs changelog collection
   */
  private recordJobChangelog({
    userId,
    jobId,
    status,
    message,
  }: {
    userId: string;
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

  /**
   * Increments the retry count property of the job
   */
  private async incJobRetry(
    job: mongoose.Document<unknown, any, Job> &
      Job & { _id: mongoose.Types.ObjectId },
  ) {
    await this.updateJob(job, { $inc: { retryCount: 1 } });
  }

  /**
   * Updates the job document
   */
  async updateJob(
    job: mongoose.Document<unknown, any, Job> &
      Job & { _id: mongoose.Types.ObjectId },
    updateObj: any,
  ) {
    return this.jobRepository.updateOne({ _id: job._id }, updateObj);
  }

  /**
   * Parses and divides the job dataconfig into static and dynamic
   */
  parseConfig(dataConfig: DataConfigType[]): {
    staticConfig: DataConfigType[];
    dynamicConfig: DataConfigType[];
  } {
    const staticConfig = dataConfig.filter(
      (elem) =>
        elem.type === DATA_CONFIG_TYPES.STATIC_TEXT ||
        elem.type === DATA_CONFIG_TYPES.IMAGE,
    );
    const dynamicConfig = dataConfig.filter(
      (elem) => elem.type === DATA_CONFIG_TYPES.FROM_DATASET,
    );
    return { staticConfig, dynamicConfig };
  }

  /**
   * Executes the dynamic job data config
   */
  async executeDynamicConfig({
    dynamicConfig,
    intermediateOutputImage,
    canvas,
    tempFolderPath,
  }: {
    dynamicConfig: DataConfigType[];
    intermediateOutputImage: string;
    canvas: fabric.StaticCanvas;
    tempFolderPath: string;
  }) {
    for (const config of dynamicConfig) {
      switch (config.type) {
        case DATA_CONFIG_TYPES.FROM_DATASET: {
          try {
            const datasetCursor = await this.datasetsDbConnection
              .collection(config.datasetId)
              .find();

            const templateImage = await this.imageProcessorService.readImage({
              url: 'file://' + intermediateOutputImage,
            });
            logger.debug(templateImage);

            unlinkSync(intermediateOutputImage);
            while (await datasetCursor.hasNext()) {
              const row = await datasetCursor.next();
              logger.debug(row);
              const result = await this.imageProcessorService.addFromDataset({
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

  /**
   * Processes the user job
   */
  async processJob(
    job: mongoose.Document<unknown, any, Job> &
      Job & { _id: mongoose.Types.ObjectId },
  ) {
    // temp variables
    const tempFolder = v4();
    const tempFolderPath = `./tmp/${tempFolder}`;
    const tempImageFile = `${v4()}.png`;
    const intermediateOutputImage = tempFolderPath + '/' + tempImageFile;

    // assertions
    !existsSync('./tmp') && mkdirSync('./tmp');
    mkdirSync(tempFolderPath);
    try {
      // record job processing start
      await this.recordJobChangelog({
        userId: job.userId,
        jobId: job._id,
        status: JOB_STATUS.PROCESSING_FILES,
        message: 'Started Job Processing',
      });

      // get template url
      const template = await this.paperlessDbConnection
        .collection(TEMPLATES_COLLECTION_NAME)
        .findOne({ _id: job.templateId });

      if (!template) throw new Error('No such template found');
      const templateUrl: string = template.imageUrl;

      // parse data config from UI
      const { staticConfig, dynamicConfig } = this.parseConfig(job.dataConfig);

      // get canvas with template image
      const canvas = await this.imageProcessorService.addTemplateImage(
        templateUrl,
      );

      // add static fabric objects to canvas
      const result0 = await this.imageProcessorService.addStaticObjects({
        canvas,
        staticConfig,
      });
      if (!result0) {
        throw new Error("Couldn't add static objects");
      }

      // write to intermediate output png file after adding static objects
      const imageWriteRes = await this.imageProcessorService.imageWrite({
        path: intermediateOutputImage,
        canvas,
      });
      if (!imageWriteRes) {
        throw new Error("Couldn't write staticImage output");
      }

      // if dynamic config exists
      if (dynamicConfig.length) {
        // add dynamic config objects to canvas with intermediate output png as template
        await this.executeDynamicConfig({
          dynamicConfig,
          canvas,
          intermediateOutputImage,
          tempFolderPath,
        });
      }

      // archive the temp folder that has all the canvas exported images
      const outputZipFileStream = await this.archiveService.archiveFolder({
        folderPath: tempFolderPath,
      });

      // archive the temp folder and upload to google drive
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

      // update job with zip file public link
      await this.updateJob(job, {
        $set: { outputFileLink: result1.link, outputFileId: result1.fileId },
      });

      // record job process finish
      await this.recordJobChangelog({
        userId: job.userId,
        jobId: job._id,
        status: JOB_STATUS.SUCCESS,
        message: 'Job completed successfully',
      });
      logger.log('Job Completed');
    } catch (err) {
      logger.error(err);
      // record job error
      await this.recordJobChangelog({
        userId: job.userId,
        jobId: job._id,
        status: JOB_STATUS.ERROR,
        message: err.message,
      });
      await this.incJobRetry(job);
      throw err;
    } finally {
      // finally async delete temp folder
      rm(tempFolderPath, { recursive: true, force: true }, function (err) {
        if (err) logger.error('Temp folder could not be deleted', err);
      });
    }
  }
}
