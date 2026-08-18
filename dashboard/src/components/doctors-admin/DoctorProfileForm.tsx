import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { doctorProfileSchema, type DoctorProfileFormValues } from "@/lib/doctors-admin";

type DoctorProfileFormProps = {
	mode: "create" | "edit";
	defaultValues?: Partial<DoctorProfileFormValues>;
	submitLabel: string;
	onSubmit: (values: DoctorProfileFormValues) => void | Promise<void>;
	isPending?: boolean;
	errorMessage?: string | null;
	onCancel?: () => void;
	emailReadOnly?: boolean;
	showActive?: boolean;
};

export function DoctorProfileForm({ mode, defaultValues, submitLabel, onSubmit, isPending = false, errorMessage = null, onCancel, emailReadOnly = mode === "edit", showActive = mode === "edit" }: DoctorProfileFormProps) {
	const { t } = useTranslation();
	const form = useForm<DoctorProfileFormValues>({
		resolver: zodResolver(doctorProfileSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
			specialization: "",
			bio: "",
			isActive: true,
			...defaultValues,
		},
	});

	useEffect(() => {
		form.reset({
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
			specialization: "",
			bio: "",
			isActive: true,
			...defaultValues,
		});
	}, [defaultValues, form]);
	const isActive = useWatch({ control: form.control, name: "isActive" });

	return (
		<Card>
			<CardHeader>
				<CardTitle>{mode === "create" ? t("doctorsAdmin.profile.createTitle") : t("doctorsAdmin.profile.editTitle")}</CardTitle>
			</CardHeader>
			<CardContent>
				<form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
					<div className="grid gap-2">
						<Label htmlFor={`${mode}-first-name`}>{t("doctorsAdmin.profile.firstName")}</Label>
						<Input id={`${mode}-first-name`} {...form.register("firstName")} />
						{form.formState.errors.firstName ? <p className="text-sm text-destructive">{t(form.formState.errors.firstName.message as string)}</p> : null}
					</div>
					<div className="grid gap-2">
						<Label htmlFor={`${mode}-last-name`}>{t("doctorsAdmin.profile.lastName")}</Label>
						<Input id={`${mode}-last-name`} {...form.register("lastName")} />
						{form.formState.errors.lastName ? <p className="text-sm text-destructive">{t(form.formState.errors.lastName.message as string)}</p> : null}
					</div>
					<div className="grid gap-2">
						<Label htmlFor={`${mode}-email`}>{t("doctorsAdmin.profile.email")}</Label>
						<Input id={`${mode}-email`} type="email" readOnly={emailReadOnly} {...form.register("email")} />
						{form.formState.errors.email ? <p className="text-sm text-destructive">{t(form.formState.errors.email.message as string)}</p> : null}
					</div>
					<div className="grid gap-2">
						<Label htmlFor={`${mode}-phone`}>{t("doctorsAdmin.profile.phone")}</Label>
						<Input id={`${mode}-phone`} {...form.register("phone")} />
						{form.formState.errors.phone ? <p className="text-sm text-destructive">{t(form.formState.errors.phone.message as string)}</p> : null}
					</div>
					<div className="grid gap-2">
						<Label htmlFor={`${mode}-specialization`}>{t("doctorsAdmin.profile.specialization")}</Label>
						<Input id={`${mode}-specialization`} {...form.register("specialization")} />
						{form.formState.errors.specialization ? <p className="text-sm text-destructive">{t(form.formState.errors.specialization.message as string)}</p> : null}
					</div>
					<div className="grid gap-2">
						<Label htmlFor={`${mode}-bio`}>{t("doctorsAdmin.profile.bio")}</Label>
						<Textarea id={`${mode}-bio`} rows={4} {...form.register("bio")} />
						{form.formState.errors.bio ? <p className="text-sm text-destructive">{t(form.formState.errors.bio.message as string)}</p> : null}
					</div>
					{showActive ? (
						<div className="flex items-center gap-2">
							<Checkbox checked={Boolean(isActive)} onCheckedChange={(checked) => form.setValue("isActive", Boolean(checked), { shouldDirty: true })} />
							<Label>{t("doctorsAdmin.profile.active")}</Label>
						</div>
					) : null}
					{errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
					<div className="flex flex-wrap justify-end gap-2">
						{onCancel ? <Button type="button" variant="outline" onClick={onCancel}>{t("doctorsAdmin.actions.cancel")}</Button> : null}
						<Button type="submit" disabled={isPending}>{submitLabel}</Button>
					</div>
				</form>
			</CardContent>
			<CardFooter />
		</Card>
	);
}
