import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, Matches } from 'class-validator';
import { IsCalendarDate } from '../../common/decorators/is-calendar-date.decorator';
import { AppointmentStatus } from '../../generated/prisma/enums';

const CUID_REGEX = /^[a-z0-9]{25}$/i;

function toArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

export class AppointmentsQueryDto {
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsCalendarDate()
  from?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsCalendarDate()
  to?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsCalendarDate()
  date?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @Matches(CUID_REGEX, { each: true })
  doctorId?: string[];

  @ApiPropertyOptional({ type: [String], enum: AppointmentStatus })
  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @IsEnum(AppointmentStatus, { each: true })
  status?: AppointmentStatus[];

  @ApiPropertyOptional({ maxLength: 100, description: 'Searches patient first name, last name, or phone number for staff users.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  patientName?: string;

  @ApiPropertyOptional({ description: 'Filter by patient user ID.' })
  @IsOptional()
  @IsString()
  @Matches(CUID_REGEX)
  patientId?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({ enum: ['startsAt', 'createdAt', 'status', 'patientName'] })
  @IsOptional()
  @IsString()
  sortBy?: 'startsAt' | 'createdAt' | 'status' | 'patientName' = 'startsAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortDir?: 'asc' | 'desc' = 'asc';
}
