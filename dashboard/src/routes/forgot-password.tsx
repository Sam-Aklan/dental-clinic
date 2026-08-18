import { createFileRoute, redirect } from "@tanstack/react-router";
import { ForgotPasswordSection } from "@/components/auth/ForgotPasswordSection";
import { roleHomeMap } from "@/constants";
import { useAuthStore } from "@/stores";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordRoute,
	beforeLoad: () => {
		const { isAuthenticated, user } = useAuthStore.getState();
		if (isAuthenticated && user) {
			throw redirect({ to: roleHomeMap[user.role], replace: true });
		}
	},
});

function ForgotPasswordRoute() {
	return <ForgotPasswordSection />;
}
