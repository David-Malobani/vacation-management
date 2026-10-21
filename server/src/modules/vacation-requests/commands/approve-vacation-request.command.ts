import { Command, CommandHandler } from "../../../core/commands/command-bus";
import { Transactional } from "../../../core/commands/transactional";
import { VacationRequestApprovedEvent } from "../events/vacation-request.events";
import { toVacationRequestDto, VacationRequestDto, VacationStatus } from "../vacation-request.entity";
import { vacationRequestRepository } from "../vacation-request.repository";
import { assertDecidable } from "../vacation-request.rules";

export class ApproveVacationRequestCommand implements Command<VacationRequestDto> {
	static readonly TYPE = "ApproveVacationRequest";
	readonly type = ApproveVacationRequestCommand.TYPE;

	constructor(
		public readonly requestId: number,
		public readonly validatorId: number,
		/** Optional note for the requester. */
		public readonly comment: string | null
	) {}
}

export class ApproveVacationRequestHandler
	implements CommandHandler<ApproveVacationRequestCommand, VacationRequestDto>
{
	constructor(private readonly transactional: Transactional) {}

	async execute(command: ApproveVacationRequestCommand): Promise<VacationRequestDto> {
		return this.transactional.run(async ({ manager, record }) => {
			const request = await vacationRequestRepository.findByIdForUpdate(manager, command.requestId);
			assertDecidable(request.status);

			request.status = VacationStatus.Approved;
			request.comments = command.comment?.trim() || null;
			const dto = toVacationRequestDto(await vacationRequestRepository.save(manager, request));

			record(new VacationRequestApprovedEvent(dto, command.validatorId));
			return dto;
		});
	}
}
