import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { LoginSection } from "@/components/auth";
import { useAuthStore } from "@/stores";
import { roleHomeMap } from "@/constants";

export const Route = createFileRoute("/login")({
	component: LoginRoute,
	validateSearch: z.object({ redirect: z.string().optional() }),
	beforeLoad: () => {
		const { isAuthenticated, user } = useAuthStore.getState();
		if (isAuthenticated && user) {
			throw redirect({
				to: roleHomeMap[user.role],
				replace: true,
			});
		}
	},
});

function LoginRoute() {
	return <LoginSection />;
}
