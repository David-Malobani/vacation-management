import { z } from "zod";
import { HandlerFn, InputParserFn } from "../../core/http/handler.types";
import { readQuery, validate } from "../../core/http/request";
import { getDataSource } from "../../database/data-source";
import { Role } from "./user.entity";
import { listUsers as queryUsers } from "./user.queries";

const listUsersSchema = z.object({ role: z.enum(Role).optional() });

type ListUsersInput = z.infer<typeof listUsersSchema>;

/** GET /users?role= (feeds the validator's "filter by user" dropdown) */
export const parseListUsers: InputParserFn<ListUsersInput> = (event) => validate(listUsersSchema, readQuery(event));

export const listUsers: HandlerFn<ListUsersInput> = async ({ role }) => ({
	items: await queryUsers(await getDataSource(), role),
});
