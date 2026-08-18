import { api } from "@/lib/axios-instance";
import { AUDIT } from "@/lib/api-paths";
import { buildAuditSummary } from "@/lib/audit-log/helpers";
import type { AuditFilterParams, PaginatedAuditResponse } from "@/types";

type AuditActorApiItem = {
	id: string;
	firstName: string | null;
	lastName: string | null;
	email: string | null;
	role: string;
};

type AuditLogApiItem = {
	id: string;
	actorId: string | null;
	actor: AuditActorApiItem | null;
	action: string;
	targetType: string;
	targetId: string | null;
	payload: Record<string, unknown> | null;
	createdAt: string;
};

type PaginatedAuditApiResponse = {
	items: AuditLogApiItem[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

function adaptAuditItem(item: AuditLogApiItem) {
	return {
		id: item.id,
		createdAt: item.createdAt,
		actorId: item.actorId,
		actor: item.actor
			? {
				id: item.actor.id,
				firstName: item.actor.firstName,
				lastName: item.actor.lastName,
				role: item.actor.role,
			  }
			: null,
		action: item.action,
		target: {
			type: item.targetType,
			id: item.targetId,
		},
		summary: buildAuditSummary(item.action, item.targetType, item.targetId),
		payload: item.payload,
	};
}

export async function getAuditLog(params: AuditFilterParams): Promise<PaginatedAuditResponse> {
	const response = await api.get(AUDIT, { params });
	const page = response.data.data as PaginatedAuditApiResponse;

	return {
		...page,
		items: page.items.map(adaptAuditItem),
	};
}
