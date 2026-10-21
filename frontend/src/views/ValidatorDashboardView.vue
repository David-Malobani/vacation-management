<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from "vue";
import { type LocationQuery, useRoute, useRouter } from "vue-router";
import { getErrorMessage } from "@/api/http";
import { usersApi } from "@/api/users.api";
import { vacationRequestsApi } from "@/api/vacation-requests.api";
import AlertBanner from "@/components/ui/AlertBanner.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import PaginationBar from "@/components/ui/PaginationBar.vue";
import StatusTabs from "@/components/ui/StatusTabs.vue";
import DecisionDialog, { type Decision } from "@/components/vacation/DecisionDialog.vue";
import VacationRequestTable from "@/components/vacation/VacationRequestTable.vue";
import { usePaginatedList } from "@/composables/usePaginatedList";
import { type User, VACATION_STATUSES, type VacationRequest, type VacationStatus } from "@/types/api";
import { todayIso } from "@/utils/dates";

const route = useRoute();
const router = useRouter();

// --- Filters live in the URL, so a filtered view can be reloaded or shared ---
const readFilters = (query: LocationQuery) => {
	const status = VACATION_STATUSES.find((value) => value === query.status);
	const userId = Number(query.userId);
	const page = Number(query.page);
	return {
		status: status as VacationStatus | undefined,
		userId: Number.isInteger(userId) && userId > 0 ? userId : undefined,
		page: Number.isInteger(page) && page > 0 ? page : 1,
	};
};

const filters = computed(() => readFilters(route.query));

/** Changing any filter goes back to page 1 unless a page is given. Empty values are left out of the URL. */
const setFilters = (patch: Partial<{ status: VacationStatus; userId: number; page: number }>) => {
	const next = { ...filters.value, page: 1, ...patch };

	const query: Record<string, string> = {};
	if (next.status) query.status = next.status;
	if (next.userId) query.userId = String(next.userId);
	if (next.page > 1) query.page = String(next.page);

	void router.replace({ query });
};

const statusFilter = computed({
	get: () => filters.value.status,
	set: (status) => setFilters({ status }),
});

const userFilter = computed({
	get: () => filters.value.userId ?? "",
	set: (userId) => setFilters({ userId: userId === "" ? undefined : Number(userId) }),
});

// --- Requests ---------------------------------------------------------------
const list = usePaginatedList((page) =>
	vacationRequestsApi.listAll({ page, status: filters.value.status, userId: filters.value.userId })
);

watch(filters, (current) => list.load(current.page), { immediate: true });

const requesters = shallowRef<User[]>([]);
onMounted(async () => {
	try {
		requesters.value = await usersApi.list("Requester");
	} catch {
		// The user filter just stays empty; the list itself still works.
	}
});

// --- Approve / reject / change a decision -------------------------------------
const selected = ref<VacationRequest | null>(null);
const decision = ref<Decision | null>(null);
/** True when correcting an earlier decision rather than deciding a pending request. */
const revising = ref(false);
const deciding = ref(false);
const decisionError = ref<string | null>(null);
const notice = ref<string | null>(null);

/** Same rule as the API: a decision can be corrected until the vacation starts. */
const canChangeDecision = (request: VacationRequest) => request.status !== "Pending" && request.startDate >= todayIso();

const openDecision = (request: VacationRequest, choice: Decision) => {
	selected.value = request;
	decision.value = choice;
	revising.value = request.status !== "Pending";
	decisionError.value = null;
};

/** The only possible correction is the opposite decision. */
const openChangeDecision = (request: VacationRequest) =>
	openDecision(request, request.status === "Approved" ? "reject" : "approve");

const closeDecision = () => {
	selected.value = null;
	decision.value = null;
};

const confirmDecision = async (comment: string | null) => {
	if (!selected.value || !decision.value) return;
	deciding.value = true;
	decisionError.value = null;
	try {
		const request = selected.value;
		const status = decision.value === "approve" ? "Approved" : "Rejected";
		const updated = revising.value
			? await vacationRequestsApi.changeDecision(request.id, status, comment)
			: status === "Approved"
				? await vacationRequestsApi.approve(request.id, comment)
				: await vacationRequestsApi.reject(request.id, comment ?? "");
		const owner = request.user?.name ?? "The";
		notice.value = revising.value
			? `${owner}'s request was changed to ${updated.status.toLowerCase()}.`
			: `${owner}'s request was ${updated.status.toLowerCase()}.`;
		closeDecision();
		await list.load();
	} catch (err) {
		decisionError.value = getErrorMessage(err);
	} finally {
		deciding.value = false;
	}
};
</script>

<template>
	<div class="space-y-6">
		<header>
			<h1 class="text-2xl font-semibold text-slate-900">Vacation requests</h1>
			<p class="mt-1 text-sm text-slate-500">
				Review your team's requests. Pending requests can be approved or rejected; a decision made by mistake can be
				edited until the vacation starts.
			</p>
		</header>

		<AlertBanner v-if="notice" variant="success" dismissible @dismiss="notice = null">{{ notice }}</AlertBanner>

		<section class="card" aria-label="Requests">
			<div class="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 px-6 py-4">
				<StatusTabs v-model="statusFilter" />
				<label class="flex items-center gap-2 text-sm text-slate-600">
					Employee
					<select v-model="userFilter" class="form-control w-48">
						<option value="">Everyone</option>
						<option v-for="user in requesters" :key="user.id" :value="user.id">{{ user.name }}</option>
					</select>
				</label>
			</div>

			<AlertBanner v-if="list.error.value" variant="error" class="m-4">{{ list.error.value }}</AlertBanner>

			<VacationRequestTable
				:requests="list.items.value"
				:loading="list.loading.value"
				show-employee
				empty-text="No requests match these filters."
			>
				<template #actions="{ request }">
					<div v-if="request.status === 'Pending'" class="flex justify-end gap-2">
						<BaseButton variant="success" size="sm" @click="openDecision(request, 'approve')">Approve</BaseButton>
						<BaseButton variant="danger" size="sm" @click="openDecision(request, 'reject')">Reject</BaseButton>
					</div>
					<BaseButton
						v-else-if="canChangeDecision(request)"
						variant="secondary"
						size="sm"
						@click="openChangeDecision(request)"
					>
						Edit decision
					</BaseButton>
				</template>
			</VacationRequestTable>

			<div class="border-t border-slate-200 px-6 py-3">
				<PaginationBar
					:page="list.page.value"
					:page-size="list.pageSize.value"
					:total="list.total.value"
					:total-pages="list.totalPages.value"
					@update:page="(page) => setFilters({ page })"
				/>
			</div>
		</section>

		<DecisionDialog
			:request="selected"
			:decision="decision"
			:revising="revising"
			:submitting="deciding"
			:error="decisionError"
			@confirm="confirmDecision"
			@close="closeDecision"
		/>
	</div>
</template>
