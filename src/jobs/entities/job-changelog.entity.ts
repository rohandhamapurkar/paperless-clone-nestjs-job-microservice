import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export enum JOB_STATUS {
  IN_QUEUE = 'IN_QUEUE',
  ASSERTING_JOB = 'ASSERTING_JOB',
  PROCESSING_FILES = 'PROCESSING_FILES',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

@Schema()
export class JobChangelog {
  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;
  @Prop({ required: true })
  jobId: mongoose.Types.ObjectId;
  @Prop({ required: true })
  status: JOB_STATUS;
  @Prop({ required: true })
  message: string;
  @Prop({ required: true })
  createdOn: Date;
}

export const JobChangelogSchema = SchemaFactory.createForClass(JobChangelog);
