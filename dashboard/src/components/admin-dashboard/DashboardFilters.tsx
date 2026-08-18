import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, CheckIcon, ChevronDownIcon, LoaderCircleIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminDashboardDoctorOptions } from "@/hooks/admin-dashboard";
import { cn } from "@/lib/utils";
import type { AdminDashboardUrlState } from "@/types";
import { z } from "zod";

const dashboardFiltersSchema = z.object({
	from: z.string().min(1),
	to: z.string().min(1),
	doctorId: z.string().default(""),
	status: z.string().default(""),
	patientName: z.string().default(""),
	bucket: z.string().default("auto"),
}).refine(({ from, to }) => new Date(from) <= new Date(to), {
	message: "Start date must be before or equal to end date",
	path: ["from"],
});

type DashboardFiltersValues = z.infer<typeof dashboardFiltersSchema>;

function parseFilterDate(value: string) {
	if (!value) return undefined;
	const date = new Date(`${value}T00:00:00`);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatFilterDate(value: string) {
	const date = parseFilterDate(value);
	if (!date) return "";
	return new Intl.DateTimeFormat(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(date);
}

function toFilterDateValue(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

interface Props {
	state: AdminDashboardUrlState;
	onApply: (next: Pick<AdminDashboardUrlState, "from" | "to" | "doctorId" | "status" | "patientName" | "bucket">) => void;
	onReset: () => void;
	labels: {
		title: string;
		from: string;
		to: string;
		doctorId: string;
		doctorAll: string;
		doctorSearchPlaceholder: string;
		doctorLoading: string;
		doctorEmpty: string;
		status: string;
		patientName: string;
		bucket: string;
		apply: string;
		reset: string;
	};
	statusOptions: Array<{ value: string; label: string }>;
	bucketOptions: Array<{ value: string; label: string }>;
    isRtl?:boolean
}

export function DashboardFilters({ state, onApply, onReset, labels, statusOptions, bucketOptions,isRtl=false }: Props) {
	const [isFromOpen, setIsFromOpen] = useState(false);
	const [isToOpen, setIsToOpen] = useState(false);
	const form = useForm<DashboardFiltersValues>({
		resolver: zodResolver(dashboardFiltersSchema) as never,
		defaultValues: {
			from: state.from,
			to: state.to,
			doctorId: state.doctorId,
			status: state.status,
			patientName: state.patientName,
			bucket: state.bucket,
		},
	});
	const fromValue = useWatch({ control: form.control, name: "from" }) ?? "";
	const toValue = useWatch({ control: form.control, name: "to" }) ?? "";
	const selectedDoctorId = useWatch({ control: form.control, name: "doctorId" }) ?? "";
	const statusValue = useWatch({ control: form.control, name: "status" }) || "ALL";
	const bucketValue = useWatch({ control: form.control, name: "bucket" }) ?? "";
	const doctorFilter = useAdminDashboardDoctorOptions(selectedDoctorId);

	useEffect(() => {
		form.reset({
			from: state.from,
			to: state.to,
			doctorId: state.doctorId,
			status: state.status,
			patientName: state.patientName,
			bucket: state.bucket,
		});
	}, [form, state.from, state.to, state.doctorId, state.status, state.patientName, state.bucket]);

	return (
		<form
			className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-3"
			onSubmit={form.handleSubmit((values) => onApply(values as never))}
		>
			<div className="md:col-span-2 xl:col-span-3">
				<h2 className="text-sm font-semibold">{labels.title}</h2>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="admin-dashboard-from">{labels.from}</Label>
				<Popover open={isFromOpen} onOpenChange={setIsFromOpen}>
					<PopoverTrigger asChild>
						<Button
							id="admin-dashboard-from"
							type="button"
							variant="outline"
							className={cn("w-full justify-between font-normal", !fromValue && "text-muted-foreground")}
						>
							<span className="truncate">{formatFilterDate(fromValue) || labels.from}</span>
							<CalendarIcon className="ms-2 size-4 shrink-0 text-muted-foreground" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={parseFilterDate(fromValue)}
							onSelect={(date) => {
								if (!date) return;
								form.setValue("from", toFilterDateValue(date), { shouldDirty: true, shouldValidate: true });
								setIsFromOpen(false);
							}}
						/>
					</PopoverContent>
				</Popover>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="admin-dashboard-to">{labels.to}</Label>
				<Popover open={isToOpen} onOpenChange={setIsToOpen}>
					<PopoverTrigger asChild>
						<Button
							id="admin-dashboard-to"
							type="button"
							variant="outline"
							className={cn("w-full justify-between font-normal", !toValue && "text-muted-foreground")}
						>
							<span className="truncate">{formatFilterDate(toValue) || labels.to}</span>
							<CalendarIcon className="ms-2 size-4 shrink-0 text-muted-foreground" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={parseFilterDate(toValue)}
							onSelect={(date) => {
								if (!date) return;
								form.setValue("to", toFilterDateValue(date), { shouldDirty: true, shouldValidate: true });
								setIsToOpen(false);
							}}
						/>
					</PopoverContent>
				</Popover>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="admin-dashboard-doctor">{labels.doctorId}</Label>
				<Popover open={doctorFilter.isOpen} onOpenChange={doctorFilter.handleOpenChange}>
					<PopoverTrigger asChild>
						<Button
							id="admin-dashboard-doctor"
							type="button"
							variant="outline"
							role="combobox"
							aria-expanded={doctorFilter.isOpen}
							className="w-full justify-between font-normal"
						>
							<span className="truncate">{doctorFilter.selectedDoctorName || labels.doctorAll}</span>
							<ChevronDownIcon className="ms-2 size-4 shrink-0 text-muted-foreground" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
						<div className="border-b border-border p-3">
							<div className="relative">
								<SearchIcon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									type="search"
									value={doctorFilter.searchQuery}
									onChange={(event) => doctorFilter.setSearchQuery(event.target.value)}
									placeholder={labels.doctorSearchPlaceholder}
									className="ps-9"
									aria-label={labels.doctorSearchPlaceholder}
								/>
							</div>
						</div>
						<div className="max-h-64 overflow-y-auto p-1">
							<button
								type="button"
								onClick={() => {
									form.setValue("doctorId", "", { shouldDirty: true, shouldValidate: true });
									doctorFilter.handleOpenChange(false);
								}}
								className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm hover:bg-muted"
							>
								<CheckIcon className={cn("size-4", selectedDoctorId ? "opacity-0" : "opacity-100")} />
								<span>{labels.doctorAll}</span>
							</button>
							{doctorFilter.isLoading ? (
								<div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
									<LoaderCircleIcon className="size-4 animate-spin" />
									<span>{labels.doctorLoading}</span>
								</div>
							) : doctorFilter.options.length > 0 ? (
								doctorFilter.options.map((doctor) => {
									const doctorName = [doctor.firstName, doctor.lastName].filter(Boolean).join(" ");
									return (
										<button
											key={doctor.id}
											type="button"
											onClick={() => {
												form.setValue("doctorId", doctor.id, { shouldDirty: true, shouldValidate: true });
												doctorFilter.handleOpenChange(false);
											}}
											className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm hover:bg-muted"
										>
											<CheckIcon className={cn("size-4", selectedDoctorId === doctor.id ? "opacity-100" : "opacity-0")} />
											<span className="truncate">{doctorName}</span>
										</button>
									);
								})
							) : (
								<div className="px-3 py-6 text-sm text-muted-foreground">{labels.doctorEmpty}</div>
							)}
						</div>
					</PopoverContent>
				</Popover>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="admin-dashboard-status">{labels.status}</Label>
				<Select
					value={statusValue}
					onValueChange={(val) => form.setValue("status", val === "ALL" ? "" : val, { shouldDirty: true, shouldValidate: true })}
				>
					<SelectTrigger id="admin-dashboard-status"  className={cn(isRtl?"h-9 flex flex-row-reverse":"flex")}>
						<SelectValue placeholder={labels.status} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">{labels.status}</SelectItem>
						{statusOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="admin-dashboard-bucket">{labels.bucket}</Label>
				<Select
					value={bucketValue}
					onValueChange={(val) => form.setValue("bucket", val, { shouldDirty: true, shouldValidate: true })}
				>
					<SelectTrigger id="admin-dashboard-bucket" className={cn(isRtl?"h-9 flex flex-row-reverse":"flex")}>
						<SelectValue placeholder={labels.bucket} />
					</SelectTrigger>
					<SelectContent>
						{bucketOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="admin-dashboard-patient">{labels.patientName}</Label>
				<Input id="admin-dashboard-patient" {...form.register("patientName")} />
			</div>
			<div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-3">
				<Button type="submit">{labels.apply}</Button>
				<Button type="button" variant="outline" onClick={onReset}>{labels.reset}</Button>
			</div>
		</form>
	);
}
