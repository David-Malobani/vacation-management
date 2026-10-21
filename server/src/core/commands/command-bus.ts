/**
 * Minimal in-process command bus.
 *
 * A command is an intention to change state ("CreateVacationRequest").
 * Exactly one handler is registered per command type; HTTP handlers only
 * build commands and dispatch them, so the business logic stays independent
 * of the transport (HTTP today, SQS/Lambda invoke tomorrow).
 */
export interface Command<TResult = unknown> {
	readonly type: string;
	/** Phantom field so TypeScript can infer the handler's result type. */
	readonly __result?: TResult;
}

export interface CommandHandler<TCommand extends Command<TResult>, TResult = unknown> {
	execute(command: TCommand): Promise<TResult>;
}

type CommandResult<TCommand> = TCommand extends Command<infer R> ? R : never;

export class CommandBus {
	private readonly handlers = new Map<string, CommandHandler<any, any>>();

	register<TCommand extends Command<any>>(type: string, handler: CommandHandler<TCommand, CommandResult<TCommand>>): void {
		if (this.handlers.has(type)) {
			throw new Error(`A handler is already registered for command "${type}"`);
		}
		this.handlers.set(type, handler);
	}

	async dispatch<TCommand extends Command<any>>(command: TCommand): Promise<CommandResult<TCommand>> {
		const handler = this.handlers.get(command.type);
		if (!handler) {
			throw new Error(`No handler registered for command "${command.type}"`);
		}
		return handler.execute(command);
	}
}
