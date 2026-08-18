import { createFileRoute, redirect } from "@tanstack/react-router";
import { RegisterSection } from "@/components/auth";
import { useAuthStore } from "@/stores";
import { roleHomeMap } from "@/constants";

export const Route = createFileRoute("/register")({
	component: RegisterRoute,
	beforeLoad: () => {
		const { isAuthenticated, user } = useAuthStore.getState();
		if (isAuthenticated && user) {
			throw redirect({ to: roleHomeMap[user.role], replace: true });
		}
	},
});

function RegisterRoute() {
	return <RegisterSection />;
}
