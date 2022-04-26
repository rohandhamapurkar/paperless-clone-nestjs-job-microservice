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
import { JobsService } from './jobs.service';
@UsePipes(new ValidationPipe())
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobService: JobsService) {}

  @MessagePattern(JOB_SERVICE_MESSAGE_PATTERNS.CREATE_JOB, Transport.RMQ)
  async getNotifications(
    @Payload() data: CreateJobDto,
    @Ctx() context: RmqContext,
  ) {
    const message = context.getMessage();
    const channel = context.getChannelRef();

    try {
      const job = await this.jobService.assertJob(data);
      if (job.retryCount > JOB_RETRY_LIMIT) {
        Logger.error('****Job failed mulitiple times, aborting the job.****');
        return channel.reject(message, false);
      }
    } catch (err) {
      Logger.error(err);
      channel.nack(message, false);
    }
  }

  @MessagePattern(JOB_SERVICE_MESSAGE_PATTERNS.GET_JOB, Transport.TCP)
  async accumulate(data: number[]): Promise<number> {
    return (data || []).reduce((a, b) => a + b);
  }
}
