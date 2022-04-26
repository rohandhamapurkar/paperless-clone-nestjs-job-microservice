import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import mongoose from 'mongoose';
import { CreateJobDto } from './dto/create-job.dto';
import { JobChangelog } from './entities/job-changelog.entity';
import { Job } from './entities/job.entity';

@Injectable()
export class JobsService {
  constructor(
    private readonly jobRepository: mongoose.Model<Job>,
    private readonly jobChangelogRepository: mongoose.Model<JobChangelog>,
  ) {}

  async assertJob(data: CreateJobDto) {
    try {
      const job = { ...data, retryCount: 0, createdOn: new Date() };
      const doc = new this.jobRepository(job);
      return await doc.save();
    } catch (err) {
      if (err.code === 11000) {
        console.log('Job already exists in database');
        return await this.jobRepository.findOne({ uuid: data.uuid });
      } else {
        throw new ServiceUnavailableException(err);
      }
    }
  }

  async processJob() {}
}
