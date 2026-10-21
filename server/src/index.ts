import { loadEnv } from "commoneventframework";

const envReady = loadEnv();

import "reflect-metadata";
import "./generated/HandlerRegistry";

import {
	APIGatewayProxyStructuredResultV2,
	buildCommonEvent,
	Context,
	getRouteConfig,
	resolveHandlerRef,
	Response,
	setLambdaContext,
} from "commoneventframework";
import { CommonEvent, LambdaEvent } from "commoneventframework/dist/types/commonEvent";
import { AppError, NotFoundError } from "./core/errors";
import { authorize } from "./core/http/access-control";
import { HandlerFn, InputParserFn } from "./core/http/handler.types";

const isHttpResult = (value: unknown): value is APIGatewayProxyStructuredResultV2 =>
	typeof value === "object" && value !== null && "statusCode" in value;

/** AppErrors carry their own status; anything else is a bug and stays opaque to the client. */
const toErrorResponse = (error: unknown): Response => {
	if (error instanceof AppError) {
		return new Response(error.statusCode, {
			error: { code: error.code, message: error.message, details: error.details },
		});
	}
	console.error("[http] Unhandled error", error);
	return new Response(500, { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } });
};

/**
 * CEF entry point: the AWS Lambda handler, also served locally by Express (src/server.ts).
 * Pipeline: route lookup → auth + role check (root.yaml) → input parser → handler → response.
 */
export const handler = async (event: LambdaEvent, context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
	await envReady;
	await setLambdaContext(context);
	const commonEvent: CommonEvent = buildCommonEvent(event);

	try {
		const route = getRouteConfig(commonEvent);
		const handlerFn = route?.handler ? (resolveHandlerRef(route.handler) as HandlerFn | undefined) : undefined;
		if (!route || !handlerFn) {
			throw new NotFoundError(`Route ${commonEvent.method} ${commonEvent.path} not found`);
		}

		const auth = authorize(route, commonEvent);

		const parserFn = route.inputParser
			? (resolveHandlerRef(route.inputParser) as InputParserFn<unknown> | undefined)
			: undefined;
		const input = parserFn ? await parserFn(commonEvent, auth) : {};
		if (input instanceof Response) return input;

		const result = await handlerFn(input, commonEvent, auth);
		return isHttpResult(result) ? result : new Response(200, result);
	} catch (error) {
		return toErrorResponse(error);
	}
};
