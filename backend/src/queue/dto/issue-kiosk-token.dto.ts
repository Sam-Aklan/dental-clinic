import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

const CUID_REGEX = /^[a-z0-9]{25}$/i;

export class IssueKioskTokenDto {
  @ApiProperty()
  @IsString()
  @Matches(CUID_REGEX)
  doctorId!: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  expiresInDays?: number;
}
