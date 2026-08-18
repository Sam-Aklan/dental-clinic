import { useMutation } from "@tanstack/react-query";
import { forgotPassword } from "@/lib/auth/actions/auth.api";
import type { ForgotPasswordRequest, ApiErrorKey } from "@/types";
import axios from "axios";

function mapToErrorKey(error: unknown): ApiErrorKey {
  if (!axios.isAxiosError(error) || !error.response) {
    return "auth.errors.networkError";
  }
  return "auth.errors.networkError";
}

export function useForgotPasswordMutation(
  onSuccess?: (email: string) => void,
  onApiError?: (key: ApiErrorKey) => void,
) {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => forgotPassword(payload),
    onSuccess: (_data, variables) => {
      onSuccess?.(variables.email);
    },
    onError: (error) => {
      const key = mapToErrorKey(error);
      onApiError?.(key);
    },
  });
}
