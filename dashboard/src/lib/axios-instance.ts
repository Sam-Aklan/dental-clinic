import axios from "axios";
import qs from "qs";
import { AUTH_REFRESH } from "@/lib/api-paths";
import type { RefreshResponse } from "@/types";
import type { AxiosRequestConfig, AxiosRequestHeaders } from "axios";

type RetryConfig = AxiosRequestConfig & { _retry?: boolean };

let accessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

type MutableHeaders = AxiosRequestHeaders & { set?: (key: string, value: string) => void; delete?: (key: string) => void };

function normalizeHeaders(headers: unknown): MutableHeaders {
	if (headers && typeof headers === "object") {
		return headers as MutableHeaders;
	}
	return {} as MutableHeaders;
}

function applyAuthorizationHeader(headers: MutableHeaders, token: string | null) {
	if (token) {
		headers.Authorization = `Bearer ${token}`;
		headers.set?.("Authorization", `Bearer ${token}`);
		return;
	}

	delete headers.Authorization;
	headers.delete?.("Authorization");
}

const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
	withCredentials: true,
	headers: { "Content-Type": "application/json" },
	paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "brackets" }),
});

function setHeader(token: string | null) {
	if (token) {
		api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
		return;
	}
	delete api.defaults.headers.common["Authorization"];
}

function processQueue(error: unknown, token: string | null) {
	for (const promise of failedQueue) {
		if (error) {
			promise.reject(error);
		} else if (token) {
			promise.resolve(token);
		}
	}
	failedQueue = [];
}

export function setAccessToken(token: string) {
	accessToken = token;
	setHeader(token);
}

export function clearAccessToken() {
	accessToken = null;
	setHeader(null);
}

export function getAccessToken() {
	return accessToken;
}

export const setApiToken = setAccessToken;
export const clearApiToken = clearAccessToken;

api.interceptors.request.use((config) => {
	config.headers = normalizeHeaders(config.headers) as AxiosRequestHeaders;
	applyAuthorizationHeader(config.headers as MutableHeaders, accessToken);
	return config;
});

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const status = error?.response?.status;
		const originalRequest = error?.config as RetryConfig | undefined;

		if (!status || status !== 401 || !originalRequest || originalRequest._retry || originalRequest.url === AUTH_REFRESH) {
			return Promise.reject(error);
		}

		originalRequest._retry = true;

		if (isRefreshing) {
			return new Promise<string>((resolve, reject) => {
				failedQueue.push({ resolve, reject });
			}).then((token) => {
				originalRequest.headers = normalizeHeaders(originalRequest.headers) as AxiosRequestHeaders;
				applyAuthorizationHeader(originalRequest.headers as MutableHeaders, token);
				return api(originalRequest);
			});
		}

		isRefreshing = true;
		try {
			const res = await api.post<RefreshResponse>(AUTH_REFRESH);
			const token = res.data.data.accessToken;
			setAccessToken(token);
			processQueue(null, token);
			originalRequest.headers = normalizeHeaders(originalRequest.headers) as AxiosRequestHeaders;
			applyAuthorizationHeader(originalRequest.headers as MutableHeaders, token);
			return await api(originalRequest);
		} catch (refreshError) {
			processQueue(refreshError, null);
			clearAccessToken();
			try {
				localStorage.removeItem("auth_user");
			} catch {
				// ignore storage failures during tests or non-browser contexts
			}
			return Promise.reject(refreshError);
		} finally {
			isRefreshing = false;
		}
	},
);

export { api };
