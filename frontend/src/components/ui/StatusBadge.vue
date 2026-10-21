<script setup lang="ts">
import type { VacationStatus } from "@/types/api";

defineProps<{ status: VacationStatus }>();

const STYLES: Record<VacationStatus, string> = {
	Pending: "bg-amber-50 text-amber-800 ring-amber-600/20",
	Approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
	Rejected: "bg-red-50 text-red-700 ring-red-600/20",
};
</script>

<template>
	<span
		class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset"
		:class="STYLES[status]"
	>
		{{ status }}
	</span>
</template>
