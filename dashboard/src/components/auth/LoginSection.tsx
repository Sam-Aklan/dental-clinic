import { Logo } from "@/components/shared/logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function LoginSection() {
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
					<LoginForm />
				</CardContent>
			</Card>
		</main>
	);
}
