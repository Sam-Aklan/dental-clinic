import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAppointmentsExportMutation } from "@/hooks/admin-dashboard";
import type { AdminAppointmentsExportFilters } from "@/types";

interface Props {
	filters: AdminAppointmentsExportFilters;
	labels: {
		export: string;
		exporting: string;
	};
}

export function ExportCsvButton({ filters, labels }: Props) {
	const mutation = useAdminAppointmentsExportMutation(filters);

	return (
		<Button type="button" variant="outline" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
			<Download className="mr-2 size-4" />
			{mutation.isPending ? labels.exporting : labels.export}
		</Button>
	);
}
