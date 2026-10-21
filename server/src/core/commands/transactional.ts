import { DataSource, EntityManager } from "typeorm";
import { DomainEvent, EventBus } from "../events/event-bus";

/**
 * What a command handler gets while it runs inside a transaction: the
 * transactional EntityManager plus a way to record events. Recorded events are
 * only published once the transaction has committed, so listeners never see
 * a fact that was rolled back.
 */
export interface TransactionContext {
	readonly manager: EntityManager;
	record(event: DomainEvent): void;
}

export type DataSourceProvider = () => Promise<Pick<DataSource, "transaction">>;

export class Transactional {
	constructor(
		private readonly getDataSource: DataSourceProvider,
		private readonly eventBus: EventBus
	) {}

	async run<T>(work: (context: TransactionContext) => Promise<T>): Promise<T> {
		const dataSource = await this.getDataSource();
		const events: DomainEvent[] = [];

		const result = await dataSource.transaction((manager) =>
			work({ manager, record: (event) => events.push(event) })
		);

		// Reached only after COMMIT; a thrown error above discards the events.
		await this.eventBus.publishAll(events);
		return result;
	}
}
