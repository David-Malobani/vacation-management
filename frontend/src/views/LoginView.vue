<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getErrorMessage } from "@/api/http";
import AlertBanner from "@/components/ui/AlertBanner.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import FormField from "@/components/ui/FormField.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const form = reactive({ email: "", password: "" });
const submitting = ref(false);
const error = ref<string | null>(null);
const sessionExpired = route.query.expired === "1";

/** Seeded by `npm run db:seed` (all share the same password). */
const DEMO_PASSWORD = "password123";
const demoAccounts = [
	{ email: "alice@example.com", label: "Alice", role: "Requester" },
	{ email: "bob@example.com", label: "Bob", role: "Requester" },
	{ email: "manager@example.com", label: "Maya", role: "Validator" },
];

const useDemoAccount = (email: string) => {
	form.email = email;
	form.password = DEMO_PASSWORD;
	error.value = null;
};

const onSubmit = async () => {
	if (!form.email || !form.password) {
		error.value = "Please enter your email and password.";
		return;
	}
	submitting.value = true;
	error.value = null;
	try {
		await auth.login(form.email.trim(), form.password);
		const redirect =
			typeof route.query.redirect === "string" && route.query.redirect.startsWith("/") ? route.query.redirect : null;
		await router.replace(redirect ?? auth.homeRoute);
	} catch (err) {
		error.value = getErrorMessage(err);
	} finally {
		submitting.value = false;
	}
};
</script>

<template>
	<div class="flex min-h-[80vh] items-center justify-center">
		<div class="w-full max-w-sm space-y-6">
			<div class="text-center">
				<img src="/favicon.svg" alt="" class="mx-auto size-12" />
				<h1 class="mt-4 text-2xl font-semibold text-slate-900">Vacation Management</h1>
				<p class="mt-1 text-sm text-slate-500">Sign in to request or review vacations</p>
			</div>

			<form class="card space-y-4 p-6" novalidate @submit.prevent="onSubmit">
				<AlertBanner v-if="sessionExpired && !error" variant="info"
					>Your session expired. Please sign in again.</AlertBanner
				>
				<AlertBanner v-if="error" variant="error">{{ error }}</AlertBanner>

				<FormField id="email" label="Email">
					<input id="email" v-model="form.email" type="email" autocomplete="username" class="form-control" required />
				</FormField>
				<FormField id="password" label="Password">
					<input
						id="password"
						v-model="form.password"
						type="password"
						autocomplete="current-password"
						class="form-control"
						required
					/>
				</FormField>

				<BaseButton type="submit" class="w-full" :loading="submitting">Sign in</BaseButton>
			</form>

			<div class="card p-4">
				<p class="text-xs font-semibold tracking-wide text-slate-500 uppercase">Demo accounts</p>
				<ul class="mt-2 divide-y divide-slate-100">
					<li v-for="account in demoAccounts" :key="account.email">
						<button
							type="button"
							class="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-slate-50"
							@click="useDemoAccount(account.email)"
						>
							<span>
								<span class="font-medium text-slate-900">{{ account.label }}</span>
								<span class="text-slate-500"> · {{ account.email }}</span>
							</span>
							<span class="text-xs text-slate-500">{{ account.role }}</span>
						</button>
					</li>
				</ul>
				<p class="mt-2 px-2 text-xs text-slate-500">Password: {{ DEMO_PASSWORD }}</p>
			</div>
		</div>
	</div>
</template>
