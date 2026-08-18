import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher/LanguageSwitcher";
import { UserMenu } from "./UserMenu";
import { Menu } from "lucide-react";
import type { ReactNode } from "react";

interface WorkspaceHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

export function WorkspaceHeader({
  title,
  subtitle,
  actions,
  mobileOpen,
  onMobileToggle,
}: WorkspaceHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={onMobileToggle}
        aria-label={mobileOpen ? t("shell.header.closeMenu") : t("shell.header.openMenu")}
        aria-expanded={mobileOpen}
        aria-controls="workspace-sidebar"
      >
        <Menu className="size-5" />
      </Button>

      <div className="flex-1 min-w-0">
        {title && <h1 className="truncate text-sm font-semibold">{title}</h1>}
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}

      <LanguageSwitcher />
      <UserMenu />
    </header>
  );
}
