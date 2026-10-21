<script setup lang="ts">
import { computed } from "vue";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost";

const props = withDefaults(
	defineProps<{
		variant?: Variant;
		size?: "sm" | "md";
		type?: "button" | "submit";
		loading?: boolean;
		disabled?: boolean;
	}>(),
	{ variant: "primary", size: "md", type: "button", loading: false, disabled: false }
);

const VARIANTS: Record<Variant, string> = {
	primary: "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600",
	secondary: "bg-white text-slate-700 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 focus-visible:outline-slate-400",
	success: "bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:outline-emerald-600",
	danger: "bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600",
	ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400",
};

const classes = computed(() => [
	"inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
	"focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
	props.size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm",
	VARIANTS[props.variant],
]);
</script>

<template>
	<button :type="type" :class="classes" :disabled="disabled || loading" :aria-busy="loading">
		<svg v-if="loading" class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
			<path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
		</svg>
		<slot />
	</button>
</template>
