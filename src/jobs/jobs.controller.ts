import {
  Controller,
  Get,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
  Transport,
} from '@nestjs/microservices';
import { JOB_RETRY_LIMIT, JOB_SERVICE_MESSAGE_PATTERNS } from './constants';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsService } from './jobs.service';
const logger = new Logger('JobsController');

@UsePipes(new ValidationPipe())
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobService: JobsService) {}

  @Get()
  helloWorld() {
    return 'Hello World!';
  }

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
}
