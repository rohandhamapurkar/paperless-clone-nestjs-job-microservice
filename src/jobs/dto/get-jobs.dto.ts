import { IsNumber, IsString, IsDefined } from 'class-validator';
import { isObjectId } from '../decorators/isobjectid.decorator';

export class GetJobsDto {
  @IsNumber()
  pageNo: number;

  @IsNumber()
  limit: number;

  @isObjectId()
  @IsString()
  @IsDefined()
  userId: string;
}
