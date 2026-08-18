import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import {
  FOLLOW_UP_DEFAULT_PAGE,
  FOLLOW_UP_DEFAULT_PAGE_SIZE,
  FOLLOW_UP_DEFAULT_THRESHOLD_DAYS,
  FOLLOW_UP_MAX_PAGE_SIZE,
  FOLLOW_UP_MAX_THRESHOLD_DAYS,
} from '../analytics.types';

export class FollowUpsQueryDto {
  @ApiPropertyOptional({ default: FOLLOW_UP_DEFAULT_THRESHOLD_DAYS, minimum: 1, maximum: FOLLOW_UP_MAX_THRESHOLD_DAYS })
  @Transform(({ value }) => (value === undefined ? FOLLOW_UP_DEFAULT_THRESHOLD_DAYS : Number(value)))
  @IsInt()
  @Min(1)
  @Max(FOLLOW_UP_MAX_THRESHOLD_DAYS)
  thresholdDays = FOLLOW_UP_DEFAULT_THRESHOLD_DAYS;

  @ApiPropertyOptional({ default: FOLLOW_UP_DEFAULT_PAGE, minimum: 1 })
  @Transform(({ value }) => (value === undefined ? FOLLOW_UP_DEFAULT_PAGE : Number(value)))
  @IsInt()
  @Min(1)
  page = FOLLOW_UP_DEFAULT_PAGE;

  @ApiPropertyOptional({ default: FOLLOW_UP_DEFAULT_PAGE_SIZE, minimum: 1, maximum: FOLLOW_UP_MAX_PAGE_SIZE })
  @Transform(({ value }) => (value === undefined ? FOLLOW_UP_DEFAULT_PAGE_SIZE : Number(value)))
  @IsInt()
  @Min(1)
  @Max(FOLLOW_UP_MAX_PAGE_SIZE)
  pageSize = FOLLOW_UP_DEFAULT_PAGE_SIZE;
}
