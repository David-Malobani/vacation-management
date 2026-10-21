import { describe, expect, it } from "vitest";
import { BusinessRuleError, ForbiddenError, ValidationError } from "../../src/core/errors";
import { VacationStatus } from "../../src/modules/vacation-requests/vacation-request.entity";
import {
	assertDecidable,
	assertDecisionChangeable,
	assertEndAfterStart,
	assertModifiable,
	assertNotInPast,
	assertOwnedBy,
	assertRejectionComment,
	assertValidDateRange,
	rangesOverlap,
	todayIso,
} from "../../src/modules/vacation-requests/vacation-request.rules";

const TODAY = "2026-10-21";

describe("todayIso", () => {
	it("formats a local date as YYYY-MM-DD with zero padding", () => {
		expect(todayIso(new Date(2026, 0, 5))).toBe("2026-01-05");
	});
});

describe("rule 1: end date after start date", () => {
	it("accepts an end date after the start date", () => {
		expect(() => assertEndAfterStart("2026-11-01", "2026-11-02")).not.toThrow();
	});

	it("rejects an end date equal to the start date", () => {
		expect(() => assertEndAfterStart("2026-11-01", "2026-11-01")).toThrow(ValidationError);
	});

	it("rejects an end date before the start date", () => {
		expect(() => assertEndAfterStart("2026-11-05", "2026-11-01")).toThrow("End date must be after start date");
	});

	it("compares across month and year boundaries", () => {
		expect(() => assertEndAfterStart("2026-12-31", "2027-01-01")).not.toThrow();
		expect(() => assertEndAfterStart("2027-01-01", "2026-12-31")).toThrow(ValidationError);
	});
});

describe("rule 2: overlap detection", () => {
	it.each([
		["identical ranges", "2026-11-01", "2026-11-05", "2026-11-01", "2026-11-05"],
		["partial overlap", "2026-11-01", "2026-11-05", "2026-11-04", "2026-11-10"],
		["one range inside the other", "2026-11-01", "2026-11-30", "2026-11-10", "2026-11-12"],
		["touching on a shared day (inclusive)", "2026-11-01", "2026-11-05", "2026-11-05", "2026-11-08"],
	])("detects %s", (_label, aStart, aEnd, bStart, bEnd) => {
		expect(rangesOverlap(aStart, aEnd, bStart, bEnd)).toBe(true);
		expect(rangesOverlap(bStart, bEnd, aStart, aEnd)).toBe(true);
	});

	it("does not flag consecutive ranges", () => {
		expect(rangesOverlap("2026-11-01", "2026-11-05", "2026-11-06", "2026-11-08")).toBe(false);
	});
});

describe("rule 3: only pending requests are modifiable", () => {
	it("allows pending requests", () => {
		expect(() => assertModifiable(VacationStatus.Pending)).not.toThrow();
	});

	it("refuses approved requests with an explicit message", () => {
		expect(() => assertModifiable(VacationStatus.Approved)).toThrow("Approved requests cannot be modified");
	});

	it("refuses rejected requests", () => {
		expect(() => assertModifiable(VacationStatus.Rejected)).toThrow(BusinessRuleError);
	});
});

describe("rule 4: no requests in the past", () => {
	it("accepts a request starting today", () => {
		expect(() => assertNotInPast(TODAY, TODAY)).not.toThrow();
	});

	it("rejects a request starting yesterday", () => {
		expect(() => assertNotInPast("2026-10-20", TODAY)).toThrow("Vacation requests cannot start in the past");
	});

	it("assertValidDateRange checks both rules", () => {
		expect(() => assertValidDateRange("2026-11-01", "2026-11-03", TODAY)).not.toThrow();
		expect(() => assertValidDateRange("2026-10-01", "2026-11-03", TODAY)).toThrow(ValidationError);
		expect(() => assertValidDateRange("2026-11-03", "2026-11-01", TODAY)).toThrow(ValidationError);
	});
});

describe("rule 5: rejection requires a comment", () => {
	it.each([undefined, null, "", "   \n\t"])("rejects %j", (comment) => {
		expect(() => assertRejectionComment(comment)).toThrow(ValidationError);
	});

	it("returns the trimmed comment", () => {
		expect(assertRejectionComment("  Busy sprint  ")).toBe("Busy sprint");
	});
});

describe("decisions and ownership", () => {
	it("only pending requests can be decided", () => {
		expect(() => assertDecidable(VacationStatus.Pending)).not.toThrow();
		expect(() => assertDecidable(VacationStatus.Approved)).toThrow("already been approved");
		expect(() => assertDecidable(VacationStatus.Rejected)).toThrow("already been rejected");
	});

	it("only the owner may change a request", () => {
		expect(() => assertOwnedBy(1, 1)).not.toThrow();
		expect(() => assertOwnedBy(1, 2)).toThrow(ForbiddenError);
	});
});

describe("changing a decision made by mistake", () => {
	it("allows flipping approved ↔ rejected before the vacation starts", () => {
		expect(() =>
			assertDecisionChangeable(VacationStatus.Approved, VacationStatus.Rejected, "2026-11-01", TODAY)
		).not.toThrow();
		expect(() =>
			assertDecisionChangeable(VacationStatus.Rejected, VacationStatus.Approved, TODAY, TODAY)
		).not.toThrow();
	});

	it("refuses pending requests, which must be approved or rejected instead", () => {
		expect(() =>
			assertDecisionChangeable(VacationStatus.Pending, VacationStatus.Approved, "2026-11-01", TODAY)
		).toThrow("has not been decided yet");
	});

	it("refuses a no-op change", () => {
		expect(() =>
			assertDecisionChangeable(VacationStatus.Approved, VacationStatus.Approved, "2026-11-01", TODAY)
		).toThrow("already approved");
	});

	it("refuses once the vacation has started", () => {
		expect(() =>
			assertDecisionChangeable(VacationStatus.Approved, VacationStatus.Rejected, "2026-10-20", TODAY)
		).toThrow(BusinessRuleError);
	});
});
