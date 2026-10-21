<script setup lang="ts">
/** Label + control + hint/error. The control goes in the default slot and should use `id` as its id. */
defineProps<{
	id: string;
	label: string;
	error?: string | null;
	hint?: string;
	required?: boolean;
}>();
</script>

<template>
	<div class="space-y-1">
		<label :for="id" class="block text-sm font-medium text-slate-700">
			{{ label }}
			<span v-if="required" class="text-red-500" aria-hidden="true">*</span>
		</label>
		<slot />
		<p v-if="error" :id="`${id}-error`" class="text-xs text-red-600">{{ error }}</p>
		<p v-else-if="hint" class="text-xs text-slate-500">{{ hint }}</p>
	</div>
</template>
