import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginSchema, type LoginFormData } from "@/lib/auth/schemas/login.schema";
import { useLoginMutation } from "@/hooks/auth/use-login-mutation";
import { ROUTE_FORGOT_PASSWORD, ROUTE_REGISTER } from "@/constants";
import type { ApiErrorKey } from "@/types";
import { cn } from "@/lib/utils";

export function LoginForm({ className }: { className?: string }) {
	const { t } = useTranslation();
	const [showPassword, setShowPassword] = useState(false);
	const [apiErrorKey, setApiErrorKey] = useState<ApiErrorKey | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" },
	});

	const { mutate: login, isPending } = useLoginMutation((key) => {
		setApiErrorKey(key);
	});

	const handleFieldChange = () => {
		if (apiErrorKey) {
			setApiErrorKey(null);
		}
	};

	const onSubmit = (data: LoginFormData) => {
		const normalized = {
			email: data.email.trim().toLowerCase(),
			password: data.password,
		};
		login(normalized);
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className={cn("flex w-full flex-col gap-4", className)}
			noValidate
		>
			{apiErrorKey && (
				<Alert variant="destructive" role="alert">
					<AlertDescription>{t(apiErrorKey)}</AlertDescription>
				</Alert>
			)}

			<Field orientation="vertical">
				<Label htmlFor="email">{t("auth.email")}</Label>
				<FieldContent>
					<Input
						id="email"
						type="email"
						autoComplete="email"
						placeholder={t("auth.emailPlaceholder")}
						aria-invalid={!!errors.email}
						{...register("email", {
							onChange: handleFieldChange,
						})}
					/>
					<FieldError errors={errors.email ? [errors.email] : []}>
						{errors.email?.message && t(errors.email.message)}
					</FieldError>
				</FieldContent>
			</Field>

			<Field orientation="vertical">
				<Label htmlFor="password">{t("auth.password")}</Label>
				<FieldContent>
					<div className="relative">
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							autoComplete="current-password"
							placeholder={t("auth.passwordPlaceholder")}
							aria-invalid={!!errors.password}
							className="pe-10"
							{...register("password", {
								onChange: handleFieldChange,
							})}
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon-xs"
							onClick={() => setShowPassword(!showPassword)}
							aria-label={
								showPassword ? t("auth.hidePassword") : t("auth.showPassword")
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

			<Button type="submit" className="w-full" disabled={isPending}>
				{isPending ? "..." : t("auth.signIn")}
			</Button>

			<div className="flex items-center justify-between text-sm">
				<Link
					to={ROUTE_FORGOT_PASSWORD}
					className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
				>
					{t("auth.forgotPassword-login")}
				</Link>
				<Link
					to={ROUTE_REGISTER}
					className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
				>
					{t("auth.noAccount")}
				</Link>
			</div>
		</form>
	);
}
