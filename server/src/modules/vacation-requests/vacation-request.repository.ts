import { EntityManager, QueryFailedError } from "typeorm";
import { BusinessRuleError, NotFoundError } from "../../core/errors";
import { VacationRequest, VacationStatus } from "./vacation-request.entity";

/** Postgres error code raised by the no-overlap EXCLUDE constraint. */
const EXCLUSION_VIOLATION = "23P01";

export const OVERLAP_MESSAGE = "This vacation overlaps with another pending or approved request";

/**
 * Data access for vacation requests. Every function takes an EntityManager so
 * it runs inside the caller's transaction.
 */
export const vacationRequestRepository = {
	/** Loads a request and locks its row until the transaction ends. */
	async findByIdForUpdate(manager: EntityManager, id: number): Promise<VacationRequest> {
		const request = await manager
			.getRepository(VacationRequest)
			.createQueryBuilder("request")
			.setLock("pessimistic_write")
			.where("request.id = :id", { id })
			.getOne();
		if (!request) {
			throw new NotFoundError(`Vacation request #${id} not found`);
		}
		return request;
	},

	/** Rule 2: does an active (pending/approved) request of this user overlap the range? */
	async hasOverlap(
		manager: EntityManager,
		userId: number,
		startDate: string,
		endDate: string,
		excludeId?: number
	): Promise<boolean> {
		const query = manager
			.getRepository(VacationRequest)
			.createQueryBuilder("request")
			.where("request.user_id = :userId", { userId })
			.andWhere("request.status <> :rejected", { rejected: VacationStatus.Rejected })
			.andWhere("request.start_date <= :endDate AND request.end_date >= :startDate", { startDate, endDate });
		if (excludeId !== undefined) {
			query.andWhere("request.id <> :excludeId", { excludeId });
		}
		return query.getExists();
	},

	/**
	 * Saves and maps the DB-level overlap constraint to a business error.
	 * The app-level check gives a fast friendly answer; the constraint covers races.
	 */
	async save(manager: EntityManager, request: VacationRequest): Promise<VacationRequest> {
		try {
			return await manager.getRepository(VacationRequest).save(request);
		} catch (error) {
			if (error instanceof QueryFailedError && (error.driverError as { code?: string })?.code === EXCLUSION_VIOLATION) {
				throw new BusinessRuleError(OVERLAP_MESSAGE);
			}
			throw error;
		}
	},

	async remove(manager: EntityManager, request: VacationRequest): Promise<void> {
		await manager.getRepository(VacationRequest).remove(request);
	},
};
