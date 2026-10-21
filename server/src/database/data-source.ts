import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env";
import { User } from "../modules/users/user.entity";
import { VacationRequest } from "../modules/vacation-requests/vacation-request.entity";
import { InitialSchema1760000000000 } from "./migrations/1760000000000-InitialSchema";
import { AddDecisionAudit1760000000001 } from "./migrations/1760000000001-AddDecisionAudit";
import { PaginationIndexes1760000000002 } from "./migrations/1760000000002-PaginationIndexes";

export const AppDataSource = new DataSource({
	type: "postgres",
	host: env.db.host,
	port: env.db.port,
	username: env.db.user,
	password: env.db.password,
	database: env.db.name,
	entities: [User, VacationRequest],
	migrations: [InitialSchema1760000000000, AddDecisionAudit1760000000001, PaginationIndexes1760000000002],
	// Schema is owned by migrations, never auto-synced.
	synchronize: false,
	logging: ["error"],
});

let initializing: Promise<DataSource> | null = null;

/** Lazily initializes the connection once per process (or warm Lambda container). */
export const getDataSource = (): Promise<DataSource> => {
	if (!initializing) {
		initializing = AppDataSource.initialize().catch((error) => {
			initializing = null;
			throw error;
		});
	}
	return initializing;
};
