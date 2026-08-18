import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import axios from "axios";
import { changePassword } from "@/lib/profile/actions/profile.api";
import type { ChangePasswordPayload } from "@/types";
import type { UseFormSetError } from "react-hook-form";
import type { ChangePasswordFormValues } from "@/lib/profile/schemas";

export function useChangePassword(
  setError: UseFormSetError<ChangePasswordFormValues>,
  onSuccess: () => void,
) {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
    onSuccess: () => {
      onSuccess();
      toast.success(t("profile.changePassword.successToast"));
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const body = error.response?.data;
        if (status === 400 && body?.message === "current_password_incorrect") {
          setError("currentPassword", {
            message: t("profile.errors.incorrectCurrentPassword"),
          });
          return;
        }
        if (status === 400 && body?.message === "password_same_as_current") {
          setError("newPassword", { message: t("profile.errors.passwordSameAsCurrent") });
          return;
        }
        if (status === 400 && body?.errors?.newPassword) {
          setError("newPassword", { message: String(body.errors.newPassword) });
          return;
        }
      }
      toast.error(t("profile.errors.passwordChangeFailed"));
    },
  });
}
