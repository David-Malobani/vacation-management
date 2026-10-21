import bcrypt from "bcryptjs";
import { Role, User } from "../modules/users/user.entity";
import { VacationRequest, VacationStatus } from "../modules/vacation-requests/vacation-request.entity";
import { todayIso } from "../modules/vacation-requests/vacation-request.rules";
import { AppDataSource } from "./data-source";

/**
 * Resets the database to a known demo state. Every user's password is
 * DEMO_PASSWORD. Sample requests are dated relative to today so they never
 * fall in the past.
 */
export const DEMO_PASSWORD = "password123";

const DEMO_USERS: Array<Pick<User, "name" | "email" | "role">> = [
	{ name: "Alice Martin", email: "alice@example.com", role: Role.Requester },
	{ name: "Bob Cohen", email: "bob@example.com", role: Role.Requester },
	{ name: "Carol Levi", email: "carol@example.com", role: Role.Requester },
	{ name: "David Azoulay", email: "david@example.com", role: Role.Requester },
	{ name: "Maya Manager", email: "manager@example.com", role: Role.Validator },
];

type SampleRequest = {
	email: string;
	startIn: number;
	days: number;
	status: VacationStatus;
	reason?: string;
	comments?: string;
};

const SAMPLE_REQUESTS: SampleRequest[] = [
	{ email: "alice@example.com", startIn: 7, days: 4, status: VacationStatus.Approved, reason: "Family trip" },
	{ email: "alice@example.com", startIn: 30, days: 4, status: VacationStatus.Pending, reason: "Wedding" },
	{ email: "alice@example.com", startIn: 90, days: 5, status: VacationStatus.Pending },
	{ email: "bob@example.com", startIn: 10, days: 4, status: VacationStatus.Pending, reason: "Moving house" },
	{
		email: "bob@example.com",
		startIn: 45,
		days: 2,
		status: VacationStatus.Rejected,
		reason: "Long weekend",
		comments: "Release week, please pick other dates",
	},
	{ email: "bob@example.com", startIn: 60, days: 2, status: VacationStatus.Pending },
	{ email: "carol@example.com", startIn: 3, days: 2, status: VacationStatus.Approved, reason: "Medical appointment" },
	{ email: "carol@example.com", startIn: 20, days: 7, status: VacationStatus.Pending, reason: "Ski holiday" },
	{ email: "carol@example.com", startIn: 70, days: 1, status: VacationStatus.Approved },
	{ email: "david@example.com", startIn: 14, days: 4, status: VacationStatus.Approved, reason: "Conference" },
	{ email: "david@example.com", startIn: 40, days: 3, status: VacationStatus.Pending },
	{
		email: "david@example.com",
		startIn: 100,
		days: 4,
		status: VacationStatus.Rejected,
		comments: "Team is at minimum capacity that week",
	},
];

const addDays = (days: number): string => {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return todayIso(date);
};

const seed = async (): Promise<void> => {
	const dataSource = await AppDataSource.initialize();
	try {
		await dataSource.transaction(async (manager) => {
			await manager.query(`TRUNCATE "vacation_requests", "users" RESTART IDENTITY CASCADE`);

			const password = await bcrypt.hash(DEMO_PASSWORD, 10);
			const users = await manager.save(DEMO_USERS.map((user) => manager.create(User, { ...user, password })));
			const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));
			const validatorId = users.find((user) => user.role === Role.Validator)!.id;

			await manager.save(
				SAMPLE_REQUESTS.map((sample) =>
					manager.create(VacationRequest, {
						userId: userIdByEmail.get(sample.email)!,
						startDate: addDays(sample.startIn),
						endDate: addDays(sample.startIn + sample.days),
						status: sample.status,
						reason: sample.reason ?? null,
						comments: sample.comments ?? null,
						...(sample.status !== VacationStatus.Pending && { decidedById: validatorId, decidedAt: new Date() }),
					})
				)
			);
		});

		console.info(`Seeded ${DEMO_USERS.length} users and ${SAMPLE_REQUESTS.length} vacation requests.`);
		console.table(DEMO_USERS.map(({ email, role }) => ({ email, role, password: DEMO_PASSWORD })));
	} finally {
		await dataSource.destroy();
	}
};

seed().catch((error) => {
	console.error("Seeding failed", error);
	process.exit(1);
});
