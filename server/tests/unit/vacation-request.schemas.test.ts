import { describe, expect, it } from "vitest";
import { ValidationError } from "../../src/core/errors";
import { validate } from "../../src/core/http/request";
import {
	allRequestsQuerySchema,
	changeDecisionBodySchema,
	rejectBodySchema,
	teamVacationsQuerySchema,
	vacationRequestBodySchema,
} from "../../src/modules/vacation-requests/vacation-request.schemas";

describe("vacationRequestBodySchema", () => {
	it("accepts valid dates and normalises an empty reason to null", () => {
		expect(validate(vacationRequestBodySchema, { startDate: "2026-11-01", endDate: "2026-11-03", reason: "  " })).toEqual({
			startDate: "2026-11-01",
			endDate: "2026-11-03",
			reason: null,
		});
	});

	it.each(["2026-02-30", "01/11/2026", "2026-11-1", ""])("rejects the date %j", (startDate) => {
		expect(() => validate(vacationRequestBodySchema, { startDate, endDate: "2026-11-03" })).toThrow(ValidationError);
	});

	it("requires both dates", () => {
		expect(() => validate(vacationRequestBodySchema, { startDate: "2026-11-01" })).toThrow("endDate:");
	});
});

describe("rejectBodySchema", () => {
	it.each([{}, { comment: "" }, { comment: "   " }])("requires a comment: %j", (body) => {
		expect(() => validate(rejectBodySchema, body)).toThrow("A comment is required when rejecting a request");
	});
});

describe("allRequestsQuerySchema", () => {
	it("applies pagination defaults and coerces query strings", () => {
		expect(validate(allRequestsQuerySchema, { userId: "3" })).toEqual({ userId: 3, page: 1, pageSize: 10 });
	});

	it("rejects an unknown status and an oversized page", () => {
		expect(() => validate(allRequestsQuerySchema, { status: "Cancelled" })).toThrow(ValidationError);
		expect(() => validate(allRequestsQuerySchema, { pageSize: "1000" })).toThrow(ValidationError);
	});
});

describe("teamVacationsQuerySchema", () => {
	it("accepts a month", () => {
		expect(() => validate(teamVacationsQuerySchema, { from: "2026-11-01", to: "2026-11-30" })).not.toThrow();
	});

	it("rejects an inverted or overly long range", () => {
		expect(() => validate(teamVacationsQuerySchema, { from: "2026-11-30", to: "2026-11-01" })).toThrow(ValidationError);
		expect(() => validate(teamVacationsQuerySchema, { from: "2026-01-01", to: "2026-12-31" })).toThrow(ValidationError);
	});
});

describe("changeDecisionBodySchema", () => {
	it("accepts approving without a comment", () => {
		expect(validate(changeDecisionBodySchema, { status: "Approved" })).toEqual({ status: "Approved", comment: null });
	});

	it("requires a comment when changing to rejected", () => {
		expect(() => validate(changeDecisionBodySchema, { status: "Rejected", comment: " " })).toThrow(
			"A comment is required when rejecting a request"
		);
	});

	it("only accepts a final decision", () => {
		expect(() => validate(changeDecisionBodySchema, { status: "Pending" })).toThrow(ValidationError);
	});
});
