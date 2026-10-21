import { Command, CommandHandler } from "../../../core/commands/command-bus";
import { Transactional } from "../../../core/commands/transactional";
import { VacationRequestRejectedEvent } from "../events/vacation-request.events";
import { toVacationRequestDto, VacationRequestDto, VacationStatus } from "../vacation-request.entity";
import { vacationRequestRepository } from "../vacation-request.repository";
import { assertDecidable, assertRejectionComment } from "../vacation-request.rules";

export class RejectVacationRequestCommand implements Command<VacationRequestDto> {
	static readonly TYPE = "RejectVacationRequest";
	readonly type = RejectVacationRequestCommand.TYPE;

	constructor(
		public readonly requestId: number,
		public readonly validatorId: number,
		/** Mandatory explanation for the requester (rule 5). */
		public readonly comment: string
	) {}
}

export class RejectVacationRequestHandler
	implements CommandHandler<RejectVacationRequestCommand, VacationRequestDto>
{
	constructor(private readonly transactional: Transactional) {}

	async execute(command: RejectVacationRequestCommand): Promise<VacationRequestDto> {
		const comment = assertRejectionComment(command.comment);

		return this.transactional.run(async ({ manager, record }) => {
			const request = await vacationRequestRepository.findByIdForUpdate(manager, command.requestId);
			assertDecidable(request.status);

			request.status = VacationStatus.Rejected;
			request.comments = comment;
			const dto = toVacationRequestDto(await vacationRequestRepository.save(manager, request));

			record(new VacationRequestRejectedEvent(dto, command.validatorId));
			return dto;
		});
	}
}
