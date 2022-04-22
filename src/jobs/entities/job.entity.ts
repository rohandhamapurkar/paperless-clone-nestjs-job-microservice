import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

type FabricObjectPosition = {
  angle: number;
  scaleX: number;
  scaleY: number;
  left: number;
  top: number;
};

type FabricObjectStyle = {
  color: string;
  fontFamily: string;
  fontSize: string;
  fontStyle: string;
  fontWeight: string;
  horizontalAlignment: string;
  underline: boolean;
};

type FabricImageAttribute = {
  angle: number;
  opacity: number;
  scaleX: number;
  scaleY: number;
};

type DataConfigType = {
  type: string;
  datasetId?: string;
  dataField?: string;
  url?: string;
  attributes?: FabricImageAttribute;
  position: FabricObjectPosition;
  style?: FabricObjectStyle;
  text?: string;
}[];

@Schema()
export class Job {
  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;
  @Prop({ required: true })
  retryCount: number;
  @Prop({ required: true })
  createdOn: Date;
  @Prop({ required: true })
  dataConfig: DataConfigType;
  @Prop({ required: true })
  templateId: mongoose.Types.ObjectId;
}

export const JobSchema = SchemaFactory.createForClass(Job);
