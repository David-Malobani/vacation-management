import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env";
import { AuthUser } from "../../core/http/handler.types";
import { UnauthorizedError } from "../../core/errors";
import { getDataSource } from "../../database/data-source";
import { findUserByEmailWithPassword } from "../users/user.queries";
import { Role, toUserDto, UserDto } from "../users/user.entity";

const tokenPayloadSchema = z.object({
	sub: z.string().regex(/^\d+$/),
	name: z.string(),
	email: z.string(),
	role: z.enum(Role),
});

export const signToken = (user: AuthUser): string =>
	jwt.sign({ name: user.name, email: user.email, role: user.role }, env.jwt.secret, {
		subject: String(user.id),
		expiresIn: env.jwt.expiresIn as SignOptions["expiresIn"],
	});

export const verifyToken = (token: string): AuthUser => {
	try {
		const payload = tokenPayloadSchema.parse(jwt.verify(token, env.jwt.secret));
		return { id: Number(payload.sub), name: payload.name, email: payload.email, role: payload.role };
	} catch {
		throw new UnauthorizedError("Invalid or expired token");
	}
};

/** Same message for unknown email and wrong password, so accounts can't be enumerated. */
export const login = async (email: string, password: string): Promise<{ token: string; user: UserDto }> => {
	const user = await findUserByEmailWithPassword(await getDataSource(), email);
	if (!user || !(await bcrypt.compare(password, user.password))) {
		throw new UnauthorizedError("Invalid email or password");
	}
	const dto = toUserDto(user);
	return { token: signToken(dto), user: dto };
};
