import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createUserSchema, editUserSchema, extractApiErrorMessage, type CreateUserFormValues, type EditUserFormValues } from "@/lib/users-admin";
import type { AdminUserDTO } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface UserFormProps {
	mode: "create" | "edit";
	user?: AdminUserDTO;
	currentUserId?: string;
	onSubmit: (values: CreateUserFormValues | EditUserFormValues) => Promise<void> | void;
	isPending?: boolean;
	errorMessage?: string;
	onSuccessHint?: string;
}

export function UserForm({ mode, user, currentUserId, onSubmit, isPending, errorMessage, onSuccessHint }: UserFormProps) {
	const { t } = useTranslation();
	const schema = mode === "create" ? createUserSchema : editUserSchema;
	const form = useForm<any>({
		resolver: zodResolver(schema),
		defaultValues: mode === "create"
			? { firstName: "", lastName: "", email: "", phone: "", role: "RECEPTIONIST", languagePreference: "en", password: "" }
			: { firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", phone: user?.phone ?? "", role: user?.role ?? "RECEPTIONIST", languagePreference: user?.languagePreference ?? "en" },
	});

	useEffect(() => {
		form.reset(mode === "create"
			? { firstName: "", lastName: "", email: "", phone: "", role: "RECEPTIONIST", languagePreference: "en", password: "" }
			: { firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", phone: user?.phone ?? "", role: user?.role ?? "RECEPTIONIST", languagePreference: user?.languagePreference ?? "en" });
	}, [form, mode, user]);

	const submit = form.handleSubmit(async (values) => {
		try {
			await onSubmit(values);
			toast.success(
				mode === "create"
					? t("usersAdmin.success.create")
					: t("usersAdmin.success.update")
			);
		} catch (error: any) {
			const rawMessage = extractApiErrorMessage(error);
			const translatedMessage = rawMessage ? t(`usersAdmin.errors.${rawMessage}`, { defaultValue: rawMessage }) : t("usersAdmin.errors.submitTitle");
			toast.error(translatedMessage);
		}
	});

	return (
		<form className="grid gap-4" onSubmit={submit} aria-busy={isPending}>
			{errorMessage ? <Alert variant="destructive"><AlertTitle>{t("usersAdmin.errors.submitTitle")}</AlertTitle><AlertDescription>{errorMessage}</AlertDescription></Alert> : null}
			{onSuccessHint ? <Alert><AlertTitle>{t("usersAdmin.form.hintTitle")}</AlertTitle><AlertDescription>{onSuccessHint}</AlertDescription></Alert> : null}
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2"><label className="text-sm font-medium" htmlFor="user-firstName">{t("usersAdmin.form.firstName")}</label><Input id="user-firstName" {...form.register("firstName")} />{form.formState.errors.firstName ? <p className="text-sm text-destructive">{String(form.formState.errors.firstName.message ?? "")}</p> : null}</div>
				<div className="space-y-2"><label className="text-sm font-medium" htmlFor="user-lastName">{t("usersAdmin.form.lastName")}</label><Input id="user-lastName" {...form.register("lastName")} />{form.formState.errors.lastName ? <p className="text-sm text-destructive">{String(form.formState.errors.lastName.message ?? "")}</p> : null}</div>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2"><label className="text-sm font-medium" htmlFor="user-email">{t("usersAdmin.form.email")}</label>{mode === "create" ? <Input id="user-email" {...form.register("email")} /> : <Input id="user-email" value={user?.email ?? ""} readOnly />}{mode === "create" && form.formState.errors.email ? <p className="text-sm text-destructive">{String(form.formState.errors.email.message ?? "")}</p> : null}</div>
				<div className="space-y-2"><label className="text-sm font-medium" htmlFor="user-phone">{t("usersAdmin.form.phone")}</label><Input id="user-phone" {...form.register("phone")} />{form.formState.errors.phone ? <p className="text-sm text-destructive">{String(form.formState.errors.phone.message ?? "")}</p> : null}</div>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium" htmlFor="user-role">{t("usersAdmin.form.role")}</label>
					<Controller
						control={form.control}
						name="role"
						render={({ field }) => (
							<Select
								value={field.value}
								onValueChange={field.onChange}
								disabled={Boolean(user?.id && currentUserId === user.id)}
							>
								<SelectTrigger id="user-role" className="h-9 w-full bg-background">
									<SelectValue placeholder={t("usersAdmin.form.role")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="PATIENT">{t("usersAdmin.roles.PATIENT")}</SelectItem>
									<SelectItem value="DOCTOR">{t("usersAdmin.roles.DOCTOR")}</SelectItem>
									<SelectItem value="RECEPTIONIST">{t("usersAdmin.roles.RECEPTIONIST")}</SelectItem>
									<SelectItem value="ADMIN">{t("usersAdmin.roles.ADMIN")}</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
					{form.formState.errors.role ? <p className="text-sm text-destructive">{String(form.formState.errors.role.message ?? "")}</p> : null}
					{mode === "edit" && currentUserId === user?.id ? <p className="text-xs text-muted-foreground">{t("usersAdmin.form.selfRoleLocked")}</p> : null}
				</div>
				<div className="space-y-2">
					<label className="text-sm font-medium" htmlFor="user-languagePreference">{t("usersAdmin.form.languagePreference")}</label>
					<Controller
						control={form.control}
						name="languagePreference"
						render={({ field }) => (
							<Select
								value={field.value}
								onValueChange={field.onChange}
							>
								<SelectTrigger id="user-languagePreference" className="h-9 w-full bg-background">
									<SelectValue placeholder={t("usersAdmin.form.languagePreference")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="en">{t("usersAdmin.language.en")}</SelectItem>
									<SelectItem value="ar">{t("usersAdmin.language.ar")}</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
				</div>
			</div>
			{mode === "create" ? <div className="space-y-2"><label className="text-sm font-medium" htmlFor="user-password">{t("usersAdmin.form.password")}</label><Input id="user-password" type="password" {...form.register("password")} />{form.formState.errors.password ? <p className="text-sm text-destructive">{String(form.formState.errors.password.message ?? "")}</p> : null}</div> : null}
			{mode === "create" && form.watch("role") === "DOCTOR" ? <Alert><AlertTitle>{t("usersAdmin.form.doctorRoleNoteTitle")}</AlertTitle><AlertDescription>{t("usersAdmin.form.doctorRoleNote")}</AlertDescription></Alert> : null}
			<div className="flex justify-end gap-2">
				<Button type="submit" disabled={isPending}>{isPending ? t("usersAdmin.actions.saving") : mode === "create" ? t("usersAdmin.actions.create") : t("usersAdmin.actions.save")}</Button>
			</div>
		</form>
	);
}
