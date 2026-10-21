<script setup lang="ts">
import { VACATION_STATUSES, type VacationStatus } from "@/types/api";

/** "All / Pending / Approved / Rejected" switcher; `undefined` means all. */
defineProps<{ modelValue: VacationStatus | undefined }>();
const emit = defineEmits<{ "update:modelValue": [status: VacationStatus | undefined] }>();

const options: Array<{ label: string; value: VacationStatus | undefined }> = [
	{ label: "All", value: undefined },
	...VACATION_STATUSES.map((status) => ({ label: status, value: status })),
];
</script>

<template>
	<div class="inline-flex rounded-lg bg-slate-100 p-1 text-sm" role="tablist" aria-label="Filter by status">
		<button
			v-for="option in options"
			:key="option.label"
			type="button"
			role="tab"
			:aria-selected="modelValue === option.value"
			class="rounded-md px-3 py-1 font-medium transition-colors"
			:class="modelValue === option.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
			@click="emit('update:modelValue', option.value)"
		>
			{{ option.label }}
		</button>
	</div>
</template>
