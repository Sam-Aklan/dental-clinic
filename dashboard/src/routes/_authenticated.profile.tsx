import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { WorkspaceShell } from "@/components/shared";
import { WORKSPACE_CONFIGS } from "@/constants";
import { useAuth } from "@/hooks/auth";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfileRoute,
});

function ProfileRoute() {
  const { user } = useAuth();
  const workspaceConfig = user
    ? WORKSPACE_CONFIGS.find((config) => config.role === user.role)
    : undefined;

  if (!workspaceConfig) {
    return <ProfilePage />;
  }

  // AR: يستخدم المسار العام للملف الشخصي غلاف مساحة العمل المناسب حسب دور المستخدم.
  // EN: The shared profile route uses the matching workspace shell for the active user role.
  return (
    <WorkspaceShell
      navItems={workspaceConfig.navItems}
      homeRoute={workspaceConfig.homeRoute}
    >
      <ProfilePage />
    </WorkspaceShell>
  );
}
