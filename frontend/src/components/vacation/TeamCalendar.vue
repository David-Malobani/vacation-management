<script setup lang="ts">
import { computed } from "vue";
import type { TeamVacation } from "@/types/api";
import { daysOfMonth, formatDate, isWeekend, parseIsoDate, todayIso } from "@/utils/dates";

/** Month grid: one row per person, one column per day. */
const props = defineProps<{
	month: string;
	vacations: TeamVacation[];
	currentUserId?: number;
	loading?: boolean;
}>();

const days = computed(() => daysOfMonth(props.month));
const today = todayIso();
const weekday = new Intl.DateTimeFormat(undefined, { weekday: "narrow" });

const rows = computed(() => {
	const byUser = new Map<number, { userId: number; userName: string; vacations: TeamVacation[] }>();
	for (const vacation of props.vacations) {
		const row = byUser.get(vacation.userId) ?? { userId: vacation.userId, userName: vacation.userName, vacations: [] };
		row.vacations.push(vacation);
		byUser.set(vacation.userId, row);
	}
	// Current user first, then alphabetical.
	return [...byUser.values()].sort((a, b) =>
		a.userId === props.currentUserId ? -1 : b.userId === props.currentUserId ? 1 : a.userName.localeCompare(b.userName)
	);
});

const vacationOn = (vacations: TeamVacation[], day: string): TeamVacation | undefined =>
	vacations.find((vacation) => vacation.startDate <= day && day <= vacation.endDate);

const cellClass = (vacation: TeamVacation | undefined, day: string) => {
	if (vacation?.status === "Approved") return "bg-emerald-500";
	if (vacation?.status === "Pending")
		return "bg-amber-300 bg-[repeating-linear-gradient(45deg,transparent_0_4px,rgb(255_255_255/0.45)_4px_8px)]";
	return isWeekend(day) ? "bg-slate-100" : "bg-white";
};

const cellTitle = (name: string, vacation: TeamVacation | undefined) =>
	vacation
		? `${name}: ${formatDate(vacation.startDate)} → ${formatDate(vacation.endDate)} (${vacation.status})`
		: undefined;
</script>

<template>
	<div class="relative overflow-x-auto" :aria-busy="loading">
		<table class="w-full border-separate border-spacing-0 text-xs" :class="{ 'opacity-50': loading }">
			<thead>
				<tr>
					<th scope="col" class="sticky left-0 z-10 min-w-36 bg-white px-3 py-2 text-left font-semibold text-slate-600">
						Team member
					</th>
					<th
						v-for="day in days"
						:key="day"
						scope="col"
						class="min-w-7 px-0.5 py-1 text-center font-medium"
						:class="day === today ? 'text-indigo-700' : isWeekend(day) ? 'text-slate-400' : 'text-slate-600'"
					>
						<div>{{ weekday.format(parseIsoDate(day)) }}</div>
						<div
							class="mx-auto mt-0.5 flex size-6 items-center justify-center rounded-full tabular-nums"
							:class="{ 'bg-indigo-600 text-white': day === today }"
						>
							{{ parseIsoDate(day).getDate() }}
						</div>
					</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in rows" :key="row.userId">
					<th
						scope="row"
						class="sticky left-0 z-10 border-t border-slate-100 bg-white px-3 py-2 text-left font-medium whitespace-nowrap text-slate-800"
					>
						{{ row.userName }}
						<span v-if="row.userId === currentUserId" class="ml-1 text-indigo-600">(you)</span>
					</th>
					<td
						v-for="day in days"
						:key="day"
						class="h-9 border-t border-l border-slate-100"
						:class="cellClass(vacationOn(row.vacations, day), day)"
						:title="cellTitle(row.userName, vacationOn(row.vacations, day))"
					/>
				</tr>
				<tr v-if="!loading && rows.length === 0">
					<td :colspan="days.length + 1" class="px-4 py-10 text-center text-slate-500">
						Nobody has a vacation planned this month.
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
