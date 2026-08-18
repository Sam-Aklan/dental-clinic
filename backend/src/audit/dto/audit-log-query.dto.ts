import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { AuditSortBy, AuditSortDir } from '../audit.types';

const sortByValues: AuditSortBy[] = ['createdAt', 'actor', 'action', 'targetType'];
const sortDirValues: AuditSortDir[] = ['asc', 'desc'];

function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => String(item).split(',').map((part) => part.trim()).filter(Boolean));
}

export class AuditLogQueryDto {
  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-05-05T23:59:59Z' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ example: '2c6a25d4-8e74-4d45-8f2d-fc4d8a2b4f2d' })
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @ApiPropertyOptional({ example: 'sara' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  actorName?: string;

  @ApiPropertyOptional({ isArray: true })
  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  action?: string[];

  @ApiPropertyOptional({ isArray: true })
  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  targetType?: string[];

  @ApiPropertyOptional({ example: 'cm4user789' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  targetId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 50;

  @ApiPropertyOptional({ enum: sortByValues, default: 'createdAt' })
  @IsOptional()
  @IsIn(sortByValues)
  sortBy: AuditSortBy = 'createdAt';

  @ApiPropertyOptional({ enum: sortDirValues, default: 'desc' })
  @IsOptional()
  @IsIn(sortDirValues)
  sortDir: AuditSortDir = 'desc';
}
