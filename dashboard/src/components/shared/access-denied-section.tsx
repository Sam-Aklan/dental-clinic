import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/auth";
import { roleHomeMap } from "@/constants/routes";

export function AccessDeniedSection() {
	const { t } = useTranslation();
	const { user } = useAuth();

	const homeTarget = user?.role ? roleHomeMap[user.role] : "/";

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4">
			<h1>{t("accessDenied.title")}</h1>
			<p className="text-muted-foreground">{t("accessDenied.description")}</p>
			<Link to={homeTarget} replace>
				{t("accessDenied.homeLink")}
			</Link>
		</div>
	);
}
