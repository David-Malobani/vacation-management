import { APIGatewayProxyStructuredResultV2 } from "commoneventframework";
import { CommonEvent } from "commoneventframework/dist/types/commonEvent";
import { UnauthorizedError } from "../errors";
import { Role } from "../../modules/users/user.entity";

/** The caller, as proven by a valid JWT. */
export interface AuthUser {
	id: number;
	name: string;
	email: string;
	role: Role;
}

/**
 * Who is calling. Built by the entry point before any parser or handler runs;
 * on protected routes (see root.yaml `security`) `user` is always present.
 */
export class AuthContext {
	constructor(private readonly authUser: AuthUser | null) {}

	get user(): AuthUser {
		if (!this.authUser) {
			throw new UnauthorizedError();
		}
		return this.authUser;
	}
}

/**
 * CEF signatures (`x-inputParser` and `x-handler` in root.yaml), extended with
 * the auth context. A parser turns the raw event into a typed input (usually a
 * command) and throws a ValidationError on bad input.
 */
export type InputParserFn<InputType> = (event: CommonEvent, auth: AuthContext) => InputType;

export type HandlerFn<InputType = unknown> = (
	input: InputType,
	event: CommonEvent,
	auth: AuthContext
) => Promise<APIGatewayProxyStructuredResultV2 | object>;
