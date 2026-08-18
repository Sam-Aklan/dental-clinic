import { Logo } from "@/components/shared/logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ForgotPasswordSuccessMessage } from "@/components/auth/ForgotPasswordSuccessMessage";
import { useForgotPasswordFlow } from "@/hooks/auth/use-forgot-password-flow";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ForgotPasswordSection() {
  const flow = useForgotPasswordFlow();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="relative items-center gap-1">
          <div className="absolute end-4 top-4">
            <LanguageSwitcher />
          </div>
          <Logo />
        </CardHeader>
        <CardContent>
          {flow.view === "form" ? (
            <ForgotPasswordForm
              onSubmitEmail={flow.submitEmail}
              isPending={flow.isPending}
              apiErrorKey={flow.apiErrorKey}
              onFieldChange={flow.clearApiError}
            />
          ) : (
            <ForgotPasswordSuccessMessage
              email={flow.submittedEmail ?? ""}
              remainingSeconds={flow.remainingSeconds}
              onResend={flow.resend}
              isResending={flow.isResending}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
