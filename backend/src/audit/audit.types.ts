import { UserRole } from '../common/types/authenticated-user.type';

export type AuditSortBy = 'createdAt' | 'actor' | 'action' | 'targetType';
export type AuditSortDir = 'asc' | 'desc';

export interface WriteAuditLogInput {
  actorId: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId?: string | null;
  payload?: Record<string, unknown> | null;
}
