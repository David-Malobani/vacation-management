<script setup lang="ts">
type Variant = "error" | "success" | "info";

withDefaults(defineProps<{ variant?: Variant; dismissible?: boolean }>(), { variant: "info", dismissible: false });
defineEmits<{ dismiss: [] }>();

const STYLES: Record<Variant, string> = {
	error: "bg-red-50 text-red-800 ring-red-200",
	success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
	info: "bg-indigo-50 text-indigo-800 ring-indigo-200",
};
</script>

<template>
	<div
		:role="variant === 'error' ? 'alert' : 'status'"
		class="flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm ring-1"
		:class="STYLES[variant]"
	>
		<div><slot /></div>
		<button
			v-if="dismissible"
			type="button"
			class="-m-1 rounded p-1 opacity-70 hover:opacity-100"
			aria-label="Dismiss"
			@click="$emit('dismiss')"
		>
			✕
		</button>
	</div>
</template>
