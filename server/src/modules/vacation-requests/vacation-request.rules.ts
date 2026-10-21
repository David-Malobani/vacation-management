import { BusinessRuleError, ForbiddenError, ValidationError } from "../../core/errors";
import { VacationStatus } from "./vacation-request.entity";

/**
 * Pure business rules for vacation requests. No I/O here, so every rule is
 * trivially unit-testable; command handlers compose them with repository checks.
 * Dates are ISO calendar dates (YYYY-MM-DD), which compare correctly as strings.
 */

/** Today's calendar date in the server's local timezone, as YYYY-MM-DD. */
export const todayIso = (now: Date = new Date()): string => {
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/** Rule 1: end date must be after start date. */
export const assertEndAfterStart = (startDate: string, endDate: string): void => {
	if (endDate <= startDate) {
		throw new ValidationError("End date must be after start date");
	}
};

/** Rule 4: requests in the past are not allowed. */
export const assertNotInPast = (startDate: string, today: string = todayIso()): void => {
	if (startDate < today) {
		throw new ValidationError("Vacation requests cannot start in the past");
	}
};

/** Rules 1 + 4 together: the date range a requester may submit. */
export const assertValidDateRange = (startDate: string, endDate: string, today: string = todayIso()): void => {
	assertEndAfterStart(startDate, endDate);
	assertNotInPast(startDate, today);
};

/** Inclusive range overlap: [aStart, aEnd] ∩ [bStart, bEnd] ≠ ∅. */
export const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean =>
	aStart <= bEnd && bStart <= aEnd;

/** Rule 3: approved (and, by extension, any already-decided) requests are immutable. */
export const assertModifiable = (status: VacationStatus): void => {
	if (status === VacationStatus.Approved) {
		throw new BusinessRuleError("Approved requests cannot be modified");
	}
	if (status !== VacationStatus.Pending) {
		throw new BusinessRuleError(`${status} requests cannot be modified`);
	}
};

/** Requesters may only edit or cancel their own requests. */
export const assertOwnedBy = (ownerId: number, actorId: number): void => {
	if (ownerId !== actorId) {
		throw new ForbiddenError("You can only change your own vacation requests");
	}
};

/** Only pending requests can be approved or rejected. */
export const assertDecidable = (status: VacationStatus): void => {
	if (status !== VacationStatus.Pending) {
		throw new BusinessRuleError(`This request has already been ${status.toLowerCase()}`);
	}
};

/**
 * A validator may correct a decision made by mistake (approved ↔ rejected),
 * but only until the vacation starts. Requesters still can never modify an
 * approved request (rule 3).
 */
export const assertDecisionChangeable = (
	current: VacationStatus,
	next: VacationStatus,
	startDate: string,
	today: string = todayIso()
): void => {
	if (current === VacationStatus.Pending) {
		throw new BusinessRuleError("This request has not been decided yet; approve or reject it instead");
	}
	if (current === next) {
		throw new BusinessRuleError(`This request is already ${current.toLowerCase()}`);
	}
	if (startDate < today) {
		throw new BusinessRuleError("This vacation has already started, so its decision can no longer be changed");
	}
};

/** Rule 5: a rejected request must contain a rejection comment. */
export const assertRejectionComment = (comment: string | null | undefined): string => {
	const trimmed = comment?.trim() ?? "";
	if (!trimmed) {
		throw new ValidationError("A comment is required when rejecting a request");
	}
	return trimmed;
};
