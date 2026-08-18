import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import axios from "axios";
import { updateProfile } from "@/lib/profile/actions/profile.api";
import { useAuth } from "@/hooks/auth/use-auth";
import i18n from "@/i18n";
import type { UpdateProfilePayload, Locale } from "@/types";
import type { UseFormSetError } from "react-hook-form";
import type { ProfileFormValues } from "@/lib/profile/schemas";

export function useUpdateProfile(setError: UseFormSetError<ProfileFormValues>) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: async (updatedProfile, payload) => {
      queryClient.setQueryData(["profile"], updatedProfile);
      await refreshUser();
      const currentLocale = i18n.language.toUpperCase() as Locale;
      if (payload.preferredLocale && payload.preferredLocale !== currentLocale) {
        const lang = payload.preferredLocale.toLowerCase();
        await i18n.changeLanguage(lang);
        localStorage.setItem("lang", lang);
      }
      toast.success(t("profile.personalInfo.saveSuccess"));
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const fieldErrors = error.response.data?.errors ?? {};
        for (const [field, message] of Object.entries(fieldErrors)) {
          setError(field as keyof ProfileFormValues, { message: String(message) });
        }
      } else {
        toast.error(t("profile.errors.saveFailed"));
      }
    },
  });
}
