import { CommonEvent } from "commoneventframework/dist/types/commonEvent";
import { z } from "zod";
import { ValidationError } from "../errors";

/** Validates untrusted input; the first issue becomes the message, all issues go in details. */
export const validate = <T>(schema: z.ZodType<T>, data: unknown): T => {
	const result = schema.safeParse(data);
	if (result.success) {
		return result.data;
	}
	const issues = result.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }));
	const [first] = issues;
	throw new ValidationError(first.field ? `${first.field}: ${first.message}` : first.message, issues);
};

export const readJsonBody = (event: CommonEvent): unknown => {
	const body = event.body as unknown;
	if (body === null || body === undefined || body === "") {
		return {};
	}
	if (typeof body === "object") {
		return body; // direct Lambda invocations may hand over an object
	}
	const raw = event.isBase64Encoded ? Buffer.from(String(body), "base64").toString("utf8") : String(body);
	try {
		return JSON.parse(raw);
	} catch {
		throw new ValidationError("Request body must be valid JSON");
	}
};

/**
 * Query string parameters with empty values dropped (`?status=` means "no filter").
 * Values arrive already URL-decoded from both Express and API Gateway; CEF's
 * own dev server (which doesn't decode) is not used.
 */
export const readQuery = (event: CommonEvent): Record<string, string> => {
	const query: Record<string, string> = {};
	for (const [key, value] of Object.entries(event.queryStringParameters ?? {})) {
		if (value !== undefined && value !== "") {
			query[key] = value;
		}
	}
	return query;
};

/** Largest value of a Postgres `integer` column; bigger ids would make the query itself fail. */
const MAX_DB_INTEGER = 2_147_483_647;
const INVALID_ID = "must be a positive integer";

/** A database id coming from a path or query parameter. */
export const idSchema = z.coerce
	.number({ error: INVALID_ID })
	.int(INVALID_ID)
	.positive(INVALID_ID)
	.max(MAX_DB_INTEGER, INVALID_ID);

export const readIdParam = (event: CommonEvent, name = "id"): number =>
	validate(z.object({ [name]: idSchema }), event.pathParameters ?? {})[name] as number;
