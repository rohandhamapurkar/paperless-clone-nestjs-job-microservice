import {
  IsString,
  IsDefined,
  IsOptional,
  IsNumberString,
} from 'class-validator';

/**
 * jobs service endpoint params validation
 */
export class GetJobsDto {
  @IsOptional()
  @IsNumberString()
  pageNo = '1';

  @IsOptional()
  @IsNumberString()
  pageSize = '10';

  @IsString()
  @IsDefined()
  userId: string;
}
