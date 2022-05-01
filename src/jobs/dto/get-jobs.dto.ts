import { IsNumber, IsString, IsDefined } from 'class-validator';

/**
 * jobs service endpoint params validation
 */
export class GetJobsDto {
  @IsNumber()
  pageNo: number;

  @IsNumber()
  limit: number;

  @IsString()
  @IsDefined()
  userId: string;
}
