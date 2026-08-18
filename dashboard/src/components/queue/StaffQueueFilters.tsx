import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon, LoaderCircleIcon, SearchIcon } from "lucide-react";
import type { AppointmentStatus, StaffQueueFilterState } from "@/types";

interface StaffQueueFiltersProps {
	state: StaffQueueFilterState;
	doctorOptions: Array<{ id: string; label: string }>;
	doctorSearch: string;
	doctorSearchOpen: boolean;
	selectedDoctorLabels: string[];
	isDoctorOptionsLoading: boolean;
	statusOptions: Array<{ value: AppointmentStatus; label: string }>;
	onDoctorToggle: (doctorId: string) => void;
	onDoctorSearchChange: (search: string) => void;
	onDoctorSearchOpenChange: (open: boolean) => void;
	onStatusToggle: (status: AppointmentStatus) => void;
	onSearchChange: (search: string) => void;
	onClear: () => void;
	onRefresh: () => void;
	labels: { search: string; doctors: string; statuses: string; clear: string; refresh: string };
}

function getDoctorTriggerLabel(selectedDoctorLabels: string[], doctorsLabel: string) {
	if (selectedDoctorLabels.length === 0) {
		return doctorsLabel;
	}
	if (selectedDoctorLabels.length === 1) {
		return selectedDoctorLabels[0];
	}
	return `${selectedDoctorLabels[0]} +${selectedDoctorLabels.length - 1}`;
}

export function StaffQueueFilters({ state, doctorOptions, doctorSearch, doctorSearchOpen, selectedDoctorLabels, isDoctorOptionsLoading, statusOptions, onDoctorToggle, onDoctorSearchChange, onDoctorSearchOpenChange, onStatusToggle, onSearchChange, onClear, onRefresh, labels }: StaffQueueFiltersProps) {
	return (
		<div className="grid gap-4 rounded-lg border p-4">
			<div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
				<div className="grid gap-2">
					<label className="text-sm font-medium" htmlFor="queue-search">{labels.search}</label>
					<Input id="queue-search" value={state.search} onChange={(event) => onSearchChange(event.target.value)} placeholder={labels.search} />
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={onClear}>{labels.clear}</Button>
					<Button onClick={onRefresh}>{labels.refresh}</Button>
				</div>
			</div>
			<div className="grid gap-3 md:grid-cols-2">
				<div className="grid gap-2">
					<p className="text-sm font-medium">{labels.doctors}</p>
					<Popover open={doctorSearchOpen} onOpenChange={onDoctorSearchOpenChange}>
						<PopoverTrigger asChild>
							<Button type="button" variant="outline" className="w-full justify-between text-start font-normal">
								<span className="truncate">{getDoctorTriggerLabel(selectedDoctorLabels, labels.doctors)}</span>
								<ChevronDownIcon className="size-4 text-muted-foreground" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[min(24rem,var(--radix-popover-trigger-width))] p-0" align="start">
							<div className="border-b border-border p-3">
								<div className="relative">
									<SearchIcon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										type="search"
										value={doctorSearch}
										onChange={(event) => onDoctorSearchChange(event.target.value)}
										placeholder={labels.doctors}
										className="ps-9"
										aria-label={labels.doctors}
									/>
								</div>
							</div>
							<div className="max-h-64 overflow-y-auto p-1">
								{isDoctorOptionsLoading ? (
									<div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
										<LoaderCircleIcon className="size-4 animate-spin" />
										<span>{labels.refresh}</span>
									</div>
								) : doctorOptions.length > 0 ? (
									doctorOptions.map((doctor) => {
										const isSelected = state.doctorIds.includes(doctor.id);
										return (
											<button
												key={doctor.id}
												type="button"
												onClick={() => onDoctorToggle(doctor.id)}
												className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm hover:bg-muted"
											>
												<CheckIcon className={cn("size-4", isSelected ? "opacity-100" : "opacity-0")} />
												<span className="truncate">{doctor.label}</span>
											</button>
										);
									})
								) : (
									<div className="px-3 py-6 text-sm text-muted-foreground">{labels.doctors}</div>
								)}
							</div>
						</PopoverContent>
					</Popover>
				</div>
				<div className="grid gap-2">
					<p className="text-sm font-medium">{labels.statuses}</p>
					<div className="flex flex-wrap gap-2">
						{statusOptions.map((status) => (
							<Button key={status.value} type="button" variant={state.statuses.includes(status.value) ? "default" : "outline"} size="sm" onClick={() => onStatusToggle(status.value)}>
								{status.label}
							</Button>
						))}
					</div>
				</div>
			</div>
			<div className="flex flex-wrap gap-2">
				{selectedDoctorLabels.map((label) => <Badge key={label} variant="secondary">{label}</Badge>)}
				{state.statuses.map((status) => <Badge key={status} variant="secondary">{status}</Badge>)}
			</div>
		</div>
	);
}
