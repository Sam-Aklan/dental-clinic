import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, IsISO8601 } from 'class-validator';

const CUID_REGEX = /^[a-z0-9]{25}$/i;

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  @Matches(CUID_REGEX)
  doctorId!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601({ strict: true, strictSeparator: true })
  startsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(CUID_REGEX)
  patientId?: string;
}
