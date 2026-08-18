import { create } from "zustand";
import type { User } from "@/types";

type AuthStore = {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	setUser: (user: User) => void;
	setLoading: (isLoading: boolean) => void;
	logout: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
	user: null,
	isAuthenticated: false,
	isLoading: false,
	setUser: (user) => set({ user, isAuthenticated: true }),
	setLoading: (isLoading) => set({ isLoading }),
	logout: () => set({ user: null, isAuthenticated: false }),
}));
