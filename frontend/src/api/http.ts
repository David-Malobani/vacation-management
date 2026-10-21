import axios from "axios";
import type { ApiErrorBody } from "@/types/api";

const TOKEN_KEY = "vacation-management.token";

/** The JWT lives in localStorage so a page reload keeps the session. */
export const tokenStorage = {
	get: (): string | null => localStorage.getItem(TOKEN_KEY),
	set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
	clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

export const http = axios.create({
	baseURL: import.meta.env.VITE_API_URL ?? "/api",
	headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
	const token = tokenStorage.get();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

let unauthorizedHandler: (() => void) | null = null;

/** Called when a request made with a token gets a 401 (expired or revoked session). */
export const onUnauthorized = (handler: () => void): void => {
	unauthorizedHandler = handler;
};

http.interceptors.response.use(
	(response) => response,
	(error) => {
		if (axios.isAxiosError(error) && error.response?.status === 401 && tokenStorage.get()) {
			unauthorizedHandler?.();
		}
		return Promise.reject(error);
	}
);

/** Human-readable message for any error thrown by an API call. */
export const getErrorMessage = (error: unknown, fallback = "Something went wrong. Please try again."): string => {
	if (axios.isAxiosError<ApiErrorBody>(error)) {
		if (!error.response) {
			return "Cannot reach the server. Is the API running?";
		}
		return error.response.data?.error?.message ?? fallback;
	}
	return error instanceof Error ? error.message : fallback;
};
