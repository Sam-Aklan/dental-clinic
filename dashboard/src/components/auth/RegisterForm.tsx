import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { registerSchema, type RegisterFormValues } from "@/lib/auth/schemas";
import { useRegisterMutation } from "@/hooks/auth/use-register-mutation";
import { ROUTE_LOGIN } from "@/constants";
import type { ApiErrorKey } from "@/types";
import { cn } from "@/lib/utils";

export function RegisterForm({ className }: { className?: string }) {
	const { t } = useTranslation();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [apiErrorKey, setApiErrorKey] = useState<ApiErrorKey | null>(null);

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		trigger,
	} = useForm<RegisterFormValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			password: "",
			confirmPassword: "",
			phoneNumber: "",
			dateOfBirth: "",
			consent: false as unknown as true,
		},
		mode: "onTouched",
	});

	const { mutate: registerUser, isPending } = useRegisterMutation((key) => {
		setApiErrorKey(key);
	});

	const handleFieldChange = () => {
		if (apiErrorKey) {
			setApiErrorKey(null);
		}
	};

	const onSubmit = (data: RegisterFormValues) => {
		const payload = {
			firstName: data.firstName.trim(),
			lastName: data.lastName.trim(),
			email: data.email.trim().toLowerCase(),
			password: data.password,
		};
		registerUser(payload);
	};

	const today = new Date().toISOString().split("T")[0];

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className={cn("flex w-full flex-col gap-4", className)}
			noValidate
		>
			{apiErrorKey && (
				<Alert variant="destructive" role="alert">
					<AlertDescription>
						{t(apiErrorKey)}
						{apiErrorKey === "auth.errors.emailConflict" && (
							<>
								{" "}
								<Link
									to={ROUTE_LOGIN}
									className="font-medium underline underline-offset-4"
								>
									{t("auth.register.emailConflictAction")}
								</Link>
							</>
						)}
					</AlertDescription>
				</Alert>
			)}

			<div className="grid grid-cols-2 gap-3">
				<Field orientation="vertical">
					<Label htmlFor="firstName">{t("auth.register.firstName")}</Label>
					<FieldContent>
						<Input
							id="firstName"
							type="text"
							autoComplete="given-name"
							aria-invalid={!!errors.firstName}
							{...register("firstName", { onChange: handleFieldChange })}
						/>
						<FieldError errors={errors.firstName ? [errors.firstName] : []}>
							{errors.firstName?.message && t(errors.firstName.message)}
						</FieldError>
					</FieldContent>
				</Field>

				<Field orientation="vertical">
					<Label htmlFor="lastName">{t("auth.register.lastName")}</Label>
					<FieldContent>
						<Input
							id="lastName"
							type="text"
							autoComplete="family-name"
							aria-invalid={!!errors.lastName}
							{...register("lastName", { onChange: handleFieldChange })}
						/>
						<FieldError errors={errors.lastName ? [errors.lastName] : []}>
							{errors.lastName?.message && t(errors.lastName.message)}
						</FieldError>
					</FieldContent>
				</Field>
			</div>

			<Field orientation="vertical">
				<Label htmlFor="email">{t("auth.register.email")}</Label>
				<FieldContent>
					<Input
						id="email"
						type="email"
						autoComplete="email"
						aria-invalid={!!errors.email}
						{...register("email", { onChange: handleFieldChange })}
					/>
					<FieldError errors={errors.email ? [errors.email] : []}>
						{errors.email?.message && t(errors.email.message)}
					</FieldError>
				</FieldContent>
			</Field>

			<Field orientation="vertical">
				<Label htmlFor="password">{t("auth.register.password")}</Label>
				<FieldContent>
					<div className="relative">
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							autoComplete="new-password"
							aria-invalid={!!errors.password}
							className="pe-10"
							{...register("password", { onChange: handleFieldChange })}
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon-xs"
							onClick={() => setShowPassword(!showPassword)}
							aria-label={
								showPassword
									? t("auth.register.hidePassword")
									: t("auth.register.showPassword")
							}
							className="absolute end-1.5 top-1/2 -translate-y-1/2"
						>
							{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
						</Button>
					</div>
					<FieldError errors={errors.password ? [errors.password] : []}>
						{errors.password?.message && t(errors.password.message)}
					</FieldError>
				</FieldContent>
			</Field>

			<Field orientation="vertical">
				<Label htmlFor="confirmPassword">{t("auth.register.confirmPassword")}</Label>
				<FieldContent>
					<div className="relative">
						<Input
							id="confirmPassword"
							type={showConfirmPassword ? "text" : "password"}
							autoComplete="new-password"
							aria-invalid={!!errors.confirmPassword}
							className="pe-10"
							{...register("confirmPassword", {
								onChange: handleFieldChange,
								onBlur: () => {
									trigger(["password", "confirmPassword"]);
								},
							})}
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon-xs"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							aria-label={
								showConfirmPassword
									? t("auth.register.hideConfirmPassword")
									: t("auth.register.showConfirmPassword")
							}
							className="absolute end-1.5 top-1/2 -translate-y-1/2"
						>
							{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
						</Button>
					</div>
					<FieldError errors={errors.confirmPassword ? [errors.confirmPassword] : []}>
						{errors.confirmPassword?.message && t(errors.confirmPassword.message)}
					</FieldError>
				</FieldContent>
			</Field>

			<Field orientation="vertical">
				<Label htmlFor="phoneNumber">{t("auth.register.phoneNumberOptional")}</Label>
				<FieldContent>
					<Input
						id="phoneNumber"
						type="tel"
						autoComplete="tel"
						aria-invalid={!!errors.phoneNumber}
						{...register("phoneNumber", { onChange: handleFieldChange })}
					/>
					<FieldError errors={errors.phoneNumber ? [errors.phoneNumber] : []}>
						{errors.phoneNumber?.message && t(errors.phoneNumber.message)}
					</FieldError>
				</FieldContent>
			</Field>

			<Field orientation="vertical">
				<Label htmlFor="dateOfBirth">{t("auth.register.dateOfBirthOptional")}</Label>
				<FieldContent>
					<Input
						id="dateOfBirth"
						type="date"
						max={today}
						autoComplete="bday"
						aria-invalid={!!errors.dateOfBirth}
						{...register("dateOfBirth", { onChange: handleFieldChange })}
					/>
					<FieldError errors={errors.dateOfBirth ? [errors.dateOfBirth] : []}>
						{errors.dateOfBirth?.message && t(errors.dateOfBirth.message)}
					</FieldError>
				</FieldContent>
			</Field>

			<Field orientation="horizontal" className="items-start">
				<Controller
					name="consent"
					control={control}
					render={({ field }) => (
						<>
							<Checkbox
								id="consent"
								checked={field.value === true}
								onCheckedChange={(checked) => {
									field.onChange(checked);
									handleFieldChange();
								}}
								aria-invalid={!!errors.consent}
							/>
							<Label htmlFor="consent" className="cursor-pointer text-sm font-normal leading-snug">
								{t("auth.register.consentText")}
							</Label>
						</>
					)}
				/>
				{errors.consent && (
					<div className="text-sm font-normal text-destructive">
						{t(errors.consent.message ?? "")}
					</div>
				)}
			</Field>

			<Button type="submit" className="w-full" disabled={isPending}>
				{isPending ? "..." : t("auth.register.submit")}
			</Button>
		</form>
	);
}
