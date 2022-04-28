import { IsString, IsDefined } from 'class-validator';
import { isObjectId } from '../decorators/isobjectid.decorator';

export class GetJobsChangelogDto {
  @isObjectId()
  @IsString()
  @IsDefined()
  jobId: string;

  @isObjectId()
  @IsString()
  @IsDefined()
  userId: string;
}
