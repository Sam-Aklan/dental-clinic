import { api } from "@/lib/axios-instance";
import { AUTH_LOGIN, AUTH_REGISTER, AUTH_ME, AUTH_LOGOUT, AUTH_REFRESH, AUTH_FORGOT_PASSWORD, AUTH_RESET_PASSWORD } from "@/lib/api-paths";
import { setAccessToken } from "@/lib/axios-instance";
import type { CurrentUserResponse, ForgotPasswordRequest, ForgotPasswordResponse, LoginResponse, RefreshResponse, RegisterPayload, RegisterResponse, ResetPasswordRequest, ResetPasswordResponse } from "@/types";

export async function loginUser(email: string, password: string): Promise<LoginResponse["data"]> {
	const res = await api.post<LoginResponse>(AUTH_LOGIN, { email, password });
	setAccessToken(res.data.data.accessToken);
	return res.data.data;
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse["data"]> {
	const res = await api.post<RegisterResponse>(AUTH_REGISTER, payload);
	setAccessToken(res.data.data.accessToken);
	return res.data.data;
}

export async function getCurrentUser(): Promise<CurrentUserResponse["data"]> {
	const res = await api.get<CurrentUserResponse>(AUTH_ME);
	return res.data.data;
}

export async function logoutUser(): Promise<void> {
	await api.post(AUTH_LOGOUT);
}

type ForgotPasswordInput = ForgotPasswordRequest | string;

function normalizeForgotPasswordPayload(payload: ForgotPasswordInput): ForgotPasswordRequest {
	return typeof payload === "string" ? { email: payload } : payload;
}

export async function forgotPassword(payload: ForgotPasswordInput): Promise<ForgotPasswordResponse> {
	const res = await api.post<ForgotPasswordResponse>(AUTH_FORGOT_PASSWORD, normalizeForgotPasswordPayload(payload));
	return res.data;
}

type ResetPasswordInput = ResetPasswordRequest | [string, string];

function normalizeResetPasswordPayload(payload: ResetPasswordInput): ResetPasswordRequest {
	if (Array.isArray(payload)) {
		const [token, newPassword] = payload;
		return { token, newPassword };
	}
	return payload;
}

export async function resetPassword(payload: ResetPasswordInput): Promise<ResetPasswordResponse> {
	const res = await api.post<ResetPasswordResponse>(AUTH_RESET_PASSWORD, normalizeResetPasswordPayload(payload));
	return res.data;
}

export async function refreshAccessToken(): Promise<RefreshResponse["data"]> {
	const res = await api.post<RefreshResponse>(AUTH_REFRESH);
	setAccessToken(res.data.data.accessToken);
	return res.data.data;
}
