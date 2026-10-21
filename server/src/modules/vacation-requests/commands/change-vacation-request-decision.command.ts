import { Command, CommandHandler } from "../../../core/commands/command-bus";
import { Transactional } from "../../../core/commands/transactional";
import { BusinessRuleError } from "../../../core/errors";
import { VacationRequestDecisionChangedEvent } from "../events/vacation-request.events";
import { toVacationRequestDto, VacationRequestDto, VacationStatus } from "../vacation-request.entity";
import { OVERLAP_MESSAGE, vacationRequestRepository } from "../vacation-request.repository";
import { assertDecisionChangeable, assertRejectionComment } from "../vacation-request.rules";

export type Decision = VacationStatus.Approved | VacationStatus.Rejected;

/** A validator corrects a decision made by mistake (approved ↔ rejected). */
export class ChangeVacationRequestDecisionCommand implements Command<VacationRequestDto> {
	declare readonly __result?: VacationRequestDto;
	static readonly TYPE = "ChangeVacationRequestDecision";
	readonly type = ChangeVacationRequestDecisionCommand.TYPE;

	constructor(
		public readonly requestId: number,
		public readonly validatorId: number,
		public readonly status: Decision,
		/** Required when the new decision is a rejection (rule 5). */
		public readonly comment: string | null
	) {}
}

export class ChangeVacationRequestDecisionHandler
	implements CommandHandler<ChangeVacationRequestDecisionCommand, VacationRequestDto>
{
	constructor(private readonly transactional: Transactional) {}

	async execute(command: ChangeVacationRequestDecisionCommand): Promise<VacationRequestDto> {
		const comment =
			command.status === VacationStatus.Rejected
				? assertRejectionComment(command.comment)
				: command.comment?.trim() || null;

		return this.transactional.run(async ({ manager, record }) => {
			const request = await vacationRequestRepository.findByIdForUpdate(manager, command.requestId);
			const previousStatus = request.status;
			assertDecisionChangeable(previousStatus, command.status, request.startDate);

			// A rejected request is not counted for overlaps; approving it brings it back.
			if (command.status === VacationStatus.Approved) {
				const hasOverlap = await vacationRequestRepository.hasOverlap(
					manager,
					request.userId,
					request.startDate,
					request.endDate,
					request.id
				);
				if (hasOverlap) {
					throw new BusinessRuleError(OVERLAP_MESSAGE);
				}
			}

			request.status = command.status;
			request.comments = comment;
			const dto = toVacationRequestDto(await vacationRequestRepository.save(manager, request));

			record(new VacationRequestDecisionChangedEvent(dto, command.validatorId, previousStatus));
			return dto;
		});
	}
}
