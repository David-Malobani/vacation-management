import { describe, expect, it, vi } from "vitest";
import { DomainEvent, EventBus } from "../../src/core/events/event-bus";

const event = (type: string): DomainEvent => ({ type, occurredAt: new Date() });

describe("EventBus", () => {
	it("delivers an event to every listener of its type, and only those", async () => {
		const bus = new EventBus();
		const first = vi.fn();
		const second = vi.fn();
		const other = vi.fn();
		bus.subscribe("Approved", first);
		bus.subscribe("Approved", second);
		bus.subscribe("Rejected", other);

		const approved = event("Approved");
		await bus.publish(approved);

		expect(first).toHaveBeenCalledExactlyOnceWith(approved);
		expect(second).toHaveBeenCalledExactlyOnceWith(approved);
		expect(other).not.toHaveBeenCalled();
	});

	it("is a no-op for events nobody listens to", async () => {
		await expect(new EventBus().publish(event("Unheard"))).resolves.toBeUndefined();
	});

	it("isolates a failing listener from the others and from the publisher", async () => {
		const bus = new EventBus();
		const healthy = vi.fn();
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
		bus.subscribe("Approved", () => {
			throw new Error("mail server down");
		});
		bus.subscribe("Approved", healthy);

		await expect(bus.publish(event("Approved"))).resolves.toBeUndefined();

		expect(healthy).toHaveBeenCalledOnce();
		expect(consoleError).toHaveBeenCalledOnce();
		consoleError.mockRestore();
	});

	it("publishAll preserves the order of events", async () => {
		const bus = new EventBus();
		const seen: string[] = [];
		bus.subscribe("A", () => void seen.push("A"));
		bus.subscribe("B", () => void seen.push("B"));

		await bus.publishAll([event("A"), event("B"), event("A")]);

		expect(seen).toEqual(["A", "B", "A"]);
	});
});
