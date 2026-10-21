import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Indexes that match exactly how request lists are paginated:
 * ORDER BY created_at DESC, id DESC, optionally filtered by status or user.
 * Postgres can then read one page straight from the index instead of
 * sorting every matching row first.
 */
export class PaginationIndexes1760000000002 implements MigrationInterface {
	name = "PaginationIndexes1760000000002";

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Validator dashboard, "All" tab.
		await queryRunner.query(
			`CREATE INDEX "idx_vacation_requests_created_at" ON "vacation_requests" ("created_at" DESC, "id" DESC)`
		);

		// Status tabs: now also covers the id tie-breaker.
		await queryRunner.query(`DROP INDEX "idx_vacation_requests_status_created_at"`);
		await queryRunner.query(
			`CREATE INDEX "idx_vacation_requests_status_created_at" ON "vacation_requests" ("status", "created_at" DESC, "id" DESC)`
		);

		// "My requests" and the employee filter. Starts with user_id, so it still
		// serves the foreign key and the overlap check, and replaces the single-column index.
		await queryRunner.query(`DROP INDEX "idx_vacation_requests_user_id"`);
		await queryRunner.query(
			`CREATE INDEX "idx_vacation_requests_user_created_at" ON "vacation_requests" ("user_id", "created_at" DESC, "id" DESC)`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "idx_vacation_requests_user_created_at"`);
		await queryRunner.query(`CREATE INDEX "idx_vacation_requests_user_id" ON "vacation_requests" ("user_id")`);
		await queryRunner.query(`DROP INDEX "idx_vacation_requests_status_created_at"`);
		await queryRunner.query(
			`CREATE INDEX "idx_vacation_requests_status_created_at" ON "vacation_requests" ("status", "created_at")`
		);
		await queryRunner.query(`DROP INDEX "idx_vacation_requests_created_at"`);
	}
}
