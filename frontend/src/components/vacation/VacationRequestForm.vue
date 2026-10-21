<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import FormField from "@/components/ui/FormField.vue";
import type { VacationRequest, VacationRequestInput } from "@/types/api";
import { daysInclusive, todayIso } from "@/utils/dates";

/**
 * Create / edit form. The checks mirror the server's business rules so users
 * get instant feedback; the server remains the source of truth (overlaps, etc.).
 */
const props = withDefaults(
	defineProps<{
		/** When set, the form edits this request instead of creating a new one. */
		editing?: VacationRequest | null;
		submitting?: boolean;
	}>(),
	{ editing: null, submitting: false }
);

const emit = defineEmits<{ submit: [input: VacationRequestInput]; cancel: [] }>();

const REASON_MAX = 500;

const form = reactive({ startDate: "", endDate: "", reason: "" });
const submitted = ref(false);

const reset = () => {
	form.startDate = props.editing?.startDate ?? "";
	form.endDate = props.editing?.endDate ?? "";
	form.reason = props.editing?.reason ?? "";
	submitted.value = false;
};

watch(() => props.editing, reset, { immediate: true });
defineExpose({ reset });

const today = todayIso();

const startDateError = (): string | null => {
	if (!form.startDate) return "Start date is required";
	if (form.startDate < today) return "Vacation requests cannot start in the past";
	return null;
};

const endDateError = (): string | null => {
	if (!form.endDate) return "End date is required";
	if (form.startDate && form.endDate <= form.startDate) return "End date must be after start date";
	return null;
};

const reasonError = (): string | null =>
	form.reason.length > REASON_MAX ? `Reason must be at most ${REASON_MAX} characters` : null;

const errors = computed(() => ({
	startDate: startDateError(),
	endDate: endDateError(),
	reason: reasonError(),
}));

const isValid = computed(() => Object.values(errors.value).every((error) => error === null));

/** Errors are shown once a field has a value or the user tried to submit. */
const visibleError = (field: keyof typeof errors.value) =>
	submitted.value || form[field] ? errors.value[field] : null;

const duration = computed(() =>
	isValid.value && form.startDate && form.endDate ? daysInclusive(form.startDate, form.endDate) : null
);

const onSubmit = () => {
	submitted.value = true;
	if (!isValid.value) return;
	emit("submit", { startDate: form.startDate, endDate: form.endDate, reason: form.reason.trim() || null });
};
</script>

<template>
	<form class="space-y-4" novalidate @submit.prevent="onSubmit">
		<div class="grid gap-4 sm:grid-cols-2">
			<FormField id="startDate" label="Start date" required :error="visibleError('startDate')">
				<input
					id="startDate"
					v-model="form.startDate"
					type="date"
					class="form-control"
					:min="today"
					:aria-invalid="Boolean(visibleError('startDate'))"
					aria-describedby="startDate-error"
					required
				/>
			</FormField>
			<FormField id="endDate" label="End date" required :error="visibleError('endDate')">
				<input
					id="endDate"
					v-model="form.endDate"
					type="date"
					class="form-control"
					:min="form.startDate || today"
					:aria-invalid="Boolean(visibleError('endDate'))"
					aria-describedby="endDate-error"
					required
				/>
			</FormField>
		</div>

		<FormField
			id="reason"
			label="Reason"
			:error="visibleError('reason')"
			:hint="`Optional · ${form.reason.length}/${REASON_MAX}`"
		>
			<textarea
				id="reason"
				v-model="form.reason"
				rows="3"
				class="form-control resize-y"
				placeholder="e.g. Family trip"
				:aria-invalid="Boolean(visibleError('reason'))"
			/>
		</FormField>

		<div class="flex flex-wrap items-center justify-between gap-3">
			<p class="text-sm text-slate-500">
				<template v-if="duration">{{ duration }} calendar days</template>
			</p>
			<div class="flex gap-2">
				<BaseButton v-if="editing" variant="secondary" @click="emit('cancel')">Discard</BaseButton>
				<BaseButton type="submit" :loading="submitting">
					{{ editing ? "Save changes" : "Submit request" }}
				</BaseButton>
			</div>
		</div>
	</form>
</template>
