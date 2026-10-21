import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import type { VacationRequest } from "../vacation-requests/vacation-request.entity";

export enum Role {
	Requester = "Requester",
	Validator = "Validator",
}

@Entity({ name: "users" })
export class User {
	@PrimaryGeneratedColumn("identity", { generatedIdentity: "ALWAYS" })
	id: number;

	@Column({ type: "varchar", length: 120 })
	name: string;

	@Column({ type: "varchar", length: 255, unique: true })
	email: string;

	/** bcrypt hash — never the plain password. Excluded from default selects. */
	@Column({ type: "varchar", length: 255, select: false })
	password: string;

	@Column({ type: "enum", enum: Role, enumName: "user_role" })
	role: Role;

	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt: Date;

	@OneToMany("VacationRequest", (request: VacationRequest) => request.user)
	vacationRequests: VacationRequest[];
}

/** Public shape of a user, safe to send to clients. */
export type UserDto = Pick<User, "id" | "name" | "email" | "role">;

export const toUserDto = (user: User): UserDto => ({
	id: user.id,
	name: user.name,
	email: user.email,
	role: user.role,
});
