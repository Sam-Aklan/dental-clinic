import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicConfigService } from '../clinic-config/clinic-config.service';
import { sanitizePayload } from './audit.constants';
import { AuditLogPageDto, AuditLogQueryDto, AuditLogDto, AuditActorDto } from './dto';
import { AuditSortBy, AuditSortDir, WriteAuditLogInput } from './audit.types';

type AuditRow = Prisma.AuditLogGetPayload<{
  include: {
    actor: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
        role: true;
      };
    };
  };
}>;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clinicConfigService: ClinicConfigService,
  ) {}

  async log(input: WriteAuditLogInput): Promise<void> {
    if (input.actorRole === 'PATIENT') {
      return;
    }

    try {
      const metadata = sanitizePayload(input.payload);
      await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId,
          action: input.action,
          entityType: input.targetType,
          entityId: input.targetId ?? null,
          ...(metadata ? { metadata: metadata as Prisma.InputJsonValue } : {}),
        },
      });
    } catch (error) {
      const message = `audit_write_failed action=${input.action} targetType=${input.targetType} actorId=${input.actorId} targetId=${input.targetId ?? ''}`;
      this.logger.error(message, error instanceof Error ? error.stack : undefined);
    }
  }

  async findLogs(query: AuditLogQueryDto): Promise<AuditLogPageDto> {
    const config = await this.clinicConfigService.getConfig();
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const where: Prisma.AuditLogWhereInput = {};

    if (query.actorId) {
      where.actorId = query.actorId;
    }

    if (query.action?.length) {
      where.action = { in: query.action };
    }

    if (query.targetType?.length) {
      where.entityType = { in: query.targetType };
    }

    if (query.targetId) {
      where.entityId = query.targetId;
    }

    if (query.actorName) {
      where.actor = {
        OR: [
          { firstName: { contains: query.actorName, mode: 'insensitive' } },
          { lastName: { contains: query.actorName, mode: 'insensitive' } },
          { email: { contains: query.actorName, mode: 'insensitive' } },
        ],
      };
    }

    const from = query.from ? this.normalizeQueryDate(query.from, config.timeZone, 'from') : null;
    const to = query.to ? this.normalizeQueryDate(query.to, config.timeZone, 'to') : null;

    if (from && to && to.getTime() < from.getTime()) {
      throw new BadRequestException('to must be greater than or equal to from');
    }

    if (from && to) {
      const rangeDays = DateTime.fromJSDate(to).diff(DateTime.fromJSDate(from), 'days').days;
      if (rangeDays > 366) {
        throw new BadRequestException('Date range must not exceed 366 days');
      }
    }

    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const orderBy = this.resolveOrderBy(query.sortBy ?? 'createdAt', query.sortDir ?? 'desc');

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const items = rows.map((row) => this.toDto(row as AuditRow));
    return {
      items,
      page,
      pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    };
  }

  private normalizeQueryDate(value: string, timeZone: string, field: 'from' | 'to'): Date {
    if (!value.includes('T')) {
      const day = DateTime.fromISO(value, { zone: timeZone });
      if (!day.isValid) {
        throw new BadRequestException(`Invalid ${field} date`);
      }
      return (field === 'from' ? day.startOf('day') : day.endOf('day')).toUTC().toJSDate();
    }

    const instant = DateTime.fromISO(value, { setZone: true });
    if (!instant.isValid) {
      throw new BadRequestException(`Invalid ${field} datetime`);
    }
    return instant.toUTC().toJSDate();
  }

  private resolveOrderBy(sortBy: AuditSortBy, sortDir: AuditSortDir): Prisma.AuditLogOrderByWithRelationInput {
    switch (sortBy) {
      case 'actor':
        return { actor: { firstName: sortDir } };
      case 'action':
        return { action: sortDir };
      case 'targetType':
        return { entityType: sortDir };
      case 'createdAt':
      default:
        return { createdAt: sortDir };
    }
  }

  private toDto(row: AuditRow): AuditLogDto {
    return {
      id: row.id,
      actorId: row.actorId,
      actor: row.actor ? this.toActorDto(row.actor) : null,
      action: row.action,
      targetType: row.entityType,
      targetId: row.entityId,
      payload: row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? (row.metadata as Record<string, unknown>) : null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toActorDto(actor: AuditRow['actor']): AuditActorDto {
    return {
      id: actor.id,
      firstName: actor.firstName,
      lastName: actor.lastName,
      email: actor.email,
      role: actor.role,
    };
  }
}
