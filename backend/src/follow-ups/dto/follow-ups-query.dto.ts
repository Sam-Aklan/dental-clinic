import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { FollowUpStatus } from '../../generated/prisma/enums';

const CUID_REGEX = /^[a-z0-9]{25}$/i;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function toBoolean(value: unknown) {
  if (value === undefined) {
    return undefined;
  }
  if (value === true || value === 'true' || value === '1' || value === 1) {
    return true;
  }
  if (value === false || value === 'false' || value === '0' || value === 0) {
    return false;
  }
  return value;
}

function toStatusArray(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  return [value];
}

export class FollowUpsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(CUID_REGEX)
  doctorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(CUID_REGEX)
  patientId?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  patientName?: string;

  @ApiPropertyOptional({ isArray: true, enum: FollowUpStatus })
  @IsOptional()
  @Transform(({ value }) => toStatusArray(value))
  @IsEnum(FollowUpStatus, { each: true })
  status?: FollowUpStatus[];

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @Matches(DATE_ONLY_REGEX)
  from?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @Matches(DATE_ONLY_REGEX)
  to?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsOptional()
  @IsBoolean()
  overdueOnly?: boolean;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Transform(({ value }) => (value === undefined ? 1 : Number(value)))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Transform(({ value }) => (value === undefined ? 20 : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}
