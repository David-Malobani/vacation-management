/** Shapes returned by the API (see server/src/root.yaml or GET /doc). */

export type Role = "Requester" | "Validator";

export type VacationStatus = "Pending" | "Approved" | "Rejected";

export const VACATION_STATUSES: readonly VacationStatus[] = ["Pending", "Approved", "Rejected"];

export interface User {
	id: number;
	name: string;
	email: string;
	role: Role;
}

export interface VacationRequest {
	id: number;
	userId: number;
	user?: Pick<User, "id" | "name" | "email">;
	/** Calendar date, YYYY-MM-DD */
	startDate: string;
	/** Calendar date, YYYY-MM-DD */
	endDate: string;
	reason: string | null;
	status: VacationStatus;
	/** Validator's comment (always present on rejected requests) */
	comments: string | null;
	/** Validator who decided; null while pending (or if that account was deleted) */
	decidedBy?: { id: number; name: string } | null;
	decidedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface VacationRequestInput {
	startDate: string;
	endDate: string;
	reason: string | null;
}

export interface TeamVacation {
	id: number;
	userId: number;
	userName: string;
	startDate: string;
	endDate: string;
	status: Exclude<VacationStatus, "Rejected">;
}

export interface Page<TItem> {
	items: TItem[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}

export interface ApiErrorBody {
	error: {
		code: string;
		message: string;
		details?: Array<{ field: string; message: string }>;
	};
}
