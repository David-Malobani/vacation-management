import { EventBus } from "../../../core/events/event-bus";
import {
	VacationRequestApprovedEvent,
	VacationRequestCancelledEvent,
	VacationRequestCreatedEvent,
	VacationRequestDecisionChangedEvent,
	VacationRequestRejectedEvent,
	VacationRequestUpdatedEvent,
} from "../events/vacation-request.events";

type AnyVacationRequestEvent =
	| VacationRequestCreatedEvent
	| VacationRequestUpdatedEvent
	| VacationRequestCancelledEvent
	| VacationRequestApprovedEvent
	| VacationRequestRejectedEvent
	| VacationRequestDecisionChangedEvent;

/**
 * Audit-style log of every vacation request event. It stands in for real side
 * effects (emails, notifications, SQS) that would subscribe the same way.
 */
export const logVacationRequestEvent = (event: AnyVacationRequestEvent): void => {
	const { request } = event;
	const change = "previousStatus" in event ? ` ${event.previousStatus} → ${request.status}` : "";
	const decidedBy = "validatorId" in event ? ` by validator #${event.validatorId}` : "";
	console.info(
		`[event] ${event.occurredAt.toISOString()} ${event.type} request #${request.id} ` +
			`(user #${request.userId}, ${request.startDate} → ${request.endDate})${change}${decidedBy}`
	);
};

export const registerVacationRequestLogListener = (eventBus: EventBus): void => {
	for (const type of [
		VacationRequestCreatedEvent.TYPE,
		VacationRequestUpdatedEvent.TYPE,
		VacationRequestCancelledEvent.TYPE,
		VacationRequestApprovedEvent.TYPE,
		VacationRequestRejectedEvent.TYPE,
		VacationRequestDecisionChangedEvent.TYPE,
	]) {
		eventBus.subscribe(type, logVacationRequestEvent);
	}
};
