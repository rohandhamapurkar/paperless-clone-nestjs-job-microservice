import { Type } from 'class-transformer';
import { IsDefined, IsString } from 'class-validator';
import { IsObjectId } from '../decorators/isobjectid.decorator';
import { DataConfigType } from '../entities/job.entity';

export class CreateJobDto {
  @IsObjectId()
  @IsString()
  @IsDefined()
  userId: string;

  @IsString()
  @IsDefined()
  uuid: string;

  @IsDefined()
  @Type(() => DataConfigType)
  dataConfig: DataConfigType;

  @IsObjectId()
  @IsString()
  @IsDefined()
  templateId: string;
}
