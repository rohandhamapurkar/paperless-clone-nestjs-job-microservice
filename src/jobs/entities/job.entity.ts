import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { DATA_CONFIG_TYPES } from '../constants';

class FabricObjectPosition {
  angle: number;
  scaleX: number;
  scaleY: number;
  left: number;
  top: number;
}

class FabricObjectStyle {
  color: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: '' | 'normal' | 'italic' | 'oblique';
  fontWeight: string;
  horizontalAlignment: string;
  underline: boolean;
}

class FabricImageAttribute {
  angle: number;
  opacity: number;
  scaleX: number;
  scaleY: number;
}

export class DataConfigType {
  type: DATA_CONFIG_TYPES;
  datasetId?: string;
  dataField?: string;
  url?: string;
  scale?: number;
  attributes?: FabricImageAttribute;
  position: FabricObjectPosition;
  style?: FabricObjectStyle;
  text?: string;
}

/**
 * Job Schema is used for defining mongodb collection
 * for storing job documents
 */
@Schema()
export class Job {
  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;
  @Prop({ required: true })
  uuid: string;
  @Prop({ required: true })
  retryCount: number;
  @Prop({ required: true })
  createdOn: Date;
  @Prop({ required: true })
  dataConfig: DataConfigType[];
  @Prop({ required: true })
  templateId: mongoose.Types.ObjectId;
  @Prop()
  outputFileLink: string;
  @Prop()
  outputFileId: string;
}

const JobSchema = SchemaFactory.createForClass(Job);
JobSchema.index({ uuid: 1 }, { unique: true });
export { JobSchema };
