import cors from "cors";
import express, { NextFunction, Request, Response as ExpressResponse } from "express";
import { Context } from "commoneventframework";
import { CommonEvent } from "commoneventframework/dist/types/commonEvent";
import { env } from "./config/env";
import { handler } from "./index";

/**
 * Local HTTP host. Express owns the transport (body parsing, CORS, logging,
 * URL decoding); routing, auth and business logic stay in CEF: every request
 * is translated into a CommonEvent and passed to the same `handler` that runs
 * on AWS Lambda. So this file is the only thing that differs between local
 * and Lambda.
 */

const firstValue = (value: unknown): string | undefined =>
	Array.isArray(value) ? firstValue(value[0]) : typeof value === "string" ? value : undefined;

const toCommonEvent = (req: Request): CommonEvent => ({
	path: req.path,
	method: req.method,
	body: typeof req.body === "string" && req.body.length > 0 ? req.body : null,
	pathParameters: {}, // filled in by CEF from the matched root.yaml route
	queryStringParameters: Object.fromEntries(Object.entries(req.query).map(([key, value]) => [key, firstValue(value)])),
	headers: Object.fromEntries(
		Object.entries(req.headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(", ") : value])
	),
	version: "commonEvent",
});

/** Minimal stand-in for the Lambda context, which CEF only reads for diagnostics. */
const localContext = {
	functionName: "vacation-management-local",
	awsRequestId: "local",
	getRemainingTimeInMillis: () => Number.MAX_SAFE_INTEGER,
} as unknown as Context;

const logRequests = (req: Request, res: ExpressResponse, next: NextFunction) => {
	const startedAt = Date.now();
	res.on("finish", () =>
		console.info(`[http] ${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - startedAt}ms)`)
	);
	next();
};

export const createServer = () => {
	const app = express();
	app.disable("x-powered-by");
	app.use(logRequests);
	app.use(cors({ origin: env.http.corsOrigin }));
	// Keep the raw body: CEF hands a string body to the input parsers, like API Gateway does.
	app.use(express.text({ type: "*/*", limit: "100kb" }));

	app.use(async (req: Request, res: ExpressResponse) => {
		const result = await handler(toCommonEvent(req), localContext);
		for (const [name, value] of Object.entries(result.headers ?? {})) {
			res.setHeader(name, String(value));
		}
		res.status(result.statusCode ?? 200).send(result.statusCode === 204 ? undefined : result.body);
	});

	return app;
};

if (require.main === module) {
	createServer().listen(env.http.port, () => {
		console.info(`[http] API listening on http://localhost:${env.http.port} (docs: /doc)`);
	});
}
