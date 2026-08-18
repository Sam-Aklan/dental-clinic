import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "@tanstack/react-router";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import type { NavItem } from "@/types";

interface WorkspaceShellProps {
  navItems: NavItem[];
  homeRoute: string;
  children?: ReactNode;
}

export function WorkspaceShell({ navItems, children }: WorkspaceShellProps) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {t("shell.skipToContent")}
      </a>

      <WorkspaceHeader
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen((prev) => !prev)}
      />

      <div className="flex flex-1">
        <WorkspaceSidebar
          navItems={navItems}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <main id="main-content" className="flex-1 overflow-auto p-4 md:p-6">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
