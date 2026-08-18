import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	resetPasswordSchema,
	type ResetPasswordFormValues,
} from "@/lib/auth/schemas/reset-password.schema";
import type { ApiErrorKey } from "@/types";
import { cn } from "@/lib/utils";

interface ResetPasswordFormProps {
	onSubmitNewPassword: (newPassword: string) => void;
	isPending: boolean;
	apiErrorKey: ApiErrorKey | null;
	onFieldChange?: () => void;
	className?: string;
}

export function ResetPasswordForm({
	onSubmitNewPassword,
	isPending,
	apiErrorKey,
	onFieldChange,
	className,
}: ResetPasswordFormProps) {
	const { t } = useTranslation();
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ResetPasswordFormValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { newPassword: "", confirmPassword: "" },
	});

	const handleFieldChange = () => {
		onFieldChange?.();
	};

	const onSubmit = (data: ResetPasswordFormValues) => {
		onFieldChange?.();
		onSubmitNewPassword(data.newPassword);
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className={cn("flex w-full flex-col gap-4", className)}
			noValidate
			aria-label={t("auth.resetPassword.title")}
			aria-busy={isPending}
		>
			{apiErrorKey && (
				<Alert variant="destructive" role="alert">
					<AlertDescription>{t(apiErrorKey)}</AlertDescription>
				</Alert>
			)}

			<div className="flex flex-col gap-1 text-center">
				<h1 className="text-xl font-semibold text-foreground">
					{t("auth.resetPassword.title")}
				</h1>
				<p className="text-sm text-muted-foreground">
					{t("auth.resetPassword.subtitle")}
				</p>
			</div>

			<Field orientation="vertical">
				<Label htmlFor="newPassword">
					{t("auth.resetPassword.newPassword")}
				</Label>
				<FieldContent>
					<div className="relative">
						<Input
							id="newPassword"
							type={showNewPassword ? "text" : "password"}
							autoComplete="new-password"
							placeholder={t(
								"auth.resetPassword.newPasswordPlaceholder",
							)}
							aria-invalid={!!errors.newPassword}
							disabled={isPending}
							className="pe-10"
							{...register("newPassword", {
								onChange: handleFieldChange,
							})}
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon-xs"
							onClick={() =>
								setShowNewPassword(!showNewPassword)
							}
							disabled={isPending}
							aria-label={
								showNewPassword
									? t("auth.resetPassword.hideNewPassword")
									: t("auth.resetPassword.showNewPassword")
							}
							className="absolute end-1.5 top-1/2 -translate-y-1/2"
						>
							{showNewPassword ? (
								<EyeOff size={16} />
							) : (
								<Eye size={16} />
							)}
						</Button>
					</div>
					<FieldError
						errors={errors.newPassword ? [errors.newPassword] : []}
					>
						{errors.newPassword?.message &&
							t(errors.newPassword.message)}
					</FieldError>
				</FieldContent>
			</Field>

			<Field orientation="vertical">
				<Label htmlFor="confirmPassword">
					{t("auth.resetPassword.confirmPassword")}
				</Label>
				<FieldContent>
					<div className="relative">
						<Input
							id="confirmPassword"
							type={
								showConfirmPassword ? "text" : "password"
							}
							autoComplete="new-password"
							placeholder={t(
								"auth.resetPassword.confirmPasswordPlaceholder",
							)}
							aria-invalid={!!errors.confirmPassword}
							disabled={isPending}
							className="pe-10"
							{...register("confirmPassword", {
								onChange: handleFieldChange,
							})}
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon-xs"
							onClick={() =>
								setShowConfirmPassword(!showConfirmPassword)
							}
							disabled={isPending}
							aria-label={
								showConfirmPassword
									? t(
											"auth.resetPassword.hideConfirmPassword",
										)
									: t(
											"auth.resetPassword.showConfirmPassword",
										)
							}
							className="absolute end-1.5 top-1/2 -translate-y-1/2"
						>
							{showConfirmPassword ? (
								<EyeOff size={16} />
							) : (
								<Eye size={16} />
							)}
						</Button>
					</div>
					<FieldError
						errors={
							errors.confirmPassword
								? [errors.confirmPassword]
								: []
						}
					>
						{errors.confirmPassword?.message &&
							t(errors.confirmPassword.message)}
					</FieldError>
				</FieldContent>
			</Field>

			<Button
				type="submit"
				className="w-full"
				disabled={isPending}
				aria-busy={isPending}
			>
				{isPending ? "..." : t("auth.resetPassword.submit")}
			</Button>
		</form>
	);
}
