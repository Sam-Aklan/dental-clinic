import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { DateRangeQueryDto } from './date-range-query.dto';
import { ANALYTICS_DAY_AND_WEEK_BUCKETS } from '../analytics.types';

export class CancellationTrendsQueryDto extends DateRangeQueryDto {
  @ApiProperty({ enum: ANALYTICS_DAY_AND_WEEK_BUCKETS })
  @IsIn(ANALYTICS_DAY_AND_WEEK_BUCKETS)
  bucket!: 'day' | 'week';
}
