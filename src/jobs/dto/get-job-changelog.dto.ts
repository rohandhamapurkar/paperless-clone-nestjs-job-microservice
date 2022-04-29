import { IsString, IsDefined } from 'class-validator';
import { IsObjectId } from '../decorators/isobjectid.decorator';

export class GetJobsChangelogDto {
  @IsObjectId()
  @IsString()
  @IsDefined()
  jobId: string;

  @IsObjectId()
  @IsString()
  @IsDefined()
  userId: string;
}
