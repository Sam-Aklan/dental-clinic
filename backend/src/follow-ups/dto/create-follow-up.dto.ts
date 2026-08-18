import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsISO8601, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const CUID_REGEX = /^[a-z0-9]{25}$/i;

export class CreateFollowUpDto {
  @ApiProperty()
  @IsString()
  @Matches(CUID_REGEX)
  patientId!: string;

  @ApiProperty()
  @IsString()
  @Matches(CUID_REGEX)
  doctorId!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601({ strict: true, strictSeparator: true })
  startsAt!: string;

  @ApiProperty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(CUID_REGEX)
  sourceAppointmentId?: string;
}
