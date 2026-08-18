import { useState, useEffect, useCallback, useRef } from "react";
import { useResetPasswordMutation } from "@/hooks/auth/use-reset-password-mutation";
import { useAuthStore } from "@/stores/auth-store";
import type { ResetPasswordView, ApiErrorKey } from "@/types";

const REDIRECT_DELAY_MS = 2000;

export function useResetPasswordFlow({
	token,
	navigate,
}: {
	token: string;
	navigate: (opts: { to: string; replace: boolean }) => void;
}) {
	const [view, setView] = useState<ResetPasswordView>(() =>
		token ? "form" : "invalid",
	);

	const [apiErrorKey, setApiErrorKey] = useState<ApiErrorKey | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const mutation = useResetPasswordMutation(
		() => {
			useAuthStore.getState().logout();
			setApiErrorKey(null);
			setView("success");
			timerRef.current = setTimeout(() => {
				navigate({ to: "/login", replace: true });
			}, REDIRECT_DELAY_MS);
		},
		() => {
			setView("invalid");
		},
		(key) => {
			setApiErrorKey(key);
		},
	);

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
		};
	}, []);

	const submit = useCallback(
		(newPassword: string) => {
			setApiErrorKey(null);
			mutation.mutate({ token, newPassword });
		},
		[mutation, token],
	);

	const clearApiError = useCallback(() => {
		setApiErrorKey(null);
	}, []);

	return {
		view,
		submit,
		isPending: mutation.isPending,
		apiErrorKey,
		clearApiError,
	} as const;
}
