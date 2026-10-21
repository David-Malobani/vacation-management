import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Initial schema. Business rules are enforced in the application layer for
 * friendly error messages AND in the database as a last line of defense
 * (e.g. two concurrent requests that would overlap).
 */
export class InitialSchema1760000000000 implements MigrationInterface {
	name = "InitialSchema1760000000000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Needed to combine "user_id =" and "daterange &&" in one exclusion constraint.
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);

		await queryRunner.query(`CREATE TYPE "user_role" AS ENUM ('Requester', 'Validator')`);
		await queryRunner.query(`CREATE TYPE "vacation_status" AS ENUM ('Pending', 'Approved', 'Rejected')`);

		await queryRunner.query(`
			CREATE TABLE "users" (
				"id"         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
				"name"       varchar(120) NOT NULL,
				"email"      varchar(255) NOT NULL,
				"password"   varchar(255) NOT NULL,
				"role"       "user_role" NOT NULL,
				"created_at" timestamptz NOT NULL DEFAULT now(),
				CONSTRAINT "uq_users_email" UNIQUE ("email")
			)
		`);

		await queryRunner.query(`
			CREATE TABLE "vacation_requests" (
				"id"         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
				"user_id"    integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
				"start_date" date NOT NULL,
				"end_date"   date NOT NULL,
				"reason"     text,
				"status"     "vacation_status" NOT NULL DEFAULT 'Pending',
				"comments"   text,
				"created_at" timestamptz NOT NULL DEFAULT now(),
				"updated_at" timestamptz NOT NULL DEFAULT now(),

				-- Rule 1: end date must be after start date
				CONSTRAINT "chk_vacation_requests_dates" CHECK ("end_date" > "start_date"),

				-- Rule 5: a rejected request must contain a rejection comment
				CONSTRAINT "chk_vacation_requests_rejection_comment"
					CHECK ("status" <> 'Rejected' OR length(btrim(coalesce("comments", ''))) > 0),

				-- Rule 2: no overlapping active (pending/approved) requests for the same user
				CONSTRAINT "excl_vacation_requests_no_overlap" EXCLUDE USING gist (
					"user_id" WITH =,
					daterange("start_date", "end_date", '[]') WITH &&
				) WHERE ("status" <> 'Rejected')
			)
		`);

		await queryRunner.query(`CREATE INDEX "idx_vacation_requests_user_id" ON "vacation_requests" ("user_id")`);
		await queryRunner.query(
			`CREATE INDEX "idx_vacation_requests_status_created_at" ON "vacation_requests" ("status", "created_at")`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "vacation_requests"`);
		await queryRunner.query(`DROP TABLE "users"`);
		await queryRunner.query(`DROP TYPE "vacation_status"`);
		await queryRunner.query(`DROP TYPE "user_role"`);
	}
}
