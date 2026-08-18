export type Role = "PATIENT" | "DOCTOR" | "RECEPTIONIST" | "ADMIN";
export type Locale = "EN" | "AR";

export interface User {
	id: string;
	email: string;
	role: Role;
	isActive: boolean;
	firstName: string;
	lastName: string;
	preferredLocale: Locale;
	doctorProfileId?: string | null;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse {
	data: {
		accessToken: string;
		user: User;
	};
}

export interface CurrentUserResponse {
	data: User;
}

export interface RefreshResponse {
	data: {
		accessToken: string;
	};
}

export interface LoginFormData {
	email: string;
	password: string;
}

export interface RegisterPayload {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	preferredLocale?: Locale;
}

export interface RegisterResponse {
	data: {
		accessToken: string;
		user: User;
	};
}

export type ApiErrorKey =
	| "auth.errors.invalidCredentials"
	| "auth.errors.accountDisabled"
	| "auth.errors.rateLimited"
	| "auth.errors.networkError"
	| "auth.errors.emailConflict"
	| "auth.errors.emailRequired"
	| "auth.errors.resetFailed";

export interface ForgotPasswordRequest {
	email: string;
}

export interface ForgotPasswordResponse {
	message: string;
}

export interface ForgotPasswordFormValues {
	email: string;
}

export type ForgotPasswordView = "form" | "success";

export interface ResendCooldown {
	expiresAt: number;
	email: string;
}

export type ResetPasswordView = "form" | "invalid" | "success";

export interface ResetPasswordRequest {
	token: string;
	newPassword: string;
}

export interface ResetPasswordResponse {
	message: string;
}

export interface ResetPasswordFormValues {
	newPassword: string;
	confirmPassword: string;
}
