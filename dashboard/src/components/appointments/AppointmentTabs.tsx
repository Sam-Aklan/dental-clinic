import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { AppointmentTab } from "@/types";
import { APPOINTMENT_TABS, APPOINTMENT_TAB_LABELS } from "@/constants/appointments";

interface AppointmentTabsProps {
	activeTab: AppointmentTab;
	onChange: (tab: AppointmentTab) => void;
	label: string;
}

export function AppointmentTabs({ activeTab, onChange, label }: AppointmentTabsProps) {
	const { t } = useTranslation();
	return (
		<div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
			{APPOINTMENT_TABS.map((tab) => {
				const selected = tab === activeTab;
				return (
					<Button
						key={tab}
						role="tab"
						aria-selected={selected}
						variant={selected ? "default" : "outline"}
						onClick={() => onChange(tab)}
						className="min-w-24"
					>
						{t(APPOINTMENT_TAB_LABELS[tab])}
					</Button>
				);
			})}
		</div>
	);
}
