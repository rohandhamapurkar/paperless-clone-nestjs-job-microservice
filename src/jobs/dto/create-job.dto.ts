import { Type } from 'class-transformer';
import { IsDefined, IsString } from 'class-validator';
import { isObjectId } from '../decorators/isobjectid.decorator';
import { DataConfigType } from '../entities/job.entity';

export class CreateJobDto {
  @isObjectId()
  @IsString()
  @IsDefined()
  userId: string;

  @IsDefined()
  @Type(() => DataConfigType)
  dataConfig: DataConfigType;

  @isObjectId()
  @IsString()
  @IsDefined()
  templateId: string;
}
