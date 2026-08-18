import { useTranslation } from "react-i18next";
import type { LoadingVariant } from "@/types";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  variant?: LoadingVariant;
  label?: string;
}

export function LoadingSpinner({ variant = "section", label }: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const defaultLabel = label ?? t("shell.loading.label");

  const spinner = (
    <div
      className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary"
      aria-hidden="true"
    />
  );

  if (variant === "compact") {
    return (
      <div
        role="status"
        aria-label={defaultLabel}
        className="inline-flex items-center gap-2"
      >
        <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <span className="text-sm text-muted-foreground">{defaultLabel}</span>
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div
        role="status"
        aria-label={defaultLabel}
        className="absolute inset-0 z-10 flex items-center justify-center bg-background/80"
      >
        {spinner}
      </div>
    );
  }

  if (variant === "page") {
    return (
      <div
        role="status"
        aria-label={defaultLabel}
        className="flex min-h-screen items-center justify-center"
      >
        {spinner}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={defaultLabel}
      className={cn("flex w-full items-center justify-center py-12")}
    >
      {spinner}
    </div>
  );
}
