
import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import i18next from "@/i18n";
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser } from "@/lib/auth/actions";
import { clearAccessToken, getAccessToken } from "@/lib/axios-instance";
import { useAuthStore } from "@/stores";
import type { RegisterPayload, User } from "@/types";

const AUTH_USER_KEY = "auth_user";

export interface AuthContextValue {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (payload: RegisterPayload) => Promise<void>;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
}

function readStoredUser(): User | null {
	const stored = localStorage.getItem(AUTH_USER_KEY);
	if (!stored) {
		return null;
	}
	try {
		return JSON.parse(stored) as User;
	} catch {
		localStorage.removeItem(AUTH_USER_KEY);
		return null;
	}
}

function persistUser(user: User | null) {
	if (user) {
		localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
		return;
	}
	localStorage.removeItem(AUTH_USER_KEY);
}

function syncPreferredLocale(user: User) {
	if (user.preferredLocale === "EN") {
		void i18next.changeLanguage("en");
	}
	if (user.preferredLocale === "AR") {
		void i18next.changeLanguage("ar");
	}
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(() => readStoredUser());
	const [isLoading, setIsLoading] = useState(() => !!readStoredUser());
	const store = useAuthStore.getState();
	const didBootstrapRef = useRef(false);

	const setAuthUser = useCallback((nextUser: User | null) => {
		setUser(nextUser);
		persistUser(nextUser);
		
		if (nextUser) {
			store.setUser(nextUser);
		} else {
			store.logout();
		}
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		const result = await loginUser(email, password);
		setAuthUser(result.user);
		syncPreferredLocale(result.user);
		setIsLoading(false);
	}, [setAuthUser]);

	const register = useCallback(async (payload: RegisterPayload) => {
		const result = await registerUser(payload);
		setAuthUser(result.user);
		syncPreferredLocale(result.user);
		setIsLoading(false);
	}, []);

	const logout = useCallback(async () => {
		try {
			await logoutUser();
		} catch {
			// best effort
		} finally {
			clearAccessToken();
			setAuthUser(null);
			setIsLoading(false);
		}
	}, []);

	const refreshUser = useCallback(async () => {
		try {
			const result = await getCurrentUser();
		setAuthUser(result);
		setIsLoading(false);
		} catch {
			setAuthUser(null)
		}finally{
			setIsLoading(false)
		}
		
	}, []);

	useEffect(() => {
		if (didBootstrapRef.current) {
			return;
		}
		didBootstrapRef.current = true;

		const storedUser = readStoredUser();
		// AR: إذا لم يكن هناك مستخدم مخزن محليًا، لا داعي لاستدعاء نقاط النهاية لأن الجلسة غير موجودة.
		// EN: If there is no stored user, skip the endpoint call — no session exists.
		if (!storedUser) {
			setIsLoading(false);
			return;
		}

		let active = true;
		void (async () => {
			try {
				if (!getAccessToken()) {
					await refreshAccessToken();
				}
				const result = await getCurrentUser();
				if (!active) return;
				setAuthUser(result);
			} catch {
				if (!active) return;
				setAuthUser(null);
			} finally {
				if (active) {
					setIsLoading(false);
				}
			}
		})();
		return () => {
			active = false;
		};
	}, []);

	useEffect(() => {
		
		if (user) {
			store.setUser(user);
		} else {
			store.logout();
		}
		// Intentionally sync the initial snapshot once on mount.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	useEffect(() => {
		store.setLoading(isLoading);
	}, [isLoading]);

	const value = useMemo<AuthContextValue>(() => ({
		user,
		isLoading,
		isAuthenticated: user !== null,
		login,
		register,
		logout,
		refreshUser,
	}), [isLoading, login, logout, refreshUser, register, user]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
