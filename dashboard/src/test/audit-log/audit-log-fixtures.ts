import type { AuditLogEntry, AuditLogUrlState, PaginatedAuditResponse } from "@/types";

export const auditLogApiItemFixture = {
	id: "audit-1",
	actorId: "user-1",
	actor: { id: "user-1", firstName: "Jane", lastName: "Doe", email: "jane@example.com", role: "ADMIN" },
	action: "APPOINTMENT_CANCELED",
	targetType: "APPOINTMENT",
	targetId: "appt-1",
	payload: { reason: "Patient request", nested: { password: "secret" } },
	createdAt: "2026-05-11T08:30:00.000Z",
};

export const auditLogApiResponseFixture = {
	items: [auditLogApiItemFixture],
	total: 1,
	page: 1,
	pageSize: 50,
	totalPages: 1,
};

export const auditLogEntryFixture: AuditLogEntry = {
	id: "audit-1",
	createdAt: "2026-05-11T08:30:00.000Z",
	actor: { id: "user-1", firstName: "Jane", lastName: "Doe", role: "ADMIN" },
	actorId: "user-1",
	action: "APPOINTMENT_CANCELED",
	target: { type: "APPOINTMENT", id: "appt-1" },
	summary: "appointment canceled · APPOINTMENT appt-1",
	payload: { reason: "Patient request", nested: { password: "secret" } },
};

export const auditLogResponseFixture: PaginatedAuditResponse = {
	items: [auditLogEntryFixture],
	total: 1,
	page: 1,
	pageSize: 50,
	totalPages: 1,
};

export const auditLogStateFixture: AuditLogUrlState = {
	from: "2026-05-04",
	to: "2026-05-11",
	page: 1,
	pageSize: 50,
	sortBy: "createdAt",
	sortDir: "desc",
};
