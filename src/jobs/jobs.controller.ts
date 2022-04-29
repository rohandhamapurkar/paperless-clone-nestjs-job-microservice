import { Controller, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
  Transport,
} from '@nestjs/microservices';
import { JOB_RETRY_LIMIT, JOB_SERVICE_MESSAGE_PATTERNS } from './constants';
import { CreateJobDto } from './dto/create-job.dto';
import { GetJobsChangelogDto } from './dto/get-job-changelog.dto';
import { GetJobsDto } from './dto/get-jobs.dto';
import { JobsService } from './jobs.service';
const logger = new Logger('JobsController');

@UsePipes(new ValidationPipe())
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobService: JobsService) {}

  /**
   * Service endpoint to process job
   */
  @MessagePattern(JOB_SERVICE_MESSAGE_PATTERNS.CREATE_JOB, Transport.RMQ)
  async processJob(@Payload() data: CreateJobDto, @Ctx() context: RmqContext) {
    const message = context.getMessage();
    const channel = context.getChannelRef();
    const job = await this.jobService.assertJob(data);
    try {
      if (job.retryCount >= JOB_RETRY_LIMIT) {
        logger.error('Job failed mulitiple times, aborting the job.');
        return channel.reject(message, false);
      }
      await this.jobService.processJob(job);
      channel.ack(message);
      logger.log('Job done');
    } catch (err) {
      logger.error(err);
      channel.nack(message, false);
    }
  }

  /**
   * Service endpoint to get all user jobs
   */
  @MessagePattern(JOB_SERVICE_MESSAGE_PATTERNS.GET_JOBS, Transport.TCP)
  async getJobs(data: GetJobsDto) {
    return await this.jobService.findAll(data);
  }

  /**
   * Service endpoint to get changelog for a user job
   */
  @MessagePattern(JOB_SERVICE_MESSAGE_PATTERNS.GET_JOB_CHANGELOG, Transport.TCP)
  async getJobChangelog(data: GetJobsChangelogDto) {
    return await this.jobService.getChangelog(data);
  }
}
