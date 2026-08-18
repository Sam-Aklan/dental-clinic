import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/shared";
import { cn } from "@/lib/utils";
import type { AppointmentDoctor, AppointmentStatus, AppointmentTab } from "@/types";
import { APPOINTMENT_STATUS_LABELS } from "@/constants/appointments";
import { getAllowedStatusesForTab } from "@/lib/appointments/helpers";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface AppointmentFiltersProps {
	activeTab: AppointmentTab;
	doctors: AppointmentDoctor[];
	selectedDoctorId: string | null;
	selectedStatuses: AppointmentStatus[];
	onDoctorChange: (doctorId: string | null) => void;
	onStatusToggle: (status: AppointmentStatus) => void;
	onClear: () => void;
	labelDoctor: string;
	labelStatuses: string;
	labelAllDoctors: string;
	labelClear: string;
	sortBy: "startsAt" | "createdAt";
	sortDir: "asc" | "desc";
	onSortByChange: (sortBy: "startsAt" | "createdAt") => void;
	onSortDirChange: (sortDir: "asc" | "desc") => void;
}

export function AppointmentFilters({
	activeTab,
	doctors,
	selectedDoctorId,
	selectedStatuses,
	onDoctorChange,
	onStatusToggle,
	onClear,
	labelDoctor,
	labelStatuses,
	labelAllDoctors,
	labelClear,
	sortBy,
	sortDir,
	onSortByChange,
	onSortDirChange,
}: AppointmentFiltersProps) {
	const { t } = useTranslation();
	const allowedStatuses = getAllowedStatusesForTab(activeTab);

	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 300);

	const filteredDoctors = doctors.filter((doctor) => {
		const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
		return fullName.includes(debouncedSearchQuery.toLowerCase());
	});

	const selectedDoctor = doctors.find((doctor) => doctor.id === selectedDoctorId);
	const triggerLabel = selectedDoctor
		? `${selectedDoctor.firstName} ${selectedDoctor.lastName}`
		: labelAllDoctors;

	return (
		<div className="grid gap-4 rounded-xl border bg-card p-4">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="grid gap-2">
					<label htmlFor="appointment-doctor-filter" className="text-sm font-medium">
						{labelDoctor}
					</label>
					<Popover open={open} onOpenChange={(isOpen) => {
						setOpen(isOpen);
						if (!isOpen) setSearchQuery("");
					}}>
						<PopoverTrigger asChild>
							<Button
								id="appointment-doctor-filter"
								variant="outline"
								role="combobox"
								aria-expanded={open}
								className="h-10 w-full justify-between bg-background border-border text-foreground hover:bg-muted text-sm font-normal px-3"
							>
								<span className="truncate">{triggerLabel}</span>
								<ChevronDownIcon className="size-4 opacity-50 shrink-0 ml-2" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[--radix-popover-trigger-width] p-1 bg-popover text-popover-foreground shadow-md border rounded-md" align="start">
							<div className="p-2 border-b border-border">
								<Input
									placeholder={t("appointments.filters.searchDoctorPlaceholder", { defaultValue: "Search doctor..." })}
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-9 text-sm"
									autoFocus
								/>
							</div>
							<div className="max-h-60 overflow-y-auto p-1 space-y-1">
								<button
									type="button"
									onClick={() => {
										onDoctorChange(null);
										setOpen(false);
									}}
									className={cn(
										"relative flex w-full cursor-default items-center rounded-sm py-1.5 px-2 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground text-left",
										!selectedDoctorId && "bg-accent text-accent-foreground"
									)}
								>
									<span className="flex-1 truncate">{labelAllDoctors}</span>
									{!selectedDoctorId && <CheckIcon className="size-4 shrink-0 ml-2" />}
								</button>
								{filteredDoctors.map((doctor) => {
									const isSelected = doctor.id === selectedDoctorId;
									return (
										<button
											key={doctor.id}
											type="button"
											onClick={() => {
												onDoctorChange(doctor.id);
												setOpen(false);
											}}
											className={cn(
												"relative flex w-full cursor-default items-center rounded-sm py-1.5 px-2 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground text-left",
												isSelected && "bg-accent/50 font-medium"
											)}
										>
											<span className="flex-1 truncate">
												{doctor.firstName} {doctor.lastName}
											</span>
											{isSelected && <CheckIcon className="size-4 shrink-0 ml-2" />}
										</button>
									);
								})}
								{filteredDoctors.length === 0 && (
									<div className="py-6 text-center text-sm text-muted-foreground">
										{t("appointments.filters.noDoctorsFound", { defaultValue: "No doctor found" })}
									</div>
								)}
							</div>
						</PopoverContent>
					</Popover>
				</div>

				<div className="grid gap-2">
					<label htmlFor="appointment-sort-by" className="text-sm font-medium">
						{t("appointments.filters.sortBy", { defaultValue: "Sort by" })}
					</label>
					<Select value={sortBy} onValueChange={(val) => onSortByChange(val as "startsAt" | "createdAt")}>
						<SelectTrigger id="appointment-sort-by" className="h-10 bg-background border-border text-foreground hover:bg-muted text-sm font-normal px-3">
							<SelectValue placeholder={t("appointments.filters.sortBy", { defaultValue: "Sort by" })} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="startsAt">
								{t("appointments.filters.startsAt", { defaultValue: "Start time" })}
							</SelectItem>
							<SelectItem value="createdAt">
								{t("appointments.filters.createdAt", { defaultValue: "Booking date" })}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="grid gap-2">
					<label htmlFor="appointment-sort-dir" className="text-sm font-medium">
						{t("appointments.filters.sortDir", { defaultValue: "Sort direction" })}
					</label>
					<Select value={sortDir} onValueChange={(val) => onSortDirChange(val as "asc" | "desc")}>
						<SelectTrigger id="appointment-sort-dir" className="h-10 bg-background border-border text-foreground hover:bg-muted text-sm font-normal px-3">
							<SelectValue placeholder={t("appointments.filters.sortDir", { defaultValue: "Sort direction" })} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="asc">
								{t("appointments.filters.asc", { defaultValue: "Ascending" })}
							</SelectItem>
							<SelectItem value="desc">
								{t("appointments.filters.desc", { defaultValue: "Descending" })}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid gap-2">
				<p className="text-sm font-medium">{labelStatuses}</p>
				<div className="flex flex-wrap gap-2">
					{allowedStatuses.map((status) => {
						const selected = selectedStatuses.includes(status);
						return (
										<Button
								key={status}
								variant={selected ? "default" : "outline"}
								size="sm"
								aria-pressed={selected}
								onClick={() => onStatusToggle(status)}
							>
											{t(APPOINTMENT_STATUS_LABELS[status])}
										</Button>
						);
					})}
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button variant="ghost" onClick={onClear}>
					{labelClear}
				</Button>
			</div>
		</div>
	);
}
