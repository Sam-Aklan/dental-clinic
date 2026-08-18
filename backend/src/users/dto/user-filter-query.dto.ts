import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Locale, Role } from '../../generated/prisma/enums';

const sortFields = ['firstName', 'lastName', 'email', 'role', 'createdAt'] as const;
const sortDirections = ['asc', 'desc'] as const;
const statuses = ['active', 'disabled', 'all'] as const;

export class UserFilterQueryDto {
  @ApiPropertyOptional({ example: 'jan' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: Role, isArray: true })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? value : Array.isArray(value) ? value : [value]))
  @IsEnum(Role, { each: true })
  role?: Role[];

  @ApiPropertyOptional({ enum: statuses, example: 'active' })
  @IsOptional()
  @IsIn(statuses)
  status?: (typeof statuses)[number];

  @ApiPropertyOptional({ enum: Locale, example: Locale.EN })
  @IsOptional()
  @IsEnum(Locale)
  preferredLocale?: Locale;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? 1 : Number(value)))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? 20 : Number(value)))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @ApiPropertyOptional({ enum: sortFields })
  @IsOptional()
  @IsIn(sortFields)
  sortBy?: (typeof sortFields)[number];

  @ApiPropertyOptional({ enum: sortDirections })
  @IsOptional()
  @IsIn(sortDirections)
  sortDir?: (typeof sortDirections)[number];
}
