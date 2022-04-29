import { IsNumber, IsString, IsDefined } from 'class-validator';
import { IsObjectId } from '../decorators/isobjectid.decorator';

/**
 * jobs service endpoint params validation
 */
export class GetJobsDto {
  @IsNumber()
  pageNo: number;

  @IsNumber()
  limit: number;

  @IsObjectId()
  @IsString()
  @IsDefined()
  userId: string;
}
