import { Command, CommandHandler } from "../../../core/commands/command-bus";
import { Transactional } from "../../../core/commands/transactional";
import { BusinessRuleError } from "../../../core/errors";
import { VacationRequestCreatedEvent } from "../events/vacation-request.events";
import { toVacationRequestDto, VacationRequest, VacationRequestDto, VacationStatus } from "../vacation-request.entity";
import { OVERLAP_MESSAGE, vacationRequestRepository } from "../vacation-request.repository";
import { assertValidDateRange } from "../vacation-request.rules";

export class CreateVacationRequestCommand implements Command<VacationRequestDto> {
	declare readonly __result?: VacationRequestDto;
	static readonly TYPE = "CreateVacationRequest";
	readonly type = CreateVacationRequestCommand.TYPE;

	constructor(
		public readonly requesterId: number,
		public readonly startDate: string,
		public readonly endDate: string,
		public readonly reason: string | null
	) {}
}

export class CreateVacationRequestHandler
	implements CommandHandler<CreateVacationRequestCommand, VacationRequestDto>
{
	constructor(private readonly transactional: Transactional) {}

	async execute(command: CreateVacationRequestCommand): Promise<VacationRequestDto> {
		assertValidDateRange(command.startDate, command.endDate);

		return this.transactional.run(async ({ manager, record }) => {
			const hasOverlap = await vacationRequestRepository.hasOverlap(
				manager,
				command.requesterId,
				command.startDate,
				command.endDate
			);
			if (hasOverlap) {
				throw new BusinessRuleError(OVERLAP_MESSAGE);
			}

			const request = manager.create(VacationRequest, {
				userId: command.requesterId,
				startDate: command.startDate,
				endDate: command.endDate,
				reason: command.reason,
				status: VacationStatus.Pending,
				comments: null,
			});
			const dto = toVacationRequestDto(await vacationRequestRepository.save(manager, request));

			record(new VacationRequestCreatedEvent(dto));
			return dto;
		});
	}
}
