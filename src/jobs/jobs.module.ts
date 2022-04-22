import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [ConfigModule, JobsService],
  controllers: [JobsController],
})
export class JobsModule {}
