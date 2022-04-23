import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
  Transport,
} from '@nestjs/microservices';
import { JOB_SERVICE_MESSAGE_PATTERNS } from './constants';
import { CreateJobDto } from './dto/create-job.dto';
@UsePipes(new ValidationPipe())
@Controller('jobs')
export class JobsController {
  @MessagePattern(JOB_SERVICE_MESSAGE_PATTERNS.CREATE_JOB, Transport.RMQ)
  getNotifications(@Payload() data: CreateJobDto, @Ctx() context: RmqContext) {
    console.log(data, context.getPattern());
  }

  @MessagePattern(JOB_SERVICE_MESSAGE_PATTERNS.GET_JOB, Transport.TCP)
  async accumulate(data: number[]): Promise<number> {
    return (data || []).reduce((a, b) => a + b);
  }
}
