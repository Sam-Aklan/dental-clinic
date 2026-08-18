import type { AuditPageSize, AuditSortDir, AuditSortField } from "@/types";

export const AUDIT_DEFAULT_PAGE_SIZE: AuditPageSize = 50;
export const AUDIT_PAGE_SIZE_OPTIONS: AuditPageSize[] = [25, 50, 100];
export const AUDIT_DEFAULT_SORT_BY: AuditSortField = "createdAt";
export const AUDIT_DEFAULT_SORT_DIR: AuditSortDir = "desc";
export const AUDIT_DEFAULT_DAYS = 7;
export const AUDIT_SENSITIVE_KEYS = ["password", "token", "refreshtoken", "accesstoken", "authorization", "secret"] as const;
export const AUDIT_LARGE_PAYLOAD_THRESHOLD = 5_000;
export const AUDIT_LARGE_PAYLOAD_PREVIEW_LINES = 20;
