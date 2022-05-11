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

export class FabricObjectStyle {
  originX?: string | undefined;
  originY?: string | undefined;
  height?: number | undefined;
  color?: string | undefined;
  backgroundColor?: string | undefined;
  fontFamily?: string | undefined;
  fontWeight?: string | number | undefined;
  fontSize?: number | undefined;
  underline?: boolean | undefined;
  strikeThrough?: boolean | undefined;
  horizontalAlignment?: string | undefined;
  fontStyle?: '' | 'normal' | 'italic' | 'oblique' | undefined;
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
  userId: string;
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
