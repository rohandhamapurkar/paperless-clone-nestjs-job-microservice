import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

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
  fontSize: string;
  fontStyle: string;
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
  type: string;
  datasetId?: string;
  dataField?: string;
  url?: string;
  attributes?: FabricImageAttribute;
  position: FabricObjectPosition;
  style?: FabricObjectStyle;
  text?: string;
}
[];

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
