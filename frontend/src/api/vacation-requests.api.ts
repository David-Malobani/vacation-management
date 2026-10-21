import type { Page, TeamVacation, VacationRequest, VacationRequestInput, VacationStatus } from "@/types/api";
import { http } from "./http";

export interface RequestListFilter {
	page: number;
	pageSize?: number;
	status?: VacationStatus;
	/** Validator dashboard only */
	userId?: number;
}

/** Drops empty filters so they are not sent as `?status=`. */
const cleanParams = (params: object) =>
	Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));

export const vacationRequestsApi = {
	async listMine(filter: RequestListFilter): Promise<Page<VacationRequest>> {
		const { data } = await http.get("/me/vacation-requests", { params: cleanParams(filter) });
		return data;
	},

	async listAll(filter: RequestListFilter): Promise<Page<VacationRequest>> {
		const { data } = await http.get("/vacation-requests", { params: cleanParams(filter) });
		return data;
	},

	async create(input: VacationRequestInput): Promise<VacationRequest> {
		const { data } = await http.post("/vacation-requests", input);
		return data;
	},

	async update(id: number, input: VacationRequestInput): Promise<VacationRequest> {
		const { data } = await http.put(`/vacation-requests/${id}`, input);
		return data;
	},

	async cancel(id: number): Promise<void> {
		await http.delete(`/vacation-requests/${id}`);
	},

	async approve(id: number, comment: string | null): Promise<VacationRequest> {
		const { data } = await http.post(`/vacation-requests/${id}/approve`, { comment });
		return data;
	},

	async reject(id: number, comment: string): Promise<VacationRequest> {
		const { data } = await http.post(`/vacation-requests/${id}/reject`, { comment });
		return data;
	},

	/** Corrects an earlier decision (approved ↔ rejected) before the vacation starts. */
	async changeDecision(
		id: number,
		status: Exclude<VacationStatus, "Pending">,
		comment: string | null
	): Promise<VacationRequest> {
		const { data } = await http.put(`/vacation-requests/${id}/decision`, { status, comment });
		return data;
	},

	async team(from: string, to: string): Promise<TeamVacation[]> {
		const { data } = await http.get<{ items: TeamVacation[] }>("/team/vacations", { params: { from, to } });
		return data.items;
	},
};
