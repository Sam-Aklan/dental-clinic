import type { AdminAppointmentSortField, DashboardTab, TrendBucket } from "@/types";

export const ADMIN_DASHBOARD_ROUTE = "/admin/dashboard" as const;
export const ADMIN_DASHBOARD_DEFAULT_TAB: DashboardTab = "appointments";
export const ADMIN_DASHBOARD_DEFAULT_THRESHOLD_DAYS = 90;
export const ADMIN_DASHBOARD_DEFAULT_PAGE_SIZE = 20;
export const ADMIN_DASHBOARD_DEFAULT_SORT_BY: AdminAppointmentSortField = "startsAt";
export const ADMIN_DASHBOARD_DEFAULT_SORT_DIR = "asc" as const;
export const ADMIN_DASHBOARD_AUTO_BUCKET = "auto" as const;
export const ADMIN_DASHBOARD_ALLOWED_BUCKETS: TrendBucket[] = ["day", "week", "month"];
