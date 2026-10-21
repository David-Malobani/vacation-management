<script setup lang="ts">
import { computed } from "vue";
import BaseButton from "./BaseButton.vue";

const props = defineProps<{ page: number; pageSize: number; total: number; totalPages: number }>();
const emit = defineEmits<{ "update:page": [page: number] }>();

const range = computed(() => {
	if (props.total === 0) return "No results";
	const first = (props.page - 1) * props.pageSize + 1;
	const last = Math.min(props.page * props.pageSize, props.total);
	return `${first}–${last} of ${props.total}`;
});
</script>

<template>
	<nav class="flex items-center justify-between gap-3 text-sm text-slate-600" aria-label="Pagination">
		<p>{{ range }}</p>
		<div v-if="totalPages > 1" class="flex items-center gap-2">
			<BaseButton variant="secondary" size="sm" :disabled="page <= 1" @click="emit('update:page', page - 1)">
				← Previous
			</BaseButton>
			<span class="tabular-nums">Page {{ page }} / {{ totalPages }}</span>
			<BaseButton variant="secondary" size="sm" :disabled="page >= totalPages" @click="emit('update:page', page + 1)">
				Next →
			</BaseButton>
		</div>
	</nav>
</template>
