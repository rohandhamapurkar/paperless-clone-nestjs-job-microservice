import { Controller, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { JOB_RETRY_LIMIT, JOB_SERVICE_MESSAGE_PATTERNS } from './constants';
import { JobsService } from './jobs.service';
import { Message } from '@aws-sdk/client-sqs';
const logger = new Logger('JobsController');

@UsePipes(new ValidationPipe())
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobService: JobsService) {}

  /**
   * Service endpoint to process job
   */
  @MessagePattern(JOB_SERVICE_MESSAGE_PATTERNS.CREATE_JOB)
  async processJob({
    event,
    parsedEventBody,
    clientContext,
  }: {
    event: Message;
    parsedEventBody: any;
    clientContext: {
      deleteEvent: (messageReceiptHandle: string) => void;
    };
  }) {
    const job = await this.jobService.getJob({
      jobId: parsedEventBody.jobId,
      eventReceiptHandle: event.ReceiptHandle,
    });
    try {
      if (job.retryCount >= JOB_RETRY_LIMIT) {
        logger.error('Job failed mulitiple times, aborting the job.');
        clientContext.deleteEvent(job.receiptHandle);
      }
      await this.jobService.processJob(job);
      clientContext.deleteEvent(job.receiptHandle);
      logger.log('Job done');
    } catch (err) {
      logger.error(err);
    }
  }
}
