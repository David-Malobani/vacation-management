import type { RouteConfig } from "commoneventframework";
import { CommonEvent } from "commoneventframework/dist/types/commonEvent";
import { getSpec } from "commoneventframework/dist/doc/swagger";
import { ForbiddenError, UnauthorizedError } from "../errors";
import { Role } from "../../modules/users/user.entity";
import { verifyToken } from "../../modules/auth/auth.service";
import { AuthContext } from "./handler.types";

/**
 * Route-level access control, declared in root.yaml next to each route:
 *   security: [{ bearerAuth: [] }]   → a valid JWT is required (the global default)
 *   security: []                     → public route
 *   x-roles: [Validator]             → additionally restrict to these roles
 */
interface RoutePolicy {
	authenticated: boolean;
	roles: Role[] | null;
}

type Operation = { security?: unknown[]; "x-roles"?: string[] };
type Spec = { security?: unknown[]; paths?: Record<string, Record<string, Operation>> };

const PUBLIC: RoutePolicy = { authenticated: false, roles: null };
const policies = new Map<string, RoutePolicy>();

const toRoles = (values: string[] | undefined, routeKey: string): Role[] | null => {
	if (!values) return null;
	const roles = Object.values(Role);
	for (const value of values) {
		if (!roles.includes(value as Role)) {
			throw new Error(`root.yaml: unknown role "${value}" in x-roles of ${routeKey}`);
		}
	}
	return values as Role[];
};

const policyFor = (route: RouteConfig): RoutePolicy => {
	const key = `${route.method} ${route.path}`;
	const cached = policies.get(key);
	if (cached) return cached;

	// CEF parses root.yaml when it builds the first event and keeps the spec around.
	const spec = (getSpec() ?? {}) as Spec;
	const operation = spec.paths?.[route.path]?.[route.method.toLowerCase()];
	// Routes not in root.yaml are CEF built-ins (/doc, /context, ...).
	const policy = operation
		? {
				authenticated: (operation.security ?? spec.security ?? []).length > 0,
				roles: toRoles(operation["x-roles"], key),
			}
		: PUBLIC;

	policies.set(key, policy);
	return policy;
};

const readBearerToken = (event: CommonEvent): string | null => {
	const header = Object.entries(event.headers ?? {}).find(([name]) => name.toLowerCase() === "authorization")?.[1];
	const match = header?.match(/^Bearer\s+(.+)$/i);
	return match ? match[1].trim() : null;
};

/** Enforces the route's policy before its parser and handler run. */
export const authorize = (route: RouteConfig, event: CommonEvent): AuthContext => {
	const policy = policyFor(route);
	if (!policy.authenticated) {
		return new AuthContext(null);
	}

	const token = readBearerToken(event);
	if (!token) {
		throw new UnauthorizedError();
	}
	const user = verifyToken(token);

	if (policy.roles && !policy.roles.includes(user.role)) {
		throw new ForbiddenError(`This action requires the ${policy.roles.join(" or ")} role`);
	}
	return new AuthContext(user);
};
