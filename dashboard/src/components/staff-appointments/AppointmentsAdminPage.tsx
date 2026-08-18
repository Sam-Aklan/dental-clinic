import { useTranslation } from "react-i18next";
import { StaffQueuePage } from "@/components/queue";
import { Button } from "@/components/ui/button";
import { useStaffAppointmentUrlState } from "@/hooks/staff-appointments";
import { StaffWaitlistSection } from "./StaffWaitlistSection";

export function AppointmentsAdminPage() {
	const { i18n, t } = useTranslation();
	const { state, setTab } = useStaffAppointmentUrlState();
	const locale = i18n.language.startsWith("ar") ? "ar" : "en";
	const isWaitlistTab = state.tab === "waitlist";

	return (
		<section className="flex flex-col gap-4 p-4 md:p-6">
			<div className="flex flex-col gap-2">
				<div className="inline-flex flex-wrap gap-2" role="tablist" aria-label={t("appointments.tabs.label")}>
					<Button type="button" variant={!isWaitlistTab ? "default" : "outline"} size="sm" role="tab" aria-selected={!isWaitlistTab} onClick={() => setTab("today")}>
						{t("appointments.tabs.queue")}
					</Button>
					<Button type="button" variant={isWaitlistTab ? "default" : "outline"} size="sm" role="tab" aria-selected={isWaitlistTab} onClick={() => setTab("waitlist")}>
						{t("appointments.tabs.waitlist")}
					</Button>
				</div>
			</div>
			<div role="tabpanel">
				{isWaitlistTab ? <StaffWaitlistSection locale={locale} /> : <StaffQueuePage />}
			</div>
		</section>
	);
}
