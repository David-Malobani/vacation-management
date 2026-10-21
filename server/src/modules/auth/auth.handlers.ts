import { z } from "zod";
import { UnauthorizedError } from "../../core/errors";
import { HandlerFn, InputParserFn } from "../../core/http/handler.types";
import { readJsonBody, validate } from "../../core/http/request";
import { getDataSource } from "../../database/data-source";
import { toUserDto } from "../users/user.entity";
import { findUserById } from "../users/user.queries";
import { login as loginWithPassword } from "./auth.service";

const loginSchema = z.object({
	email: z.string().trim().email("must be a valid email"),
	password: z.string().min(1, "is required"),
});

type LoginInput = z.infer<typeof loginSchema>;

/** POST /auth/login */
export const parseLogin: InputParserFn<LoginInput> = (event) => validate(loginSchema, readJsonBody(event));

export const login: HandlerFn<LoginInput> = async ({ email, password }) => loginWithPassword(email, password);

/** GET /auth/me: reloads the user so a deleted account stops working immediately. */
export const me: HandlerFn = async (_input, _event, auth) => {
	const user = await findUserById(await getDataSource(), auth.user.id);
	if (!user) {
		throw new UnauthorizedError("This account no longer exists");
	}
	return toUserDto(user);
};
