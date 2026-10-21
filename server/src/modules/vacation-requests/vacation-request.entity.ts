import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import type { User } from "../users/user.entity";

export enum VacationStatus {
	Pending = "Pending",
	Approved = "Approved",
	Rejected = "Rejected",
}

@Entity({ name: "vacation_requests" })
@Index("idx_vacation_requests_status_created_at", ["status", "createdAt"])
export class VacationRequest {
	@PrimaryGeneratedColumn("identity", { generatedIdentity: "ALWAYS" })
	id: number;

	@Index("idx_vacation_requests_user_id")
	@Column({ name: "user_id", type: "integer" })
	userId: number;

	@ManyToOne("User", (user: User) => user.vacationRequests, { onDelete: "CASCADE" })
	@JoinColumn({ name: "user_id" })
	user: User;

	/** Calendar dates (YYYY-MM-DD). Postgres DATE has no timezone, which is what we want. */
	@Column({ name: "start_date", type: "date" })
	startDate: string;

	@Column({ name: "end_date", type: "date" })
	endDate: string;

	@Column({ type: "text", nullable: true })
	reason: string | null;

	@Column({ type: "enum", enum: VacationStatus, enumName: "vacation_status", default: VacationStatus.Pending })
	status: VacationStatus;

	/** Validator's comment. Mandatory when the request is rejected. */
	@Column({ type: "text", nullable: true })
	comments: string | null;

	/** Validator who made (or last corrected) the decision. Null while pending. */
	@Index("idx_vacation_requests_decided_by")
	@Column({ name: "decided_by", type: "integer", nullable: true })
	decidedById: number | null;

	@ManyToOne("User", { nullable: true, onDelete: "SET NULL" })
	@JoinColumn({ name: "decided_by" })
	decidedBy: User | null;

	@Column({ name: "decided_at", type: "timestamptz", nullable: true })
	decidedAt: Date | null;

	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt: Date;

	@UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
	updatedAt: Date;
}

export type VacationRequestDto = {
	id: number;
	userId: number;
	user?: { id: number; name: string; email: string };
	startDate: string;
	endDate: string;
	reason: string | null;
	status: VacationStatus;
	comments: string | null;
	/** Present when the decider was loaded (list queries). */
	decidedBy?: { id: number; name: string } | null;
	decidedAt: string | null;
	createdAt: string;
	updatedAt: string;
};

export const toVacationRequestDto = (request: VacationRequest): VacationRequestDto => ({
	id: request.id,
	userId: request.userId,
	user: request.user ? { id: request.user.id, name: request.user.name, email: request.user.email } : undefined,
	startDate: request.startDate,
	endDate: request.endDate,
	reason: request.reason,
	status: request.status,
	comments: request.comments,
	decidedBy:
		request.decidedBy === undefined
			? undefined
			: request.decidedBy && { id: request.decidedBy.id, name: request.decidedBy.name },
	decidedAt: request.decidedAt?.toISOString() ?? null,
	createdAt: request.createdAt.toISOString(),
	updatedAt: request.updatedAt.toISOString(),
});
