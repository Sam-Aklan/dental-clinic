import { useTranslation } from "react-i18next";
import { SearchX } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { useNavigate } from "@tanstack/react-router";
import { ROUTE_HOME, roleHomeMap } from "@/constants/routes";
import { ErrorPageShell, type ErrorPageAction } from "./ErrorPageShell";
import type { Role } from "@/types";

// AR: صفحة 404 للمسارات غير الموجودة. توفر إجراءات استرداد آمنة بدون كشف المسارات المحمية.
// EN: Not Found page (404) for unmatched routes. Provides safe recovery without exposing protected paths.
export function NotFoundPage() {
	const { t } = useTranslation();
	const { user, isLoading } = useAuth();
	const navigate = useNavigate();

	// AR: تحديد الوجهة الآمنة بناءً على حالة المصادقة والدور.
	// EN: Determine safe destination based on auth state and role.
	const isAuthenticated = !isLoading && user !== null;
	const knownRole = user?.role && ["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"].includes(user.role);
	const safeHome = isAuthenticated && knownRole && user.role
		? roleHomeMap[user.role as Role]
		: ROUTE_HOME;

	const primaryLabel = isAuthenticated
		? t("errors.notFound.primaryAuthenticated")
		: t("errors.notFound.primaryGuest");

	const primaryAction: ErrorPageAction = {
		label: primaryLabel,
		to: safeHome,
		variant: "default",
	};

	const handleBack = () => {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			void navigate({ to: safeHome });
		}
	};

	const secondaryAction: ErrorPageAction = {
		label: t("errors.notFound.secondary"),
		onClick: handleBack,
		variant: "outline",
	};

	return (
		<ErrorPageShell
			statusCode="404"
			eyebrow={t("errors.notFound.eyebrow")}
			title={t("errors.notFound.title")}
			description={t("errors.notFound.description")}
			icon={<SearchX />}
			primaryAction={primaryAction}
			secondaryAction={secondaryAction}
			supportText={t("errors.notFound.support")}
		/>
	);
}
