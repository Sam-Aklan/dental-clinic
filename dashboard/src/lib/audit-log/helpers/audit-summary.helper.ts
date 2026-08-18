export function buildAuditSummary(action: string, targetType: string, targetId: string | null) {
	const label = action.toLowerCase().replace(/_/g, " ");
	return targetId ? `${label} · ${targetType} ${targetId.slice(0, 8)}` : `${label} · ${targetType}`;
}
