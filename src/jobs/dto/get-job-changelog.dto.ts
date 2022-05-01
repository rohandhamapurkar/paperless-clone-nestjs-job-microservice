import { IsString, IsDefined } from 'class-validator';
import { IsObjectId } from '../decorators/isobjectid.decorator';

/**
 * Job changelog service endpoint param validation
 */
export class GetJobsChangelogDto {
  @IsObjectId()
  @IsString()
  @IsDefined()
  jobId: string;

  @IsString()
  @IsDefined()
  userId: string;
}
