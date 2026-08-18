import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ResetPasswordSection } from "@/components/auth/ResetPasswordSection";
import { roleHomeMap } from "@/constants";
import { useAuthStore } from "@/stores";

export const Route = createFileRoute("/reset-password")({
	validateSearch: z.object({ token: z.string().optional() }),
	component: ResetPasswordRoute,
	beforeLoad: () => {
		const { isAuthenticated, user } = useAuthStore.getState();
		if (isAuthenticated && user) {
			throw redirect({ to: roleHomeMap[user.role], replace: true });
		}
	},
});

function ResetPasswordRoute() {
	const { token } = Route.useSearch();
	const navigate = useNavigate();

	return (
		<ResetPasswordSection
			token={token ?? ""}
			navigate={navigate}
		/>
	);
}
