import { useTranslation } from "react-i18next";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { useNavigate } from "@tanstack/react-router";
import { ROUTE_LOGIN, roleHomeMap } from "@/constants/routes";
import { ErrorPageShell, type ErrorPageAction } from "./ErrorPageShell";
import type { Role } from "@/types";

// AR: صفحة 403 للمستخدمين الذين لا يملكون الدور المطلوب. توفر إجراءات استرداد آمنة.
// EN: Forbidden page (403) for role-mismatch users. Provides safe recovery actions.
export function ForbiddenPage() {
	const { t } = useTranslation();
	const { user, isLoading } = useAuth();
	const navigate = useNavigate();

	// AR: تحديد الوجهة الآمنة بناءً على حالة المصادقة والدور.
	// EN: Determine safe destination based on auth state and role.
	const isAuthenticated = !isLoading && user !== null;
	const knownRole = user?.role && ["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"].includes(user.role);
	const safeHome = isAuthenticated && knownRole && user.role
		? roleHomeMap[user.role as Role]
		: ROUTE_LOGIN;

	const primaryLabel = isAuthenticated
		? t("errors.forbidden.primaryAuthenticated")
		: t("errors.forbidden.primaryGuest");

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
		label: t("errors.forbidden.secondary"),
		onClick: handleBack,
		variant: "outline",
	};

	return (
		<ErrorPageShell
			statusCode="403"
			eyebrow={t("errors.forbidden.eyebrow")}
			title={t("errors.forbidden.title")}
			description={t("errors.forbidden.description")}
			icon={<ShieldAlert />}
			primaryAction={primaryAction}
			secondaryAction={secondaryAction}
			supportText={t("errors.forbidden.support")}
		/>
	);
}
