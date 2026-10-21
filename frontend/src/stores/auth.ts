import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { RouteLocationRaw } from "vue-router";
import { authApi } from "@/api/auth.api";
import { tokenStorage } from "@/api/http";
import type { Role, User } from "@/types/api";

export const useAuthStore = defineStore("auth", () => {
	const token = ref<string | null>(tokenStorage.get());
	const user = ref<User | null>(null);

	const isAuthenticated = computed(() => Boolean(token.value && user.value));
	const hasRole = (role: Role): boolean => user.value?.role === role;

	/** Landing page for the signed-in user's role. */
	const homeRoute = computed<RouteLocationRaw>(() =>
		user.value?.role === "Validator" ? { name: "dashboard" } : { name: "my-requests" }
	);

	async function login(email: string, password: string): Promise<void> {
		const result = await authApi.login(email, password);
		tokenStorage.set(result.token);
		token.value = result.token;
		user.value = result.user;
	}

	function logout(): void {
		tokenStorage.clear();
		token.value = null;
		user.value = null;
	}

	let restoring: Promise<void> | null = null;

	/** After a reload: turns a stored token back into a user (or drops it if it's no longer valid). */
	function restoreSession(): Promise<void> {
		if (!token.value || user.value) {
			return Promise.resolve();
		}
		restoring ??= authApi
			.me()
			.then((me) => {
				user.value = me;
			})
			.catch(() => logout())
			.finally(() => {
				restoring = null;
			});
		return restoring;
	}

	return { user, isAuthenticated, homeRoute, hasRole, login, logout, restoreSession };
});
