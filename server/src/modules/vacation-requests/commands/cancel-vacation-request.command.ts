import { Command, CommandHandler } from "../../../core/commands/command-bus";
import { Transactional } from "../../../core/commands/transactional";
import { VacationRequestCancelledEvent } from "../events/vacation-request.events";
import { toVacationRequestDto } from "../vacation-request.entity";
import { vacationRequestRepository } from "../vacation-request.repository";
import { assertModifiable, assertOwnedBy } from "../vacation-request.rules";

/** A requester withdraws one of their pending requests (the row is deleted). */
export class CancelVacationRequestCommand implements Command<void> {
	static readonly TYPE = "CancelVacationRequest";
	readonly type = CancelVacationRequestCommand.TYPE;

	constructor(
		public readonly requestId: number,
		public readonly requesterId: number
	) {}
}

export class CancelVacationRequestHandler implements CommandHandler<CancelVacationRequestCommand, void> {
	constructor(private readonly transactional: Transactional) {}

	async execute(command: CancelVacationRequestCommand): Promise<void> {
		await this.transactional.run(async ({ manager, record }) => {
			const request = await vacationRequestRepository.findByIdForUpdate(manager, command.requestId);
			assertOwnedBy(request.userId, command.requesterId);
			assertModifiable(request.status);

			// Snapshot before removal: TypeORM clears the id on the removed entity.
			const dto = toVacationRequestDto(request);
			await vacationRequestRepository.remove(manager, request);

			record(new VacationRequestCancelledEvent(dto));
		});
	}
}
