import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { IsIanaTimezone } from '../../common/decorators/is-iana-timezone.decorator';
import { IsMultipleOf } from '../../common/decorators/is-multiple-of.decorator';

export class UpdateClinicConfigDto {
  @ApiPropertyOptional({ example: 'Asia/Riyadh' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsIanaTimezone({ message: 'timeZone must be a valid IANA timezone identifier' })
  timeZone?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(180)
  @IsMultipleOf(5, { message: 'slotDurationMinutes must be a multiple of 5' })
  slotDurationMinutes?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  reminderHoursBefore?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  offerWindowMinutes?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  minArrivalMinutes?: number;
}
