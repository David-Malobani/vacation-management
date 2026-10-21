<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps<{ open: boolean; title: string }>();
const emit = defineEmits<{ close: [] }>();

const panel = ref<HTMLElement | null>(null);

const onKeydown = (event: KeyboardEvent) => {
	if (event.key === "Escape") emit("close");
};

// Focus the first field when opening, and listen for Escape only while open.
watch(
	() => props.open,
	async (open) => {
		if (open) {
			document.addEventListener("keydown", onKeydown);
			await nextTick();
			panel.value?.querySelector<HTMLElement>("textarea, input, select, button")?.focus();
		} else {
			document.removeEventListener("keydown", onKeydown);
		}
	},
	{ immediate: true }
);

onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>

<template>
	<Teleport to="body">
		<div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
			<div class="absolute inset-0 bg-slate-900/40" aria-hidden="true" @click="emit('close')" />
			<div
				ref="panel"
				role="dialog"
				aria-modal="true"
				:aria-label="title"
				class="card relative w-full max-w-md p-6 shadow-xl"
			>
				<h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
				<div class="mt-3 text-sm text-slate-600">
					<slot />
				</div>
				<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<slot name="footer" />
				</div>
			</div>
		</div>
	</Teleport>
</template>
