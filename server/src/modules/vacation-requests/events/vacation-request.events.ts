import { DomainEvent } from "../../../core/events/event-bus";
import { VacationRequestDto, VacationStatus } from "../vacation-request.entity";

/** Facts emitted by the vacation-requests module after a command succeeds. */
abstract class VacationRequestEvent implements DomainEvent {
	abstract readonly type: string;
	readonly occurredAt = new Date();

	constructor(public readonly request: VacationRequestDto) {}
}

export class VacationRequestCreatedEvent extends VacationRequestEvent {
	static readonly TYPE = "VacationRequestCreated";
	readonly type = VacationRequestCreatedEvent.TYPE;
}

export class VacationRequestUpdatedEvent extends VacationRequestEvent {
	static readonly TYPE = "VacationRequestUpdated";
	readonly type = VacationRequestUpdatedEvent.TYPE;
}

export class VacationRequestCancelledEvent extends VacationRequestEvent {
	static readonly TYPE = "VacationRequestCancelled";
	readonly type = VacationRequestCancelledEvent.TYPE;
}

export class VacationRequestApprovedEvent extends VacationRequestEvent {
	static readonly TYPE = "VacationRequestApproved";
	readonly type = VacationRequestApprovedEvent.TYPE;

	constructor(
		request: VacationRequestDto,
		public readonly validatorId: number
	) {
		super(request);
	}
}

/** A validator corrected an earlier decision (approved ↔ rejected). */
export class VacationRequestDecisionChangedEvent extends VacationRequestEvent {
	static readonly TYPE = "VacationRequestDecisionChanged";
	readonly type = VacationRequestDecisionChangedEvent.TYPE;

	constructor(
		request: VacationRequestDto,
		public readonly validatorId: number,
		public readonly previousStatus: VacationStatus
	) {
		super(request);
	}
}

export class VacationRequestRejectedEvent extends VacationRequestEvent {
	static readonly TYPE = "VacationRequestRejected";
	readonly type = VacationRequestRejectedEvent.TYPE;

	constructor(
		request: VacationRequestDto,
		public readonly validatorId: number
	) {
		super(request);
	}
}
