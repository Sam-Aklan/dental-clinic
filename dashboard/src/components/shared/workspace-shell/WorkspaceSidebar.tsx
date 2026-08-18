import { useTranslation } from "react-i18next";
import { Link, useRouterState } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/use-language";
import type { NavItem } from "@/types";
import { cn } from "@/lib/utils";

interface WorkspaceSidebarProps {
  navItems: NavItem[];
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function NavLink({ item, onSelect }: { item: NavItem; onSelect?: () => void }) {
  const { t } = useTranslation();
  const { location } = useRouterState();
  const pathname = location.pathname;
  const isActive = item.exact
    ? pathname === item.to
    : pathname.startsWith(item.to);

  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="size-5 shrink-0" />
      <span>{t(item.key)}</span>
    </Link>
  );
}

export function WorkspaceSidebar({
  navItems,
  mobileOpen,
  onMobileClose,
}: WorkspaceSidebarProps) {
  const { t } = useTranslation();
  const { dir } = useLanguage();
  const isMobile = useIsMobile();

  const navContent = (
    <nav aria-label={t("nav.label")} id="workspace-sidebar" className="flex flex-col gap-1 p-4">
      {navItems.map((item) => (
        <NavLink
          key={item.key}
          item={item}
          onSelect={isMobile ? onMobileClose : undefined}
        />
      ))}
    </nav>
  );

  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={(open) => { if (!open) onMobileClose(); }}>
        <SheetContent
          side={dir === "rtl" ? "right" : "left"}
          className="w-64 p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t("nav.label")}</SheetTitle>
          </SheetHeader>
          {navContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden border-e bg-card md:flex md:w-64 md:flex-col md:shrink-0">
      {navContent}
    </aside>
  );
}
