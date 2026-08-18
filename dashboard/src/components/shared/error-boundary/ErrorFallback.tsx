import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { roleHomeMap, ROUTE_HOME } from "@/constants/routes";
import { AuthContext } from "@/contexts/auth";

interface ErrorFallbackProps {
  onRetry: () => void;
}

export function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  let homeRoute: string = ROUTE_HOME;
  if (auth?.user?.role) {
    homeRoute = roleHomeMap[auth.user.role] ?? ROUTE_HOME;
  }

  return (
    <div
      role="alert"
      className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <h2 className="text-xl font-semibold">{t("shell.error.title")}</h2>
      <p className="text-muted-foreground max-w-md">{t("shell.error.description")}</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate({ to: homeRoute })}>
          {t("shell.error.goHome")}
        </Button>
        <Button onClick={onRetry}>{t("shell.error.retry")}</Button>
      </div>
    </div>
  );
}
