import { Response } from "commoneventframework";
import { z } from "zod";
import { HandlerFn, InputParserFn } from "../../core/http/handler.types";
import { readIdParam, readJsonBody, readQuery, validate } from "../../core/http/request";
import { container } from "../../container";
import { getDataSource } from "../../database/data-source";
import { ApproveVacationRequestCommand } from "./commands/approve-vacation-request.command";
import { CancelVacationRequestCommand } from "./commands/cancel-vacation-request.command";
import { ChangeVacationRequestDecisionCommand } from "./commands/change-vacation-request-decision.command";
import { CreateVacationRequestCommand } from "./commands/create-vacation-request.command";
import { RejectVacationRequestCommand } from "./commands/reject-vacation-request.command";
import { UpdateVacationRequestCommand } from "./commands/update-vacation-request.command";
import { listTeamVacations, listVacationRequests, VacationRequestFilter } from "./queries/vacation-request.queries";
import {
	allRequestsQuerySchema,
	approveBodySchema,
	changeDecisionBodySchema,
	myRequestsQuerySchema,
	rejectBodySchema,
	teamVacationsQuerySchema,
	vacationRequestBodySchema,
} from "./vacation-request.schemas";

/**
 * HTTP adapters for the vacation-requests module. Write routes follow one
 * pattern: the parser validates input and builds a command, the handler
 * dispatches it. Role checks already happened in the entry point (x-roles).
 */
const { commandBus } = container;

// --- Commands --------------------------------------------------------------

/** POST /vacation-requests */
export const parseCreateVacationRequest: InputParserFn<CreateVacationRequestCommand> = (event, auth) => {
	const body = validate(vacationRequestBodySchema, readJsonBody(event));
	return new CreateVacationRequestCommand(auth.user.id, body.startDate, body.endDate, body.reason);
};

export const createVacationRequest: HandlerFn<CreateVacationRequestCommand> = async (command) =>
	new Response(201, await commandBus.dispatch(command));

/** PUT /vacation-requests/:id */
export const parseUpdateVacationRequest: InputParserFn<UpdateVacationRequestCommand> = (event, auth) => {
	const body = validate(vacationRequestBodySchema, readJsonBody(event));
	return new UpdateVacationRequestCommand(readIdParam(event), auth.user.id, body.startDate, body.endDate, body.reason);
};

export const updateVacationRequest: HandlerFn<UpdateVacationRequestCommand> = async (command) =>
	commandBus.dispatch(command);

/** DELETE /vacation-requests/:id */
export const parseCancelVacationRequest: InputParserFn<CancelVacationRequestCommand> = (event, auth) =>
	new CancelVacationRequestCommand(readIdParam(event), auth.user.id);

export const cancelVacationRequest: HandlerFn<CancelVacationRequestCommand> = async (command) => {
	await commandBus.dispatch(command);
	return new Response(204, {});
};

/** POST /vacation-requests/:id/approve */
export const parseApproveVacationRequest: InputParserFn<ApproveVacationRequestCommand> = (event, auth) => {
	const { comment } = validate(approveBodySchema, readJsonBody(event));
	return new ApproveVacationRequestCommand(readIdParam(event), auth.user.id, comment);
};

export const approveVacationRequest: HandlerFn<ApproveVacationRequestCommand> = async (command) =>
	commandBus.dispatch(command);

/** POST /vacation-requests/:id/reject */
export const parseRejectVacationRequest: InputParserFn<RejectVacationRequestCommand> = (event, auth) => {
	const { comment } = validate(rejectBodySchema, readJsonBody(event));
	return new RejectVacationRequestCommand(readIdParam(event), auth.user.id, comment);
};

export const rejectVacationRequest: HandlerFn<RejectVacationRequestCommand> = async (command) =>
	commandBus.dispatch(command);

/** PUT /vacation-requests/:id/decision */
export const parseChangeDecision: InputParserFn<ChangeVacationRequestDecisionCommand> = (event, auth) => {
	const { status, comment } = validate(changeDecisionBodySchema, readJsonBody(event));
	return new ChangeVacationRequestDecisionCommand(readIdParam(event), auth.user.id, status, comment);
};

export const changeDecision: HandlerFn<ChangeVacationRequestDecisionCommand> = async (command) =>
	commandBus.dispatch(command);

// --- Queries ---------------------------------------------------------------

/** GET /me/vacation-requests: the filter is always scoped to the caller. */
export const parseMyVacationRequests: InputParserFn<VacationRequestFilter> = (event, auth) => ({
	...validate(myRequestsQuerySchema, readQuery(event)),
	userId: auth.user.id,
});

/** GET /vacation-requests (validators) */
export const parseAllVacationRequests: InputParserFn<VacationRequestFilter> = (event) =>
	validate(allRequestsQuerySchema, readQuery(event));

export const listRequests: HandlerFn<VacationRequestFilter> = async (filter) =>
	listVacationRequests(await getDataSource(), filter);

type TeamVacationsQuery = z.infer<typeof teamVacationsQuerySchema>;

/** GET /team/vacations?from=&to= */
export const parseTeamVacations: InputParserFn<TeamVacationsQuery> = (event) =>
	validate(teamVacationsQuerySchema, readQuery(event));

export const teamVacations: HandlerFn<TeamVacationsQuery> = async ({ from, to }) => ({
	from,
	to,
	items: await listTeamVacations(await getDataSource(), from, to),
});
