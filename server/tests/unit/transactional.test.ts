import { describe, expect, it, vi } from "vitest";
import { EntityManager } from "typeorm";
import { Transactional } from "../../src/core/commands/transactional";
import { DomainEvent, EventBus } from "../../src/core/events/event-bus";

const event = (type: string): DomainEvent => ({ type, occurredAt: new Date() });

/** Fake DataSource whose transaction() runs the work and records whether it "committed". */
const fakeDataSource = () => {
	const state = { committed: false };
	const dataSource = {
		transaction: async <TResult>(work: (manager: EntityManager) => Promise<TResult>): Promise<TResult> => {
			const result = await work({} as EntityManager); // throws → rollback, never committed
			state.committed = true;
			return result;
		},
	};
	return { state, dataSource: dataSource as never };
};

describe("Transactional", () => {
	it("returns the work's result and publishes recorded events after commit", async () => {
		const { state, dataSource } = fakeDataSource();
		const eventBus = new EventBus();
		const committedWhenPublished: boolean[] = [];
		vi.spyOn(eventBus, "publishAll").mockImplementation(async () => {
			committedWhenPublished.push(state.committed);
		});

		const transactional = new Transactional(async () => dataSource, eventBus);
		const created = event("Created");

		const result = await transactional.run(async ({ record }) => {
			record(created);
			return 42;
		});

		expect(result).toBe(42);
		expect(eventBus.publishAll).toHaveBeenCalledExactlyOnceWith([created]);
		expect(committedWhenPublished).toEqual([true]);
	});

	it("publishes nothing when the work fails (rollback)", async () => {
		const { dataSource } = fakeDataSource();
		const eventBus = new EventBus();
		const publishAll = vi.spyOn(eventBus, "publishAll");
		const transactional = new Transactional(async () => dataSource, eventBus);

		await expect(
			transactional.run(async ({ record }) => {
				record(event("Created"));
				throw new Error("constraint violated");
			})
		).rejects.toThrow("constraint violated");

		expect(publishAll).not.toHaveBeenCalled();
	});
});
