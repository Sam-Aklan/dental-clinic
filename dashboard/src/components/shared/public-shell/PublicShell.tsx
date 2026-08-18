import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/shared/language-switcher/LanguageSwitcher";

interface PublicShellProps {
  children: ReactNode;
  showLanguageSwitcher?: boolean;
}

export function PublicShell({ children, showLanguageSwitcher = true }: PublicShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {showLanguageSwitcher && (
        <div className="flex justify-end p-4">
          <LanguageSwitcher />
        </div>
      )}
      <main id="main-content" className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
