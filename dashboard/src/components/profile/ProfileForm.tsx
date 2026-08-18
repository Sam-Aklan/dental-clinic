import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { profileSchema, type ProfileFormValues } from "@/lib/profile/schemas";
import { useUpdateProfile } from "@/hooks/profile/use-update-profile";
import type { UserProfileDTO, UpdateProfilePayload } from "@/types/profile";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ProfileFormProps {
  profile: UserProfileDTO;
  className?: string;
}

export function ProfileForm({ profile, className }: ProfileFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      preferredLocale: profile.preferredLocale,
      phoneNumber: profile.phone ?? "",
      dateOfBirth: profile.patientProfile?.dateOfBirth ?? "",
    },
  });

  const { mutate: saveProfile, isPending } = useUpdateProfile(setError);

  const hasPatientProfile = profile.patientProfile != null;

  const onSubmit = (data: ProfileFormValues) => {
    const phoneNumber = data.phoneNumber ?? "";
    const payload: UpdateProfilePayload = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      preferredLocale: data.preferredLocale,
    };
    payload.phone = phoneNumber.trim() ? phoneNumber.trim() : null;
    if (hasPatientProfile && data.dateOfBirth) {
      payload.dateOfBirth = data.dateOfBirth;
    }
    saveProfile(payload);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-4", className)}
      noValidate
    >
      <div className="grid grid-cols-2 gap-3">
        <Field orientation="vertical">
          <Label htmlFor="firstName">{t("profile.personalInfo.firstName")}</Label>
          <FieldContent>
            <Input
              id="firstName"
              type="text"
              autoComplete="given-name"
              aria-invalid={!!errors.firstName}
              {...register("firstName")}
            />
            <FieldError errors={errors.firstName ? [errors.firstName] : []}>
              {errors.firstName?.message && t(errors.firstName.message)}
            </FieldError>
          </FieldContent>
        </Field>

        <Field orientation="vertical">
          <Label htmlFor="lastName">{t("profile.personalInfo.lastName")}</Label>
          <FieldContent>
            <Input
              id="lastName"
              type="text"
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
              {...register("lastName")}
            />
            <FieldError errors={errors.lastName ? [errors.lastName] : []}>
              {errors.lastName?.message && t(errors.lastName.message)}
            </FieldError>
          </FieldContent>
        </Field>
      </div>

      <div>
        <Label>{t("profile.personalInfo.email")}</Label>
        <p className="mt-1.5 text-sm text-muted-foreground" aria-label={t("profile.personalInfo.email")}>
          {profile.email}
        </p>
      </div>

      <Field orientation="vertical">
        <Label htmlFor="phoneNumber">{t("profile.personalInfo.phoneNumber")}</Label>
        <FieldContent>
          <Input
            id="phoneNumber"
            type="tel"
            autoComplete="tel"
            aria-invalid={!!errors.phoneNumber}
            {...register("phoneNumber")}
          />
          <FieldError errors={errors.phoneNumber ? [errors.phoneNumber] : []}>
            {errors.phoneNumber?.message && t(errors.phoneNumber.message)}
          </FieldError>
        </FieldContent>
      </Field>

      {hasPatientProfile && (
        <>
          <Field orientation="vertical">
            <Label htmlFor="dateOfBirth">{t("profile.personalInfo.dateOfBirth")}</Label>
            <FieldContent>
              <Input
                id="dateOfBirth"
                type="date"
                aria-invalid={!!errors.dateOfBirth}
                {...register("dateOfBirth")}
              />
              <FieldError errors={errors.dateOfBirth ? [errors.dateOfBirth] : []}>
                {errors.dateOfBirth?.message && t(errors.dateOfBirth.message)}
              </FieldError>
            </FieldContent>
          </Field>
        </>
      )}

      <Field orientation="vertical">
        <Label htmlFor="preferredLocale">{t("profile.personalInfo.preferredLocale")}</Label>
        <FieldContent>
          <select
            id="preferredLocale"
            className="border-input bg-background text-foreground ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t("profile.personalInfo.preferredLocale")}
            {...register("preferredLocale")}
          >
            <option value="EN">{t("profile.personalInfo.localeEn")}</option>
            <option value="AR">{t("profile.personalInfo.localeAr")}</option>
          </select>
        </FieldContent>
      </Field>

      <Button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
        {t("profile.personalInfo.save")}
      </Button>
    </form>
  );
}
