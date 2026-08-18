import type { TFunction } from "i18next";

export function getAuditActionLabel(action: string, t: TFunction) {
	return t(`auditLog.actions.${action}`, action);
}
