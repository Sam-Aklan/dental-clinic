import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { DateRangeQueryDto } from './date-range-query.dto';
import { ANALYTICS_BUCKETS } from '../analytics.types';

export class BucketedRangeQueryDto extends DateRangeQueryDto {
  @ApiProperty({ enum: ANALYTICS_BUCKETS })
  @IsIn(ANALYTICS_BUCKETS)
  bucket!: 'day' | 'week' | 'month';
}
