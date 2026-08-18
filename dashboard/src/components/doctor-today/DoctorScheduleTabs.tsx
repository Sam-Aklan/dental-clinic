import { Button } from "@/components/ui/button";

interface Props {
	activeTab: "today" | "thisWeek";
	onChange: (tab: "today" | "thisWeek") => void;
	todayLabel: string;
	thisWeekLabel: string;
}

export function DoctorScheduleTabs({ activeTab, onChange, todayLabel, thisWeekLabel }: Props) {
	return (
		<div className="flex flex-wrap gap-2">
			<Button type="button" variant={activeTab === "today" ? "default" : "outline"} onClick={() => onChange("today")} aria-pressed={activeTab === "today"}>{todayLabel}</Button>
			<Button type="button" variant={activeTab === "thisWeek" ? "default" : "outline"} onClick={() => onChange("thisWeek")} aria-pressed={activeTab === "thisWeek"}>{thisWeekLabel}</Button>
		</div>
	);
}
