<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import BaseButton from "@/components/ui/BaseButton.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();

const links = computed(() =>
	auth.hasRole("Validator")
		? [
				{ to: { name: "dashboard" }, label: "Requests" },
				{ to: { name: "team" }, label: "Team planning" },
			]
		: [
				{ to: { name: "my-requests" }, label: "My requests" },
				{ to: { name: "team" }, label: "Team planning" },
			]
);

const signOut = () => {
	auth.logout();
	void router.push({ name: "login" });
};
</script>

<template>
	<header class="border-b border-slate-200 bg-white">
		<div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
			<RouterLink to="/" class="flex items-center gap-2 font-semibold text-slate-900">
				<img src="/favicon.svg" alt="" class="size-7" />
				<span>Vacations</span>
			</RouterLink>

			<nav class="order-last flex w-full gap-1 sm:order-none sm:w-auto" aria-label="Main">
				<RouterLink
					v-for="link in links"
					:key="link.label"
					:to="link.to"
					class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
					active-class="bg-indigo-50 !text-indigo-700"
				>
					{{ link.label }}
				</RouterLink>
			</nav>

			<div class="ml-auto flex items-center gap-3">
				<div class="text-right leading-tight">
					<p class="text-sm font-medium text-slate-900">{{ auth.user?.name }}</p>
					<p class="text-xs text-slate-500">{{ auth.user?.role }}</p>
				</div>
				<BaseButton variant="secondary" size="sm" @click="signOut">Sign out</BaseButton>
			</div>
		</div>
	</header>
</template>
