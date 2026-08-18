import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateScheduleOverrideDto {
  @ApiProperty({ example: '2026-07-01' })
  @IsString()
  @Matches(dateRegex, { message: 'date must be a valid YYYY-MM-DD string' })
  date: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isUnavailable: boolean;

  @ApiPropertyOptional({ example: '09:00', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Matches(timeRegex, { message: 'startTime must be in HH:mm format' })
  startTime?: string | null;

  @ApiPropertyOptional({ example: '13:00', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Matches(timeRegex, { message: 'endTime must be in HH:mm format' })
  endTime?: string | null;

  @ApiPropertyOptional({ example: 'Conference leave', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(250)
  reason?: string | null;
}
