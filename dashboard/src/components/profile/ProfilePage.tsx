import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/profile/use-profile";
import { ProfileForm } from "./ProfileForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfilePage() {
  const { t } = useTranslation();
  const { data: profile, isLoading, isError, refetch } = useProfile();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("profile.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.personalInfo.sectionTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex flex-col gap-4" aria-busy="true">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          )}
          {isError && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{t("profile.errors.loadFailed")}</AlertDescription>
              <Button variant="outline" onClick={() => refetch()} className="mt-3">
                {t("profile.retry")}
              </Button>
            </Alert>
          )}
          {profile && !isLoading && <ProfileForm profile={profile} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.changePassword.sectionTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
