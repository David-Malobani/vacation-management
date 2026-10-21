<script setup lang="ts">
import { computed, ref, watch } from "vue";
import AlertBanner from "@/components/ui/AlertBanner.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import FormField from "@/components/ui/FormField.vue";
import ModalDialog from "@/components/ui/ModalDialog.vue";
import type { VacationRequest } from "@/types/api";
import { daysInclusive, formatDate } from "@/utils/dates";

export type Decision = "approve" | "reject";

/** Confirms an approval (optional comment) or a rejection (comment required, rule 5). */
const props = defineProps<{
	request: VacationRequest | null;
	decision: Decision | null;
	submitting?: boolean;
	error?: string | null;
}>();

const emit = defineEmits<{ confirm: [comment: string | null]; close: [] }>();

const comment = ref("");
const attempted = ref(false);

const open = computed(() => Boolean(props.request && props.decision));
const isReject = computed(() => props.decision === "reject");

watch(open, (isOpen) => {
	if (isOpen) {
		comment.value = "";
		attempted.value = false;
	}
});

const commentError = computed(() =>
	isReject.value && attempted.value && !comment.value.trim() ? "A comment is required when rejecting a request" : null
);

const confirm = () => {
	attempted.value = true;
	if (commentError.value) return;
	emit("confirm", comment.value.trim() || null);
};
</script>

<template>
	<ModalDialog :open="open" :title="isReject ? 'Reject request' : 'Approve request'" @close="emit('close')">
		<div v-if="request" class="space-y-4">
			<p>
				<span class="font-medium text-slate-900">{{ request.user?.name }}</span>
				· {{ formatDate(request.startDate) }} → {{ formatDate(request.endDate) }}
				({{ daysInclusive(request.startDate, request.endDate) }} days)
			</p>
			<p v-if="request.reason" class="rounded-lg bg-slate-50 p-3 italic">“{{ request.reason }}”</p>

			<FormField
				id="decision-comment"
				:label="isReject ? 'Reason for rejection' : 'Comment'"
				:required="isReject"
				:hint="isReject ? 'Shown to the employee.' : 'Optional, shown to the employee.'"
				:error="commentError"
			>
				<textarea
					id="decision-comment"
					v-model="comment"
					rows="3"
					maxlength="1000"
					class="form-control"
					:aria-invalid="Boolean(commentError)"
				/>
			</FormField>

			<AlertBanner v-if="error" variant="error">{{ error }}</AlertBanner>
		</div>

		<template #footer>
			<BaseButton variant="secondary" @click="emit('close')">Cancel</BaseButton>
			<BaseButton :variant="isReject ? 'danger' : 'success'" :loading="submitting" @click="confirm">
				{{ isReject ? "Reject" : "Approve" }}
			</BaseButton>
		</template>
	</ModalDialog>
</template>
