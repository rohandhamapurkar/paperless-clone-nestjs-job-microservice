import { Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export enum JOB_STATUS {
  PUSHED_TO_QUEUE = 'PUSHED_TO_QUEUE',
  IN_QUEUE = 'IN_QUEUE',
  PROCESSING_FILES = 'PROCESSING_FILES',
  DELETING_TEMP_FILES = 'DELETING_TEMP_FILES',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

@Schema()
export class JobChangelog {
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  status: JOB_STATUS;
  message: string;
  //   consumerId: string;
  createdOn: Date;
}

export const JobChangelogSchema = SchemaFactory.createForClass(JobChangelog);
