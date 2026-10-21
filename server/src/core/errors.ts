/**
 * Application errors carry their HTTP status so the entry point can map
 * them to responses without the domain layer knowing about HTTP.
 */
export class AppError extends Error {
	constructor(
		public readonly statusCode: number,
		public readonly code: string,
		message: string,
		public readonly details?: unknown
	) {
		super(message);
		this.name = new.target.name;
	}
}

export class ValidationError extends AppError {
	constructor(message: string, details?: unknown) {
		super(400, "VALIDATION_ERROR", message, details);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Authentication required") {
		super(401, "UNAUTHORIZED", message);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "You are not allowed to perform this action") {
		super(403, "FORBIDDEN", message);
	}
}

export class NotFoundError extends AppError {
	constructor(message = "Resource not found") {
		super(404, "NOT_FOUND", message);
	}
}

/** A business rule was violated (overlap, modifying a decided request, ...). */
export class BusinessRuleError extends AppError {
	constructor(message: string) {
		super(409, "BUSINESS_RULE_VIOLATION", message);
	}
}
