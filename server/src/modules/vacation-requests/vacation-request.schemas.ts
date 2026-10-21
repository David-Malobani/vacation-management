import { z } from "zod";
import { idSchema } from "../../core/http/request";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../core/pagination";
import { VacationStatus } from "./vacation-request.entity";

/**
 * Shape validation for HTTP input. Business rules (end after start, no past
 * dates, overlap...) live in vacation-request.rules.ts and the command handlers.
 */

const isoDate = z.iso.date({ error: "must be a valid date (YYYY-MM-DD)" });

const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `must be at most ${max} characters`)
		.nullish()
		.transform((value) => value || null);

export const vacationRequestBodySchema = z.object({
	startDate: isoDate,
	endDate: isoDate,
	reason: optionalText(500),
});

export const approveBodySchema = z.object({
	comment: optionalText(1000),
});

const REJECTION_COMMENT_REQUIRED = "A comment is required when rejecting a request";

export const rejectBodySchema = z.object({
	comment: z
		.string({ error: REJECTION_COMMENT_REQUIRED })
		.trim()
		.min(1, REJECTION_COMMENT_REQUIRED)
		.max(1000, "must be at most 1000 characters"),
});

export const changeDecisionBodySchema = z
	.object({
		status: z.enum([VacationStatus.Approved, VacationStatus.Rejected], {
			error: "must be Approved or Rejected",
		}),
		comment: optionalText(1000),
	})
	.refine(({ status, comment }) => status !== VacationStatus.Rejected || comment, {
		message: REJECTION_COMMENT_REQUIRED,
		path: ["comment"],
	});

const pagination = {
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
};

export const myRequestsQuerySchema = z.object({
	status: z.enum(VacationStatus).optional(),
	...pagination,
});

export const allRequestsQuerySchema = myRequestsQuerySchema.extend({
	userId: idSchema.optional(),
});

/** Keeps the calendar query bounded: at most ~3 months per call. */
export const MAX_CALENDAR_RANGE_DAYS = 93;

const daysBetween = (from: string, to: string): number =>
	(Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;

export const teamVacationsQuerySchema = z
	.object({ from: isoDate, to: isoDate })
	.refine(({ from, to }) => to >= from, { message: "must not be before from", path: ["to"] })
	.refine(({ from, to }) => daysBetween(from, to) <= MAX_CALENDAR_RANGE_DAYS, {
		message: `range must not exceed ${MAX_CALENDAR_RANGE_DAYS} days`,
		path: ["to"],
	});
