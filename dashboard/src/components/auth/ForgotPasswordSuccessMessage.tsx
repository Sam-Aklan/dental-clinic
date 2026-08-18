import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ROUTE_LOGIN } from "@/constants";
import { cn } from "@/lib/utils";

interface ForgotPasswordSuccessMessageProps {
  email: string;
  remainingSeconds: number;
  onResend: () => void;
  isResending: boolean;
  className?: string;
}

function truncateEmail(email: string): string {
  if (email.length > 40) return email.slice(0, 37) + "\u2026";
  return email;
}

export function ForgotPasswordSuccessMessage({
  email,
  remainingSeconds,
  onResend,
  isResending,
  className,
}: ForgotPasswordSuccessMessageProps) {
  const { t } = useTranslation();
  const displayEmail = truncateEmail(email);
  const cooldownActive = remainingSeconds > 0;

  return (
    <div
      className={cn("flex w-full flex-col gap-4", className)}
      role="status"
    >
      <div className="flex flex-col gap-2 text-center">
        <h3 className="text-lg font-semibold text-foreground">
          {t("auth.forgotPassword.successTitle")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("auth.forgotPassword.successMessage", { email: displayEmail })}
        </p>
      </div>

      <Button
        variant={cooldownActive ? "outline" : "default"}
        className="w-full"
        disabled={cooldownActive || isResending}
        onClick={onResend}
        aria-busy={isResending}
      >
        {cooldownActive
          ? t("auth.forgotPassword.sendAgainCooldown", { seconds: remainingSeconds })
          : isResending
            ? "..."
            : t("auth.forgotPassword.sendAgain")}
      </Button>

      <div className="flex items-center justify-center text-sm">
        <Link
          to={ROUTE_LOGIN}
          className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          {t("auth.forgotPassword.backToSignIn")}
        </Link>
      </div>
    </div>
  );
}
