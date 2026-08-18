export type AuditSortField = "createdAt" | "actor" | "action" | "targetType";
export type AuditSortDir = "asc" | "desc";
export type AuditPageSize = 25 | 50 | 100;

export interface AuditActor {
	id: string;
	firstName: string | null;
	lastName: string | null;
	role: string | null;
}

export interface AuditTarget {
	type: string;
	id: string | null;
}

export interface AuditLogEntry {
	id: string;
	createdAt: string;
	actor: AuditActor | null;
	actorId: string | null;
	action: string;
	target: AuditTarget;
	summary: string;
	payload: Record<string, unknown> | null;
}

export interface AuditFilterParams {
	from: string;
	to: string;
	actorId?: string;
	actorName?: string;
	action?: string;
	targetType?: string;
	targetId?: string;
	page: number;
	pageSize: AuditPageSize;
	sortBy: AuditSortField;
	sortDir: AuditSortDir;
}

export interface AuditLogUrlState {
	from: string;
	to: string;
	actorId?: string;
	actorName?: string;
	action?: string;
	targetType?: string;
	targetId?: string;
	page: number;
	pageSize: AuditPageSize;
	sortBy: AuditSortField;
	sortDir: AuditSortDir;
}

export interface PaginatedAuditResponse {
	items: AuditLogEntry[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}
