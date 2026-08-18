import { Logo } from "@/components/shared/logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ResetPasswordSuccessState } from "@/components/auth/ResetPasswordSuccessState";
import { ResetPasswordInvalidState } from "@/components/auth/ResetPasswordInvalidState";
import { useResetPasswordFlow } from "@/hooks/auth/use-reset-password-flow";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ResetPasswordSectionProps {
	token: string;
	navigate: (opts: { to: string; replace: boolean }) => void;
}

export function ResetPasswordSection({
	token,
	navigate,
}: ResetPasswordSectionProps) {
	const flow = useResetPasswordFlow({ token, navigate });

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
						<ResetPasswordForm
							onSubmitNewPassword={flow.submit}
							isPending={flow.isPending}
							apiErrorKey={flow.apiErrorKey}
							onFieldChange={flow.clearApiError}
						/>
					) : flow.view === "success" ? (
						<ResetPasswordSuccessState />
					) : (
						<ResetPasswordInvalidState />
					)}
				</CardContent>
			</Card>
		</main>
	);
}
