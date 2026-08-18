import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "@/lib/auth/actions/auth.api";
import type { ResetPasswordRequest, ApiErrorKey } from "@/types";

function mapToResetErrorKey(error: unknown): {
	apiErrorKey: ApiErrorKey | null;
	isTokenRejected: boolean;
} {
	const axiosError = error as {
		isAxiosError?: boolean;
		response?: { status?: number };
	} | null;

	if (!axiosError?.isAxiosError || !axiosError?.response) {
		return {
			apiErrorKey: "auth.errors.resetFailed",
			isTokenRejected: false,
		};
	}
	if (
		axiosError.response.status === 400 ||
		axiosError.response.status === 404 ||
		axiosError.response.status === 410
	) {
		return { apiErrorKey: null, isTokenRejected: true };
	}
	if (axiosError.response.status === 429) {
		return {
			apiErrorKey: "auth.errors.rateLimited",
			isTokenRejected: false,
		};
	}
	return { apiErrorKey: "auth.errors.resetFailed", isTokenRejected: false };
}

export function useResetPasswordMutation(
	onSuccess?: () => void,
	onTokenRejected?: () => void,
	onApiError?: (key: ApiErrorKey) => void,
) {
	return useMutation({
		mutationFn: (payload: ResetPasswordRequest) =>
			resetPassword(payload),
		onSuccess: () => {
			onSuccess?.();
		},
		onError: (error) => {
			const { apiErrorKey, isTokenRejected } =
				mapToResetErrorKey(error);
			if (isTokenRejected) {
				onTokenRejected?.();
				return;
			}
			if (apiErrorKey) {
				onApiError?.(apiErrorKey);
			}
		},
	});
}
