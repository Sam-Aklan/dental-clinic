import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, LogOut, ChevronDown } from "lucide-react";
import { ROUTE_PROFILE, ROUTE_HOME } from "@/constants/routes";

export function UserMenu() {
  const { t } = useTranslation();
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate({ to: ROUTE_HOME });
  };

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user?.email ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {isLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <span className="max-w-[120px] truncate text-sm font-medium">
              {displayName || "—"}
            </span>
          )}
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {user && (
          <>
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span className="font-medium">{displayName}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user.role && (
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                {t("shell.userMenu.role")}: {user.role}
              </DropdownMenuLabel>
            )}
          </>
        )}
        <DropdownMenuItem onClick={() => navigate({ to: ROUTE_PROFILE })}>
          <User className="size-4" />
          {t("shell.userMenu.viewProfile")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut className="size-4" />
          {t("shell.userMenu.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
