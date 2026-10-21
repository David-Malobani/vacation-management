<script setup lang="ts">
import StatusBadge from "@/components/ui/StatusBadge.vue";
import type { VacationRequest } from "@/types/api";
import { daysInclusive, formatDate, formatDateTime } from "@/utils/dates";

/** Shared by the requester's list and the validator dashboard; row actions come from the `actions` slot. */
withDefaults(
	defineProps<{
		requests: VacationRequest[];
		loading?: boolean;
		showEmployee?: boolean;
		emptyText?: string;
	}>(),
	{ loading: false, showEmployee: false, emptyText: "No vacation requests yet." }
);

defineSlots<{ actions?(props: { request: VacationRequest }): unknown }>();
</script>

<template>
	<div class="relative overflow-x-auto">
		<table class="min-w-full divide-y divide-slate-200 text-sm" :aria-busy="loading">
			<thead>
				<tr class="text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
					<th v-if="showEmployee" scope="col" class="px-4 py-3">Employee</th>
					<th scope="col" class="px-4 py-3">Period</th>
					<th scope="col" class="px-4 py-3">Reason</th>
					<th scope="col" class="px-4 py-3">Status</th>
					<th scope="col" class="px-4 py-3">Validator comment</th>
					<th scope="col" class="px-4 py-3">Submitted</th>
					<th v-if="$slots.actions" scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-100" :class="{ 'opacity-50': loading }">
				<tr v-for="request in requests" :key="request.id" class="align-top hover:bg-slate-50">
					<td v-if="showEmployee" class="px-4 py-3">
						<p class="font-medium text-slate-900">{{ request.user?.name }}</p>
						<p class="text-xs text-slate-500">{{ request.user?.email }}</p>
					</td>
					<td class="px-4 py-3 whitespace-nowrap">
						<p class="font-medium text-slate-900">
							{{ formatDate(request.startDate) }} → {{ formatDate(request.endDate) }}
						</p>
						<p class="text-xs text-slate-500">{{ daysInclusive(request.startDate, request.endDate) }} days</p>
					</td>
					<td class="max-w-56 px-4 py-3 break-words text-slate-700">
						{{ request.reason ?? "—" }}
					</td>
					<td class="px-4 py-3"><StatusBadge :status="request.status" /></td>
					<td class="max-w-64 px-4 py-3 break-words text-slate-700">
						{{ request.comments ?? "—" }}
					</td>
					<td class="px-4 py-3 whitespace-nowrap text-slate-500">{{ formatDateTime(request.createdAt) }}</td>
					<td v-if="$slots.actions" class="px-4 py-3 text-right whitespace-nowrap">
						<slot name="actions" :request="request" />
					</td>
				</tr>
				<tr v-if="!loading && requests.length === 0">
					<td colspan="7" class="px-4 py-10 text-center text-slate-500">{{ emptyText }}</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
