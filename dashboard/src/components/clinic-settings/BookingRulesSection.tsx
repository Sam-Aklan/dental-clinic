import { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useClinicSettings, useUpdateClinicSettings } from "@/hooks/clinic-settings";
import { bookingRulesSchema, type BookingRulesFormValues } from "@/lib/clinic-settings";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { string } from "zod";

const timezoneOptions = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"];

export function BookingRulesSection() {
	const { t } = useTranslation();
	const { data, isLoading, isError, refetch } = useClinicSettings();
	const [saveError, setSaveError] = useState<string | null>(null);
	const [timezoneSearch, setTimezoneSearch] = useState("");

	// Get timezone options, ensuring default/current/db values are present
	const getFilteredTimezones = useCallback((currentValue: string) => {
		const query = timezoneSearch.toLowerCase().trim();
		let list = timezoneOptions;

		// Ensure UTC is in the list
		if (!list.includes("UTC")) {
			list = ["UTC", ...list];
		}

		// Ensure initial value from endpoint is in the list
		const dbValue = data?.timeZone;
		if (dbValue && !list.includes(dbValue)) {
			list = [dbValue, ...list];
		}

		// Ensure currently selected value is in the list
		if (currentValue && !list.includes(currentValue)) {
			list = [currentValue, ...list];
		}

		if (!query) {
			// Prepend current selection & db value first, then UTC, then return the first 40 options
			const uniqueList = Array.from(
				new Set(
					[
						...(currentValue ? [currentValue] : []),
						...(dbValue ? [dbValue] : []),
						"UTC",
						...list
					].filter(Boolean)
				)
			);
			return uniqueList.slice(0, 40);
		}

		return list.filter((zone) => zone.toLowerCase().includes(query));
	},[timezoneSearch]);
	
	const {
		register,
		control,
		handleSubmit,
		reset,
		setError,
		formState: { errors, isDirty },
	} = useForm<BookingRulesFormValues>({
		resolver: zodResolver(bookingRulesSchema) as Resolver<BookingRulesFormValues>,
		defaultValues: {
			timeZone: "UTC",
			slotDurationMinutes: 30,
			reminderHoursBefore: 24,
			waitlistOfferWindowMinutes: 30,
			minArrivalBufferMinutes: 45,
		},
	});
	const mutation = useUpdateClinicSettings();

	useEffect(() => {
		if (!data) {
			return;
		}

		reset({
			timeZone: data.timeZone,
			slotDurationMinutes: data.slotDurationMinutes,
			reminderHoursBefore: data.reminderHoursBefore,
			waitlistOfferWindowMinutes: data.waitlistOfferWindowMinutes,
			minArrivalBufferMinutes: data.minArrivalBufferMinutes ?? undefined,
		});
	}, [data, reset]);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("clinicSettings.bookingRules.title")}</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4" aria-busy="true">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (isError) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("clinicSettings.bookingRules.title")}</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert variant="destructive" role="alert">
						<AlertDescription>{t("clinicSettings.errors.loadFailed")}</AlertDescription>
					</Alert>
					<Button variant="outline" className="mt-4" onClick={() => void refetch()}>
						{t("clinicSettings.errors.retry")}
					</Button>
				</CardContent>
			</Card>
		);
	}

	// eslint-disable-next-line react-hooks/refs -- react-hook-form's handleSubmit is intentionally created here.
	const onSubmit = handleSubmit((values) => {
		setSaveError(null);
		mutation.mutate(
			{
				timeZone: values.timeZone,
				slotDurationMinutes: values.slotDurationMinutes,
				reminderHoursBefore: values.reminderHoursBefore,
				waitlistOfferWindowMinutes: values.waitlistOfferWindowMinutes,
				...(values.minArrivalBufferMinutes === undefined ? {} : { minArrivalBufferMinutes: values.minArrivalBufferMinutes }),
			},
			{
				onSuccess: (updated) => {
					reset({
						timeZone: updated.timeZone,
						slotDurationMinutes: updated.slotDurationMinutes,
						reminderHoursBefore: updated.reminderHoursBefore,
						waitlistOfferWindowMinutes: updated.waitlistOfferWindowMinutes,
						minArrivalBufferMinutes: updated.minArrivalBufferMinutes ?? undefined,
					});
				},
				onError: (error) => {
					if (!axios.isAxiosError(error)) {
						setSaveError(t("clinicSettings.errors.saveFailed"));
						return;
					}

					const data = error.response?.data as { message?: string | string[] } | undefined;
					const messages = Array.isArray(data?.message) ? data.message : typeof data?.message === "string" ? [data.message] : [];

					if (error.response?.status === 400) {
						for (const message of messages) {
							if (message.includes("timeZone")) {
								setError("timeZone", { message });
								continue;
							}

							if (message.includes("slotDurationMinutes")) {
								setError("slotDurationMinutes", { message });
								continue;
							}

							setSaveError(message);
						}
						return;
					}

					setSaveError(messages[0] ?? t("clinicSettings.errors.saveFailed"));
				},
			},
		);
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("clinicSettings.bookingRules.title")}</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4">
				<form onSubmit={onSubmit} className="grid gap-4" noValidate>
					<div className="grid gap-2">
						<Label htmlFor="timezone">{t("clinicSettings.bookingRules.timezone")}</Label>
						<Controller
							control={control}
							name="timeZone"
							render={({ field }) => {
								const currentFiltered = getFilteredTimezones(field.value);
								return (
									<Select
										value={field.value}
										onValueChange={(val) => {
											field.onChange(val);
											setTimezoneSearch("");
										}}
										onOpenChange={(open) => {
											if (!open) {
												setTimezoneSearch("");
											}
										}}
									>
										<SelectTrigger id="timezone" className="h-10 w-full bg-background border-border text-foreground hover:bg-muted text-sm font-normal px-3 text-start">
											<SelectValue placeholder={data?.timeZone  ? data.timeZone : t("clinicSettings.bookingRules.timezone")} />
										</SelectTrigger>
										<SelectContent>
											<div className="p-2 border-b border-border sticky top-0 bg-popover z-10">
												<Input
													placeholder={t("clinicSettings.bookingRules.searchTimezonePlaceholder", { defaultValue: "Search timezone..." })}
													value={timezoneSearch}
													onChange={(e) => setTimezoneSearch(e.target.value)}
													className="h-8 text-xs"
													onKeyDown={(e) => {
														// Stop propagation to prevent Radix Select from stealing keydown events
														e.stopPropagation();
													}}
												/>
											</div>
											<div className="max-h-60 overflow-y-auto">
												{currentFiltered.map((zone) => (
													<SelectItem key={zone} value={zone}>
														{zone}
													</SelectItem>
												))}
												{currentFiltered.length === 0 && (
													<div className="py-6 text-center text-sm text-muted-foreground">
														{t("clinicSettings.bookingRules.noTimezonesFound", { defaultValue: "No timezone found" })}
													</div>
												)}
											</div>
										</SelectContent>
									</Select>
								);
							}}
						/>
						<p className="text-sm text-destructive">{errors.timeZone?.message && t(errors.timeZone.message, { defaultValue: errors.timeZone.message })}</p>
					</div>
					<div className="grid gap-2 md:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor="slotDurationMinutes">{t("clinicSettings.bookingRules.slotDuration")}</Label>
							<Input id="slotDurationMinutes" type="number" min={5} step={5} {...register("slotDurationMinutes", { valueAsNumber: true })} />
							<p className="text-sm text-destructive">{errors.slotDurationMinutes?.message && t(errors.slotDurationMinutes.message, { defaultValue: errors.slotDurationMinutes.message })}</p>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="reminderHoursBefore">{t("clinicSettings.bookingRules.reminderHours")}</Label>
							<Input id="reminderHoursBefore" type="number" min={1} {...register("reminderHoursBefore", { valueAsNumber: true })} />
							<p className="text-sm text-destructive">{errors.reminderHoursBefore?.message && t(errors.reminderHoursBefore.message, { defaultValue: errors.reminderHoursBefore.message })}</p>
						</div>
					</div>
					<div className="grid gap-2 md:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor="waitlistOfferWindowMinutes">{t("clinicSettings.bookingRules.offerWindow")}</Label>
							<Input id="waitlistOfferWindowMinutes" type="number" min={5} {...register("waitlistOfferWindowMinutes", { valueAsNumber: true })} />
							<p className="text-sm text-destructive">{errors.waitlistOfferWindowMinutes?.message && t(errors.waitlistOfferWindowMinutes.message, { defaultValue: errors.waitlistOfferWindowMinutes.message })}</p>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="minArrivalBufferMinutes">{t("clinicSettings.bookingRules.arrivalBuffer")}</Label>
							<Input id="minArrivalBufferMinutes" type="number" min={0} {...register("minArrivalBufferMinutes", { valueAsNumber: true })} />
							<p className="text-sm text-destructive">{errors.minArrivalBufferMinutes?.message && t(errors.minArrivalBufferMinutes.message, { defaultValue: errors.minArrivalBufferMinutes.message })}</p>
						</div>
					</div>
					{saveError && (
						<Alert variant="destructive" role="alert">
							<AlertDescription>{t(saveError, { defaultValue: saveError })}</AlertDescription>
						</Alert>
					)}
					<div className="flex items-center gap-3">
						<Button type="submit" disabled={mutation.isPending} aria-busy={mutation.isPending}>
							{mutation.isPending && <Loader2 className="me-2 size-4 animate-spin" />}
							{t("clinicSettings.bookingRules.save")}
						</Button>
						{isDirty && <span className="text-sm text-muted-foreground">{t("clinicSettings.unsavedChanges")}</span>}
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
