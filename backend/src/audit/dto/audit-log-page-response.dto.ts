import { ApiProperty } from '@nestjs/swagger';
import { AuditLogDto } from './audit-log-response.dto';

export class AuditLogPageDto {
  @ApiProperty({ type: () => AuditLogDto, isArray: true })
  items!: AuditLogDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}
