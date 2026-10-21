<script setup lang="ts">
import AppHeader from "@/components/layout/AppHeader.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
</script>

<template>
	<div class="min-h-screen text-slate-900">
		<AppHeader v-if="auth.isAuthenticated" />
		<main class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<RouterView />
		</main>
	</div>
</template>
