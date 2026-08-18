import { useMutation } from "@tanstack/react-query";
import { exportAdminAppointments } from "@/lib/admin-dashboard";
import { showError, showSuccess } from "@/lib/toast";
import type { AdminAppointmentsExportFilters } from "@/types";

function triggerDownload(blob: Blob) {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = `admin-dashboard-appointments.csv`;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

export function useAdminAppointmentsExportMutation(filters: AdminAppointmentsExportFilters) {
	const mutation = useMutation({
		mutationKey: ["admin-dashboard", "export", filters],
		mutationFn: () => exportAdminAppointments(filters),
		onSuccess: (blob) => {
			triggerDownload(blob);
			showSuccess("Export completed");
		},
		onError: () => {
			showError("Export failed");
		},
	});

	return mutation;
}
