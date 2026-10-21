import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Records who decided a request and when. decided_by is a second relation to
 * users; it becomes NULL if that validator account is deleted, while
 * decided_at keeps the history.
 */
export class AddDecisionAudit1760000000001 implements MigrationInterface {
	name = "AddDecisionAudit1760000000001";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "vacation_requests"
				ADD COLUMN "decided_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
				ADD COLUMN "decided_at" timestamptz
		`);

		// Requests decided before this migration: the best known decision time is the last update.
		await queryRunner.query(
			`UPDATE "vacation_requests" SET "decided_at" = "updated_at" WHERE "status" <> 'Pending'`
		);

		// A request has a decision time exactly when it has been decided.
		await queryRunner.query(`
			ALTER TABLE "vacation_requests"
				ADD CONSTRAINT "chk_vacation_requests_decided_at"
				CHECK (("status" = 'Pending') = ("decided_at" IS NULL))
		`);

		// Speeds up ON DELETE SET NULL when a user is removed.
		await queryRunner.query(
			`CREATE INDEX "idx_vacation_requests_decided_by" ON "vacation_requests" ("decided_by")`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "idx_vacation_requests_decided_by"`);
		await queryRunner.query(`ALTER TABLE "vacation_requests" DROP CONSTRAINT "chk_vacation_requests_decided_at"`);
		await queryRunner.query(`ALTER TABLE "vacation_requests" DROP COLUMN "decided_at", DROP COLUMN "decided_by"`);
	}
}
