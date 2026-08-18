import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class RescheduleDto {
  @ApiProperty({ format: 'date-time' })
  @IsISO8601({ strict: true, strictSeparator: true })
  startsAt!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;
}
