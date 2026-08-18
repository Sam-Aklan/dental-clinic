import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/auth";
import type { ReactNode } from "react";
import type { Role } from "@/types";
import { ROUTE_LOGIN, ROUTE_FORBIDDEN } from "@/constants/routes";
import { FullPageLoader } from "./full-page-loader";

interface ProtectedRouteGuardProps {
	allowedRoles?: Role[];
	children: ReactNode;
}

// AR: حارس مسار يحمي المناطق المحمية بناءً على المصادقة والدور.
// EN: Route guard that protects authenticated areas based on auth and role.
export function ProtectedRouteGuard({ allowedRoles, children }: ProtectedRouteGuardProps) {
	const { user, isLoading } = useAuth();

	if (isLoading) {
		return <FullPageLoader />;
	}

	// AR: إعادة توجيه المستخدمين غير المسجلين إلى صفحة تسجيل الدخول.
	// EN: Redirect unauthenticated users to login.
	if (!user) {
		const redirect = `${window.location.pathname}${window.location.search}`;
		return <Navigate to={ROUTE_LOGIN} search={{ redirect }} replace />;
	}

	// AR: إعادة توجيه عدم تطابق الدور إلى صفحة 403 مع استبدال السجل.
	// EN: Redirect role mismatches to /403 with replace navigation.
	if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
		return <Navigate to={ROUTE_FORBIDDEN} replace />;
	}

	return children;
}
