import { config as loadDotenv } from "dotenv";

// CEF's loadEnv() also loads .env, but scripts (migrations, seed) run outside of it.
loadDotenv({ path: ".env" });

const read = (key: string, fallback?: string): string => {
	const value = process.env[key] ?? fallback;
	if (value === undefined) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
};

export const env = {
	db: {
		host: read("DB_HOST", "localhost"),
		port: Number(read("DB_PORT", "5432")),
		user: read("DB_USER", "postgres"),
		password: read("DB_PASSWORD", "postgres"),
		name: read("DB_NAME", "vacation_management"),
	},
	jwt: {
		secret: read("JWT_SECRET", "dev-secret-change-me"),
		expiresIn: read("JWT_EXPIRES_IN", "8h"),
	},
};
