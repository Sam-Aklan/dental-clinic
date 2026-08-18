import { beforeEach, describe, expect, it, vi } from "vitest";
import { deferredPromise } from "./test-utils";

const mocks = vi.hoisted(() => {
	type RequestConfig = { headers: Record<string, string | undefined>; url?: string };
	type MockApi = ReturnType<typeof vi.fn> & {
		post: ReturnType<typeof vi.fn>;
		get: ReturnType<typeof vi.fn>;
		defaults: { headers: { common: Record<string, string | undefined> } };
		interceptors: {
			request: { use: ReturnType<typeof vi.fn> };
			response: { use: ReturnType<typeof vi.fn> };
		};
	};
	const requestHandlers: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>> = [];
	const responseRejectedHandlers: Array<(error: unknown) => unknown> = [];
	const api = vi.fn((config: RequestConfig) => Promise.resolve({ config })) as MockApi;
	api.post = vi.fn();
	api.get = vi.fn();
	api.defaults = { headers: { common: {} as Record<string, string | undefined> } };
	api.interceptors = {
		request: {
			use: vi.fn((fulfilled) => {
				requestHandlers.push(fulfilled);
			}),
		},
		response: {
			use: vi.fn((_, rejected) => {
				responseRejectedHandlers.push(rejected);
			}),
		},
	};
	const create = vi.fn(() => api);
	const isAxiosError = (value: { isAxiosError?: boolean } | null | undefined) => Boolean(value?.isAxiosError);
	return { api, create, requestHandlers, responseRejectedHandlers, isAxiosError };
});

vi.mock("axios", () => ({
	default: { create: mocks.create, isAxiosError: mocks.isAxiosError },
	create: mocks.create,
	isAxiosError: mocks.isAxiosError,
}));

import { AUTH_REFRESH } from "@/lib/api-paths";
import { clearAccessToken, setAccessToken } from "@/lib/axios-instance";

const requestHandler = () => mocks.requestHandlers[0];
const responseHandler = () => mocks.responseRejectedHandlers[0];

describe("axios auth interceptor", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		clearAccessToken();
		mocks.api.defaults.headers.common = {};
	});

	it("sets and clears the Authorization header in memory", async () => {
		setAccessToken("token-123");
		const config = await requestHandler()({ headers: {} });
		expect(config.headers.Authorization).toBe("Bearer token-123");
		expect(mocks.api.defaults.headers.common.Authorization).toBe("Bearer token-123");

		clearAccessToken();
		const cleared = await requestHandler()({ headers: { Authorization: "Bearer old" } });
		expect(cleared.headers.Authorization).toBeUndefined();
		expect(mocks.api.defaults.headers.common.Authorization).toBeUndefined();
		expect(localStorage.getItem("auth_user")).toBeNull();
	});

	it("refreshes once and retries the original request", async () => {
		setAccessToken("old-token");
		const refresh = deferredPromise<{ data: { data: { accessToken: string } } }>();
		mocks.api.post.mockImplementationOnce((url: string) => {
			expect(url).toBe(AUTH_REFRESH);
			return refresh.promise;
		});
		mocks.api.mockResolvedValueOnce({ data: "retry-ok" });

		const error = { isAxiosError: true, response: { status: 401 }, config: { url: "/private", headers: {} } };
		const pending = responseHandler()(error);
		refresh.resolve({ data: { data: { accessToken: "token-123" } } });

		await expect(pending).resolves.toEqual({ data: "retry-ok" });
		expect(mocks.api.post).toHaveBeenCalledTimes(1);
		expect(mocks.api).toHaveBeenCalledTimes(1);
		expect(mocks.api.defaults.headers.common.Authorization).toBe("Bearer token-123");
	});

	it("queues concurrent 401 responses behind one refresh", async () => {
		setAccessToken("old-token");
		const refresh = deferredPromise<{ data: { data: { accessToken: string } } }>();
		mocks.api.post.mockReturnValueOnce(refresh.promise);
		mocks.api.mockResolvedValue({ data: "retry-ok" });

		const first = responseHandler()({ isAxiosError: true, response: { status: 401 }, config: { url: "/private", headers: {} } });
		const second = responseHandler()({ isAxiosError: true, response: { status: 401 }, config: { url: "/private-2", headers: {} } });
		refresh.resolve({ data: { data: { accessToken: "token-123" } } });

		await expect(first).resolves.toEqual({ data: "retry-ok" });
		await expect(second).resolves.toEqual({ data: "retry-ok" });
		expect(mocks.api.post).toHaveBeenCalledTimes(1);
		expect(mocks.api).toHaveBeenCalledTimes(2);
	});

	it("does not retry the refresh endpoint itself", async () => {
		await expect(
			responseHandler()({ isAxiosError: true, response: { status: 401 }, config: { url: AUTH_REFRESH, headers: {} } }),
		).rejects.toMatchObject({ response: { status: 401 } });
		expect(mocks.api.post).not.toHaveBeenCalled();
	});

	it("clears the snapshot on refresh failure", async () => {
		localStorage.setItem("auth_user", JSON.stringify({ id: "1" }));
		mocks.api.post.mockRejectedValueOnce(new Error("refresh failed"));

		const error = { isAxiosError: true, response: { status: 401 }, config: { url: "/private", headers: {} } };
		await expect(responseHandler()(error)).rejects.toThrow("refresh failed");
		expect(localStorage.getItem("auth_user")).toBeNull();
		expect(mocks.api.defaults.headers.common.Authorization).toBeUndefined();
	});
});
