import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/auth/use-auth";
import { ROUTE_BOOK } from "@/constants";
import type { ApiErrorKey, RegisterPayload } from "@/types";
import axios from "axios";

function mapStatusToErrorKey(error: unknown): ApiErrorKey {
	if (!axios.isAxiosError(error) || !error.response) return "auth.errors.networkError";
	if (error.response.status === 409) return "auth.errors.emailConflict";
	if (error.response.status === 429) return "auth.errors.rateLimited";
	return "auth.errors.networkError";
}

export function useRegisterMutation(
	onApiError?: (key: ApiErrorKey, status?: number) => void,
) {
	const navigate = useNavigate();
	const { register } = useAuth();

	return useMutation({
		mutationFn: (payload: RegisterPayload) => register(payload),
		onSuccess: () => {
			navigate({ to: ROUTE_BOOK, replace: true } as never);
		},
		onError: (error) => {
			const key = mapStatusToErrorKey(error);
			const status = axios.isAxiosError(error) ? error.response?.status : undefined;
			onApiError?.(key, status);
		},
	});
}
