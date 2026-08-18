import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/shared/logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ROUTE_LOGIN } from "@/constants";

export function RegisterSection() {
	const { t } = useTranslation();

	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
			<Card className="w-full max-w-sm">
				<CardHeader className="relative items-center gap-1">
					<div className="absolute end-4 top-4">
						<LanguageSwitcher />
					</div>
					<Logo />
					<CardTitle>{t("auth.register.title")}</CardTitle>
					<CardDescription>{t("auth.register.subtitle")}</CardDescription>
				</CardHeader>
				<CardContent>
					<RegisterForm />
				</CardContent>
				<CardFooter className="justify-center gap-1 text-sm">
					<span className="text-muted-foreground">{t("auth.register.hasAccount")}</span>
					<Link to={ROUTE_LOGIN}>{t("auth.register.signIn")}</Link>
				</CardFooter>
			</Card>
		</main>
	);
}
