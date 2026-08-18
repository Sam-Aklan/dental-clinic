import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/lib/profile/schemas";
import { useChangePassword } from "@/hooks/profile/use-change-password";
import type { ChangePasswordPayload } from "@/types/profile";
import { cn } from "@/lib/utils";

interface ChangePasswordFormProps {
  className?: string;
}

export function ChangePasswordForm({ className }: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { mutate: submitPasswordChange, isPending } = useChangePassword(setError, () => {
    reset();
  });

  const onSubmit = (data: ChangePasswordFormValues) => {
    setApiError(null);
    const payload: ChangePasswordPayload = {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    };
    submitPasswordChange(payload);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-4", className)}
      noValidate
      role="form"
      aria-label={t("profile.changePassword.sectionTitle")}
      aria-busy={isPending}
    >
      {apiError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <Field orientation="vertical">
        <Label htmlFor="currentPassword">{t("profile.changePassword.currentPassword")}</Label>
        <FieldContent>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={!!errors.currentPassword}
              disabled={isPending}
              {...register("currentPassword")}
            />
            <button
              type="button"
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={
                showCurrent
                  ? t("profile.changePassword.hideCurrentPassword")
                  : t("profile.changePassword.showCurrentPassword")
              }
              onClick={() => setShowCurrent((v) => !v)}
              tabIndex={-1}
            >
              {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldError errors={errors.currentPassword ? [errors.currentPassword] : []}>
            {errors.currentPassword?.message && t(errors.currentPassword.message)}
          </FieldError>
        </FieldContent>
      </Field>

      <Field orientation="vertical">
        <Label htmlFor="newPassword">{t("profile.changePassword.newPassword")}</Label>
        <FieldContent>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.newPassword}
              disabled={isPending}
              {...register("newPassword")}
            />
            <button
              type="button"
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={
                showNew
                  ? t("profile.changePassword.hideNewPassword")
                  : t("profile.changePassword.showNewPassword")
              }
              onClick={() => setShowNew((v) => !v)}
              tabIndex={-1}
            >
              {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldError errors={errors.newPassword ? [errors.newPassword] : []}>
            {errors.newPassword?.message && t(errors.newPassword.message)}
          </FieldError>
        </FieldContent>
      </Field>

      <Field orientation="vertical">
        <Label htmlFor="confirmPassword">{t("profile.changePassword.confirmPassword")}</Label>
        <FieldContent>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              disabled={isPending}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={
                showConfirm
                  ? t("profile.changePassword.hideConfirmPassword")
                  : t("profile.changePassword.showConfirmPassword")
              }
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldError errors={errors.confirmPassword ? [errors.confirmPassword] : []}>
            {errors.confirmPassword?.message && t(errors.confirmPassword.message)}
          </FieldError>
        </FieldContent>
      </Field>

      <Button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
        {t("profile.changePassword.submit")}
      </Button>
    </form>
  );
}
