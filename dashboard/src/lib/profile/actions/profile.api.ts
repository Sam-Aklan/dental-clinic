import { api } from "@/lib/axios-instance";
import { USERS_ME, USERS_ME_PASSWORD } from "@/lib/api-paths";
import type { UserProfileDTO, UpdateProfilePayload, ChangePasswordPayload } from "@/types/profile";

export async function getUserProfile(): Promise<UserProfileDTO> {
  const res = await api.get<{ data: UserProfileDTO }>(USERS_ME);
  return res.data.data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfileDTO> {
  const res = await api.patch<{ data: UserProfileDTO }>(USERS_ME, payload);
  return res.data.data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await api.post(USERS_ME_PASSWORD, payload);
}
