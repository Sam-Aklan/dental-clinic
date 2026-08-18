import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/auth/schemas/forgot-password.schema";
import { ROUTE_LOGIN } from "@/constants";
import type { ApiErrorKey } from "@/types";
import { cn } from "@/lib/utils";

interface ForgotPasswordFormProps {
  onSubmitEmail: (email: string) => void;
  isPending: boolean;
  apiErrorKey: ApiErrorKey | null;
  onFieldChange?: () => void;
  className?: string;
}

export function ForgotPasswordForm({
  onSubmitEmail,
  isPending,
  apiErrorKey,
  onFieldChange,
  className,
}: ForgotPasswordFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const handleFieldChange = () => {
    onFieldChange?.();
  };

  const onSubmit = (data: ForgotPasswordFormValues) => {
    onFieldChange?.();
    onSubmitEmail(data.email);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex w-full flex-col gap-4", className)}
      noValidate
      aria-label={t("auth.forgotPassword.title")}
    >
      {apiErrorKey && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{t(apiErrorKey)}</AlertDescription>
        </Alert>
      )}

      <Field orientation="vertical">
        <Label htmlFor="email">{t("auth.forgotPassword.email")}</Label>
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

      <Button type="submit" className="w-full" disabled={isPending} aria-busy={isPending}>
        {isPending ? "..." : t("auth.forgotPassword.submit")}
      </Button>

      <div className="flex items-center justify-center text-sm">
        <Link
          to={ROUTE_LOGIN}
          className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          {t("auth.forgotPassword.backToSignIn")}
        </Link>
      </div>
    </form>
  );
}
