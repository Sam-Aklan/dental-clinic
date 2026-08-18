import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, Matches } from 'class-validator';

const CUID_REGEX = /^[a-z0-9]{25}$/i;

export class WaitlistQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(CUID_REGEX)
  doctorId?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? 1 : Number(value)))
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? 20 : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}
