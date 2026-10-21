import { DataSource } from "typeorm";
import { Page, pageOffset, PageRequest, toPage } from "../../../core/pagination";
import { toVacationRequestDto, VacationRequest, VacationRequestDto, VacationStatus } from "../vacation-request.entity";

/**
 * Read side of the module. Queries don't go through the command bus: they
 * change nothing, so they need no transaction and emit no events.
 */

export interface VacationRequestFilter extends PageRequest {
	status?: VacationStatus;
	userId?: number;
}

/** One entry of the team planning calendar. Reason and comments stay private. */
export type TeamVacationDto = {
	id: number;
	userId: number;
	userName: string;
	startDate: string;
	endDate: string;
	status: VacationStatus;
};

/** Validator dashboard (all users) and "my requests" (userId set by the caller). */
export const listVacationRequests = async (
	dataSource: DataSource,
	filter: VacationRequestFilter
): Promise<Page<VacationRequestDto>> => {
	const query = dataSource
		.getRepository(VacationRequest)
		.createQueryBuilder("request")
		.innerJoinAndSelect("request.user", "user")
		.orderBy("request.created_at", "DESC")
		.addOrderBy("request.id", "DESC")
		.skip(pageOffset(filter))
		.take(filter.pageSize);

	if (filter.status) {
		query.andWhere("request.status = :status", { status: filter.status });
	}
	if (filter.userId !== undefined) {
		query.andWhere("request.user_id = :userId", { userId: filter.userId });
	}

	const [requests, total] = await query.getManyAndCount();
	return toPage(requests.map(toVacationRequestDto), total, filter);
};

/** Pending and approved vacations of everyone that intersect [from, to] (inclusive). */
export const listTeamVacations = async (
	dataSource: DataSource,
	from: string,
	to: string
): Promise<TeamVacationDto[]> => {
	const requests = await dataSource
		.getRepository(VacationRequest)
		.createQueryBuilder("request")
		.innerJoinAndSelect("request.user", "user")
		.where("request.status IN (:...statuses)", { statuses: [VacationStatus.Pending, VacationStatus.Approved] })
		.andWhere("request.start_date <= :to AND request.end_date >= :from", { from, to })
		.orderBy("user.name", "ASC")
		.addOrderBy("request.start_date", "ASC")
		.getMany();

	return requests.map((request) => ({
		id: request.id,
		userId: request.userId,
		userName: request.user.name,
		startDate: request.startDate,
		endDate: request.endDate,
		status: request.status,
	}));
};
