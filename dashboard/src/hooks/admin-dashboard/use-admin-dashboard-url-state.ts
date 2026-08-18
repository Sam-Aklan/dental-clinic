import { useCallback } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { ADMIN_DASHBOARD_AUTO_BUCKET, ADMIN_DASHBOARD_DEFAULT_PAGE_SIZE, ADMIN_DASHBOARD_DEFAULT_SORT_BY, ADMIN_DASHBOARD_DEFAULT_SORT_DIR, ADMIN_DASHBOARD_DEFAULT_THRESHOLD_DAYS } from "@/constants";
import type { AdminAppointmentsExportFilters, AdminAppointmentsFilters, AdminDashboardUrlState, AdminFollowUpsFilters, AdminWaitlistFilters } from "@/types";
import { getEffectiveTrendBucket, parseAdminDashboardSearch, serializeAdminDashboardSearch, updateAdminDashboardState } from "@/lib/admin-dashboard";

const dashboardRoute = getRouteApi("/_authenticated/_admin/admin/dashboard");

export function useAdminDashboardUrlState() {
	const search = dashboardRoute.useSearch();
	const navigate = dashboardRoute.useNavigate();
	const state = parseAdminDashboardSearch(search as never);

	const setState = useCallback(
		(patch: Partial<AdminDashboardUrlState>) => {
			const next = updateAdminDashboardState(state, patch);
			navigate({ search: serializeAdminDashboardSearch(next) as never });
		},
		[navigate, state],
	);

	const resetState = useCallback(() => {
		navigate({ search: serializeAdminDashboardSearch(parseAdminDashboardSearch({})) as never });
	}, [navigate]);

	const setTab = useCallback((tab: AdminDashboardUrlState["tab"]) => setState({ tab, page: 1 }), [setState]);
	const setDoctorId = useCallback((doctorId: string) => setState({ doctorId, page: 1 }), [setState]);
	const setStatus = useCallback((status: AdminDashboardUrlState["status"]) => setState({ status, page: 1 }), [setState]);
	const setPatientName = useCallback((patientName: string) => setState({ patientName, page: 1 }), [setState]);
	const setThresholdDays = useCallback((thresholdDays: number) => setState({ thresholdDays, page: 1 }), [setState]);
	const setPage = useCallback((page: number) => setState({ page }), [setState]);
	const setSort = useCallback((sortBy: AdminDashboardUrlState["sortBy"], sortDir: AdminDashboardUrlState["sortDir"]) => setState({ sortBy, sortDir, page: 1 }), [setState]);
	const setDateRange = useCallback((from: string, to: string) => setState({ from, to, page: 1 }), [setState]);
	const setBucket = useCallback((bucket: AdminDashboardUrlState["bucket"]) => setState({ bucket, page: 1 }), [setState]);

	const appointmentsFilters: AdminAppointmentsFilters = {
		from: state.from,
		to: state.to,
		doctorId: state.doctorId || undefined,
		status: state.status || undefined,
		patientName: state.patientName || undefined,
		page: state.page,
		pageSize: ADMIN_DASHBOARD_DEFAULT_PAGE_SIZE,
		sortBy: state.sortBy ?? ADMIN_DASHBOARD_DEFAULT_SORT_BY,
		sortDir: state.sortDir ?? ADMIN_DASHBOARD_DEFAULT_SORT_DIR,
	};

	const followUpsFilters: AdminFollowUpsFilters = {
		thresholdDays: state.thresholdDays || ADMIN_DASHBOARD_DEFAULT_THRESHOLD_DAYS,
		page: state.page,
		pageSize: ADMIN_DASHBOARD_DEFAULT_PAGE_SIZE,
	};

	const waitlistFilters: AdminWaitlistFilters = {
		page: state.page,
		pageSize: ADMIN_DASHBOARD_DEFAULT_PAGE_SIZE,
	};

	const exportFilters: AdminAppointmentsExportFilters = {
		from: state.from,
		to: state.to,
		doctorId: state.doctorId || undefined,
		status: state.status || undefined,
		patientName: state.patientName || undefined,
		sortBy: state.sortBy ?? ADMIN_DASHBOARD_DEFAULT_SORT_BY,
		sortDir: state.sortDir ?? ADMIN_DASHBOARD_DEFAULT_SORT_DIR,
	};

	return {
		state,
		effectiveBucket: getEffectiveTrendBucket(state.from, state.to, state.bucket),
		appointmentsFilters,
		followUpsFilters,
		waitlistFilters,
		exportFilters,
		setState,
		resetState,
		setTab,
		setDoctorId,
		setStatus,
		setPatientName,
		setThresholdDays,
		setPage,
		setSort,
		setDateRange,
		setBucket,
		isAutoBucket: state.bucket === ADMIN_DASHBOARD_AUTO_BUCKET,
	} as const;
}
