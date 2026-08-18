import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, Matches, ValidateIf } from 'class-validator';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export class WorkingHourDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  isClosed!: boolean;

  @ApiPropertyOptional({ example: '09:00', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @Matches(timeRegex, { message: 'startTime must be in HH:mm format' })
  startTime?: string | null;

  @ApiPropertyOptional({ example: '17:00', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @Matches(timeRegex, { message: 'endTime must be in HH:mm format' })
  endTime?: string | null;
}
