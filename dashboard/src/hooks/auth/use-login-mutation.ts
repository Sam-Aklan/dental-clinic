import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAuth } from "@/hooks/auth/use-auth";
import { useAuthStore } from "@/stores";
import { resolveLoginDestination } from "@/lib/auth/helpers/redirect.helper";
import type { ApiErrorKey } from "@/types";
import axios from "axios";

function mapHttpStatusToErrorKey(error: unknown): ApiErrorKey {
	if (!axios.isAxiosError(error) || !error.response) {
		return "auth.errors.networkError";
	}
	switch (error.response.status) {
		case 401:
			return "auth.errors.invalidCredentials";
		case 403:
			return "auth.errors.accountDisabled";
		case 429:
			return "auth.errors.rateLimited";
		default:
			return "auth.errors.networkError";
	}
}

export function useLoginMutation(onApiError?: (key: ApiErrorKey) => void) {
	const navigate = useNavigate();
	const search = useSearch({ strict: false }) as { redirect?: string };
	const { login } = useAuth();

	const redirect = search?.redirect ?? null;

	return useMutation({
		mutationFn: ({ email, password }: { email: string; password: string }) =>
			login(email, password),
		onSuccess: () => {
			const user = useAuthStore.getState().user;
			if (!user) return;
			navigate({
				to: resolveLoginDestination(redirect, user.role),
				replace: true,
			} as never);
		},
		onError: (error) => {
			const key = mapHttpStatusToErrorKey(error);
			onApiError?.(key);
		},
	});
}
