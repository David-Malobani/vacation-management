/**
 * Minimal in-process command bus.
 *
 * A command is an intention to change state ("CreateVacationRequest").
 * Exactly one handler is registered per command type; HTTP handlers only
 * build commands and dispatch them, so the business logic stays independent
 * of the transport (HTTP today, SQS/Lambda invoke tomorrow).
 */
export interface Command<ResultType = unknown> {
	readonly type: string;
	/** Phantom field so TypeScript can infer the handler's result type. */
	readonly __result?: ResultType;
}

export interface CommandHandler<CommandType extends Command<ResultType>, ResultType = unknown> {
	execute(command: CommandType): Promise<ResultType>;
}

type CommandResult<CommandType> = CommandType extends Command<infer ResultType> ? ResultType : never;

export class CommandBus {
	private readonly handlers = new Map<string, CommandHandler<any, any>>();

	register<CommandType extends Command<any>>(
		type: string,
		handler: CommandHandler<CommandType, CommandResult<CommandType>>
	): void {
		if (this.handlers.has(type)) {
			throw new Error(`A handler is already registered for command "${type}"`);
		}
		this.handlers.set(type, handler);
	}

	async dispatch<CommandType extends Command<any>>(command: CommandType): Promise<CommandResult<CommandType>> {
		const handler = this.handlers.get(command.type);
		if (!handler) {
			throw new Error(`No handler registered for command "${command.type}"`);
		}
		return handler.execute(command);
	}
}
