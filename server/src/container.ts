import { CommandBus } from "./core/commands/command-bus";
import { Transactional } from "./core/commands/transactional";
import { EventBus } from "./core/events/event-bus";
import { getDataSource } from "./database/data-source";
import {
	ApproveVacationRequestCommand,
	ApproveVacationRequestHandler,
} from "./modules/vacation-requests/commands/approve-vacation-request.command";
import {
	CancelVacationRequestCommand,
	CancelVacationRequestHandler,
} from "./modules/vacation-requests/commands/cancel-vacation-request.command";
import {
	ChangeVacationRequestDecisionCommand,
	ChangeVacationRequestDecisionHandler,
} from "./modules/vacation-requests/commands/change-vacation-request-decision.command";
import {
	CreateVacationRequestCommand,
	CreateVacationRequestHandler,
} from "./modules/vacation-requests/commands/create-vacation-request.command";
import {
	RejectVacationRequestCommand,
	RejectVacationRequestHandler,
} from "./modules/vacation-requests/commands/reject-vacation-request.command";
import {
	UpdateVacationRequestCommand,
	UpdateVacationRequestHandler,
} from "./modules/vacation-requests/commands/update-vacation-request.command";
import { registerVacationRequestLogListener } from "./modules/vacation-requests/listeners/log-vacation-request-events.listener";

/**
 * Composition root: the single place where buses, command handlers and event
 * listeners are wired together. HTTP handlers only see the command bus.
 */
const eventBus = new EventBus();
const commandBus = new CommandBus();
const transactional = new Transactional(getDataSource, eventBus);

commandBus.register(CreateVacationRequestCommand.TYPE, new CreateVacationRequestHandler(transactional));
commandBus.register(UpdateVacationRequestCommand.TYPE, new UpdateVacationRequestHandler(transactional));
commandBus.register(CancelVacationRequestCommand.TYPE, new CancelVacationRequestHandler(transactional));
commandBus.register(ApproveVacationRequestCommand.TYPE, new ApproveVacationRequestHandler(transactional));
commandBus.register(RejectVacationRequestCommand.TYPE, new RejectVacationRequestHandler(transactional));
commandBus.register(ChangeVacationRequestDecisionCommand.TYPE, new ChangeVacationRequestDecisionHandler(transactional));

registerVacationRequestLogListener(eventBus);

export const container = { commandBus, eventBus };
