<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getErrorMessage } from "@/api/http";
import { vacationRequestsApi } from "@/api/vacation-requests.api";
import AlertBanner from "@/components/ui/AlertBanner.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import TeamCalendar from "@/components/vacation/TeamCalendar.vue";
import { useAuthStore } from "@/stores/auth";
import type { TeamVacation } from "@/types/api";
import { daysOfMonth, formatMonth, monthKey, shiftMonth } from "@/utils/dates";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const currentMonth = monthKey(new Date());
const month = computed(() =>
	typeof route.query.month === "string" && /^\d{4}-\d{2}$/.test(route.query.month) ? route.query.month : currentMonth
);
const goTo = (key: string) => router.replace({ query: key === currentMonth ? {} : { month: key } });

const vacations = shallowRef<TeamVacation[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

watch(
	month,
	async (key) => {
		const days = daysOfMonth(key);
		loading.value = true;
		error.value = null;
		try {
			vacations.value = await vacationRequestsApi.team(days[0], days[days.length - 1]);
		} catch (err) {
			error.value = getErrorMessage(err);
		} finally {
			loading.value = false;
		}
	},
	{ immediate: true }
);

const peopleAway = computed(() => new Set(vacations.value.map((vacation) => vacation.userId)).size);
</script>

<template>
	<div class="space-y-6">
		<header class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<h1 class="text-2xl font-semibold text-slate-900">Team planning</h1>
				<p class="mt-1 text-sm text-slate-500">Approved and pending vacations of the whole team.</p>
			</div>
			<div class="flex items-center gap-2">
				<BaseButton variant="secondary" size="sm" aria-label="Previous month" @click="goTo(shiftMonth(month, -1))"
					>←</BaseButton
				>
				<p class="min-w-36 text-center font-medium text-slate-900">{{ formatMonth(month) }}</p>
				<BaseButton variant="secondary" size="sm" aria-label="Next month" @click="goTo(shiftMonth(month, 1))"
					>→</BaseButton
				>
				<BaseButton v-if="month !== currentMonth" variant="ghost" size="sm" @click="goTo(currentMonth)"
					>Today</BaseButton
				>
			</div>
		</header>

		<AlertBanner v-if="error" variant="error">{{ error }}</AlertBanner>

		<section class="card p-4">
			<div class="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
				<p>{{ peopleAway }} {{ peopleAway === 1 ? "person" : "people" }} with time off this month</p>
				<div class="flex items-center gap-4">
					<span class="flex items-center gap-1.5"><span class="size-3 rounded-sm bg-emerald-500" /> Approved</span>
					<span class="flex items-center gap-1.5"><span class="size-3 rounded-sm bg-amber-300" /> Pending</span>
					<span class="flex items-center gap-1.5"
						><span class="size-3 rounded-sm bg-slate-100 ring-1 ring-slate-200" /> Weekend</span
					>
				</div>
			</div>
			<TeamCalendar :month="month" :vacations="vacations" :current-user-id="auth.user?.id" :loading="loading" />
		</section>
	</div>
</template>
