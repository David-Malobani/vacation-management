import { Command, CommandHandler } from "../../../core/commands/command-bus";
import { Transactional } from "../../../core/commands/transactional";
import { BusinessRuleError } from "../../../core/errors";
import { VacationRequestUpdatedEvent } from "../events/vacation-request.events";
import { toVacationRequestDto, VacationRequestDto } from "../vacation-request.entity";
import { OVERLAP_MESSAGE, vacationRequestRepository } from "../vacation-request.repository";
import { assertModifiable, assertOwnedBy, assertValidDateRange } from "../vacation-request.rules";

export class UpdateVacationRequestCommand implements Command<VacationRequestDto> {
	static readonly TYPE = "UpdateVacationRequest";
	readonly type = UpdateVacationRequestCommand.TYPE;

	constructor(
		public readonly requestId: number,
		public readonly requesterId: number,
		public readonly startDate: string,
		public readonly endDate: string,
		public readonly reason: string | null
	) {}
}

export class UpdateVacationRequestHandler
	implements CommandHandler<UpdateVacationRequestCommand, VacationRequestDto>
{
	constructor(private readonly transactional: Transactional) {}

	async execute(command: UpdateVacationRequestCommand): Promise<VacationRequestDto> {
		return this.transactional.run(async ({ manager, record }) => {
			const request = await vacationRequestRepository.findByIdForUpdate(manager, command.requestId);
			assertOwnedBy(request.userId, command.requesterId);
			assertModifiable(request.status);
			assertValidDateRange(command.startDate, command.endDate);

			const hasOverlap = await vacationRequestRepository.hasOverlap(
				manager,
				request.userId,
				command.startDate,
				command.endDate,
				request.id
			);
			if (hasOverlap) {
				throw new BusinessRuleError(OVERLAP_MESSAGE);
			}

			request.startDate = command.startDate;
			request.endDate = command.endDate;
			request.reason = command.reason;
			const dto = toVacationRequestDto(await vacationRequestRepository.save(manager, request));

			record(new VacationRequestUpdatedEvent(dto));
			return dto;
		});
	}
}
