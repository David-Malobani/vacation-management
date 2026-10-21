<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { getErrorMessage } from "@/api/http";
import { vacationRequestsApi } from "@/api/vacation-requests.api";
import AlertBanner from "@/components/ui/AlertBanner.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import ModalDialog from "@/components/ui/ModalDialog.vue";
import PaginationBar from "@/components/ui/PaginationBar.vue";
import StatusTabs from "@/components/ui/StatusTabs.vue";
import VacationRequestForm from "@/components/vacation/VacationRequestForm.vue";
import VacationRequestTable from "@/components/vacation/VacationRequestTable.vue";
import { usePaginatedList } from "@/composables/usePaginatedList";
import type { VacationRequest, VacationRequestInput, VacationStatus } from "@/types/api";
import { formatDate } from "@/utils/dates";

// --- My requests ------------------------------------------------------------
const statusFilter = ref<VacationStatus | undefined>();
const list = usePaginatedList((page) => vacationRequestsApi.listMine({ page, status: statusFilter.value }));

onMounted(() => list.load(1));
watch(statusFilter, () => list.load(1));

const notice = ref<string | null>(null);

// --- Create / edit form -----------------------------------------------------
const form = ref<InstanceType<typeof VacationRequestForm> | null>(null);
const editing = ref<VacationRequest | null>(null);
const submitting = ref(false);
const formError = ref<string | null>(null);

const submit = async (input: VacationRequestInput) => {
	submitting.value = true;
	formError.value = null;
	notice.value = null;
	try {
		if (editing.value) {
			await vacationRequestsApi.update(editing.value.id, input);
			editing.value = null;
			notice.value = "Your request was updated.";
			await list.load();
		} else {
			await vacationRequestsApi.create(input);
			form.value?.reset();
			notice.value = "Request submitted. It is now waiting for a validator.";
			await list.load(1);
		}
	} catch (err) {
		formError.value = getErrorMessage(err);
	} finally {
		submitting.value = false;
	}
};

const startEditing = (request: VacationRequest) => {
	editing.value = request;
	formError.value = null;
	notice.value = null;
	window.scrollTo({ top: 0, behavior: "smooth" });
};

const stopEditing = () => {
	editing.value = null;
	formError.value = null;
};

// --- Cancel -----------------------------------------------------------------
const cancelling = ref<VacationRequest | null>(null);
const cancelBusy = ref(false);
const cancelError = ref<string | null>(null);

const askCancel = (request: VacationRequest) => {
	cancelling.value = request;
	cancelError.value = null;
};

const confirmCancel = async () => {
	if (!cancelling.value) return;
	cancelBusy.value = true;
	try {
		await vacationRequestsApi.cancel(cancelling.value.id);
		if (editing.value?.id === cancelling.value.id) stopEditing();
		cancelling.value = null;
		notice.value = "Your request was cancelled.";
		await list.load();
	} catch (err) {
		cancelError.value = getErrorMessage(err);
	} finally {
		cancelBusy.value = false;
	}
};
</script>

<template>
	<div class="space-y-6">
		<header>
			<h1 class="text-2xl font-semibold text-slate-900">My vacation requests</h1>
			<p class="mt-1 text-sm text-slate-500">
				Submit a request and follow its status. Only pending requests can be changed.
			</p>
		</header>

		<AlertBanner v-if="notice" variant="success" dismissible @dismiss="notice = null">{{ notice }}</AlertBanner>

		<section class="card p-6" :class="{ 'ring-2 ring-indigo-500': editing }" aria-labelledby="form-title">
			<h2 id="form-title" class="mb-4 text-lg font-semibold text-slate-900">
				{{ editing ? `Edit request #${editing.id}` : "New vacation request" }}
			</h2>
			<AlertBanner v-if="formError" variant="error" class="mb-4">{{ formError }}</AlertBanner>
			<VacationRequestForm
				ref="form"
				:editing="editing"
				:submitting="submitting"
				@submit="submit"
				@cancel="stopEditing"
			/>
		</section>

		<section class="card" aria-labelledby="list-title">
			<div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
				<h2 id="list-title" class="text-lg font-semibold text-slate-900">Submitted requests</h2>
				<StatusTabs v-model="statusFilter" />
			</div>

			<AlertBanner v-if="list.error.value" variant="error" class="m-4">{{ list.error.value }}</AlertBanner>

			<VacationRequestTable
				:requests="list.items.value"
				:loading="list.loading.value"
				:empty-text="
					statusFilter ? `No ${statusFilter.toLowerCase()} requests.` : 'You have not submitted any requests yet.'
				"
			>
				<template #actions="{ request }">
					<div v-if="request.status === 'Pending'" class="flex justify-end gap-1">
						<BaseButton variant="ghost" size="sm" @click="startEditing(request)">Edit</BaseButton>
						<BaseButton variant="ghost" size="sm" class="!text-red-600" @click="askCancel(request)">Cancel</BaseButton>
					</div>
				</template>
			</VacationRequestTable>

			<div class="border-t border-slate-200 px-6 py-3">
				<PaginationBar
					:page="list.page.value"
					:page-size="list.pageSize.value"
					:total="list.total.value"
					:total-pages="list.totalPages.value"
					@update:page="list.load"
				/>
			</div>
		</section>

		<ModalDialog :open="Boolean(cancelling)" title="Cancel this request?" @close="cancelling = null">
			<p v-if="cancelling">
				Your vacation from {{ formatDate(cancelling.startDate) }} to {{ formatDate(cancelling.endDate) }} will be
				withdrawn. This cannot be undone.
			</p>
			<AlertBanner v-if="cancelError" variant="error" class="mt-3">{{ cancelError }}</AlertBanner>
			<template #footer>
				<BaseButton variant="secondary" @click="cancelling = null">Keep it</BaseButton>
				<BaseButton variant="danger" :loading="cancelBusy" @click="confirmCancel">Cancel request</BaseButton>
			</template>
		</ModalDialog>
	</div>
</template>
