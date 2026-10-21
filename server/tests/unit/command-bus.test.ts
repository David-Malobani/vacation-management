import { describe, expect, it, vi } from "vitest";
import { Command, CommandBus, CommandHandler } from "../../src/core/commands/command-bus";

class GreetCommand implements Command<string> {
	declare readonly __result?: string;
	static readonly TYPE = "Greet";
	readonly type = GreetCommand.TYPE;

	constructor(public readonly name: string) {}
}

class GreetHandler implements CommandHandler<GreetCommand, string> {
	async execute(command: GreetCommand): Promise<string> {
		return `Hello ${command.name}`;
	}
}

describe("CommandBus", () => {
	it("routes a command to its handler and returns the handler's result", async () => {
		const bus = new CommandBus();
		bus.register(GreetCommand.TYPE, new GreetHandler());

		await expect(bus.dispatch(new GreetCommand("Alice"))).resolves.toBe("Hello Alice");
	});

	it("passes the exact command instance to the handler", async () => {
		const bus = new CommandBus();
		const execute = vi.fn().mockResolvedValue("ok");
		bus.register(GreetCommand.TYPE, { execute });

		const command = new GreetCommand("Bob");
		await bus.dispatch(command);

		expect(execute).toHaveBeenCalledExactlyOnceWith(command);
	});

	it("refuses a second handler for the same command type", () => {
		const bus = new CommandBus();
		bus.register(GreetCommand.TYPE, new GreetHandler());

		expect(() => bus.register(GreetCommand.TYPE, new GreetHandler())).toThrow(
			'A handler is already registered for command "Greet"'
		);
	});

	it("fails loudly when no handler is registered", async () => {
		const bus = new CommandBus();

		await expect(bus.dispatch(new GreetCommand("Carol"))).rejects.toThrow('No handler registered for command "Greet"');
	});

	it("propagates handler errors to the caller", async () => {
		const bus = new CommandBus();
		bus.register(GreetCommand.TYPE, { execute: () => Promise.reject(new Error("boom")) });

		await expect(bus.dispatch(new GreetCommand("Dan"))).rejects.toThrow("boom");
	});
});
