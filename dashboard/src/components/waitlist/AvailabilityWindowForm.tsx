import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { availabilityWindowSchema } from "@/lib/waitlist";
import { isDoctorJoinable } from "@/lib/waitlist";
import type { AvailabilityWindowFormData } from "@/lib/waitlist";
import type { DoctorOption, WaitlistEntryDTO } from "@/types";

interface AvailabilityWindowFormProps {
	mode: "join" | "edit";
	doctors: DoctorOption[];
	doctorsLoading: boolean;
	doctorsError: boolean;
	onRetryDoctors: () => void;
	activeEntries: WaitlistEntryDTO[];
	isPending: boolean;
	formError: string | null;
	initialValues?: Partial<AvailabilityWindowFormData>;
	onSubmit: (data: AvailabilityWindowFormData) => void;
	onCancel?: () => void;
}

export function AvailabilityWindowForm({
	mode,
	doctors,
	doctorsLoading,
	doctorsError,
	onRetryDoctors,
	activeEntries,
	isPending,
	formError,
	initialValues,
	onSubmit,
	onCancel,
}: AvailabilityWindowFormProps) {
	const { t } = useTranslation();

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<AvailabilityWindowFormData>({
		resolver: zodResolver(availabilityWindowSchema),
		defaultValues: initialValues ?? {
			doctorId: "",
			availableFrom: "",
			availableUntil: "",
		},
	});

	const schemaErrors = Object.values(errors)
		.map((e) => (e?.message as string) ?? "")
		.filter(Boolean);

	useEffect(() => {
		if (initialValues) {
			if (initialValues.doctorId) setValue("doctorId", initialValues.doctorId);
			if (initialValues.availableFrom !== undefined) setValue("availableFrom", initialValues.availableFrom);
			if (initialValues.availableUntil !== undefined) setValue("availableUntil", initialValues.availableUntil);
		}
	}, [initialValues, setValue]);

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
			{formError && (
				<Alert variant="destructive" role="alert">
					<AlertDescription>{t(formError)}</AlertDescription>
				</Alert>
			)}

			{schemaErrors.length > 0 && (
				<Alert variant="destructive" role="alert">
					<AlertDescription>{t(schemaErrors[0])}</AlertDescription>
				</Alert>
			)}

			{mode === "join" && (
				<div className="flex flex-col gap-2">
					<Label htmlFor="waitlist-doctor">{t("waitlist.doctorLabel")}</Label>
					{doctorsLoading ? (
						<Skeleton className="h-10 w-full" />
					) : doctorsError ? (
						<div className="flex items-center gap-2">
							<p className="text-sm text-destructive">{t("waitlist.errorDoctors")}</p>
							<Button type="button" variant="outline" size="sm" onClick={onRetryDoctors}>
								{t("waitlist.retry")}
							</Button>
						</div>
					) : (
						<select
							id="waitlist-doctor"
							{...register("doctorId")}
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="" disabled>
								{t("waitlist.selectDoctor")}
							</option>
							{doctors.map((doctor) => (
								<option
									key={doctor.id}
									value={doctor.id}
									disabled={!isDoctorJoinable(doctor.id, activeEntries)}
								>
									{doctor.firstName} {doctor.lastName}
									{doctor.specialization ? ` (${doctor.specialization})` : ""}
									{!isDoctorJoinable(doctor.id, activeEntries)
										? ` - ${t("waitlist.alreadyJoined")}`
										: ""}
								</option>
							))}
						</select>
					)}
					{errors.doctorId && (
						<p className="text-sm text-destructive" role="alert">
							{t(errors.doctorId.message ?? "waitlist.errors.doctorRequired")}
						</p>
					)}
				</div>
			)}

			<div className="flex flex-col gap-2">
				<Label htmlFor="waitlist-from">{t("waitlist.availableFrom")}</Label>
				<Input
					id="waitlist-from"
					type="time"
					{...register("availableFrom", { setValueAs: (v: string) => v || null })}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="waitlist-until">{t("waitlist.availableUntil")}</Label>
				<Input
					id="waitlist-until"
					type="time"
					{...register("availableUntil", { setValueAs: (v: string) => v || null })}
				/>
				{errors.availableUntil && (
					<p className="text-sm text-destructive" role="alert">
						{t(errors.availableUntil.message ?? "")}
					</p>
				)}
			</div>

			<Button type="submit" disabled={isPending} aria-busy={isPending}>
				{isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
				{mode === "join" ? t("waitlist.join") : t("waitlist.save")}
			</Button>

			{mode === "edit" && onCancel && (
				<Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
					{t("waitlist.cancel")}
				</Button>
			)}
		</form>
	);
}
