import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import type { Role } from "@/types/api";

declare module "vue-router" {
	interface RouteMeta {
		/** Reachable without signing in. */
		public?: boolean;
		/** Restrict to these roles; omitted means any signed-in user. */
		roles?: Role[];
		title?: string;
	}
}

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: "/login",
			name: "login",
			component: () => import("@/views/LoginView.vue"),
			meta: { public: true, title: "Sign in" },
		},
		{
			// Sends each role to its own landing page (resolved in beforeEnter, after the session is restored).
			path: "/",
			name: "home",
			component: { render: () => null },
			beforeEnter: () => useAuthStore().homeRoute,
		},
		{
			path: "/my-requests",
			name: "my-requests",
			component: () => import("@/views/RequesterView.vue"),
			meta: { roles: ["Requester"], title: "My requests" },
		},
		{
			path: "/dashboard",
			name: "dashboard",
			component: () => import("@/views/ValidatorDashboardView.vue"),
			meta: { roles: ["Validator"], title: "Requests dashboard" },
		},
		{
			path: "/team",
			name: "team",
			component: () => import("@/views/TeamCalendarView.vue"),
			meta: { title: "Team planning" },
		},
		{
			path: "/:pathMatch(.*)*",
			name: "not-found",
			component: () => import("@/views/NotFoundView.vue"),
			meta: { public: true, title: "Page not found" },
		},
	],
});

router.beforeEach(async (to) => {
	const auth = useAuthStore();
	await auth.restoreSession();

	if (to.meta.public) {
		return to.name === "login" && auth.isAuthenticated ? auth.homeRoute : true;
	}
	if (!auth.isAuthenticated) {
		return { name: "login", query: { redirect: to.fullPath } };
	}
	if (to.meta.roles && !to.meta.roles.some((role) => auth.hasRole(role))) {
		return auth.homeRoute;
	}
	return true;
});

router.afterEach((to) => {
	document.title = to.meta.title ? `${to.meta.title} · Vacation Management` : "Vacation Management";
});
