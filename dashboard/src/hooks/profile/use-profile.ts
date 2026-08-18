import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/lib/profile/actions/profile.api";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getUserProfile,
  });
}
