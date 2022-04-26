import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from './entities/job.entity';
import {
  JobChangelog,
  JobChangelogSchema,
} from './entities/job-changelog.entity';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Job.name, schema: JobSchema },
        { name: JobChangelog.name, schema: JobChangelogSchema },
      ],
      'paperless-db',
    ),
  ],
  providers: [ConfigModule, JobsService],
  controllers: [JobsController],
})
export class JobsModule {}
