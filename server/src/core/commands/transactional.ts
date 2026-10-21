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

/** The work a command does inside the transaction; whatever it returns becomes the command's result. */
export type TransactionalWork<ResultType> = (context: TransactionContext) => Promise<ResultType>;

export type DataSourceProvider = () => Promise<Pick<DataSource, "transaction">>;

export class Transactional {
	constructor(
		private readonly getDataSource: DataSourceProvider,
		private readonly eventBus: EventBus
	) {}

	async run<ResultType>(work: TransactionalWork<ResultType>): Promise<ResultType> {
		const dataSource = await this.getDataSource();
		const recordedEvents: DomainEvent[] = [];

		const result = await dataSource.transaction((manager) =>
			work({ manager, record: (event) => recordedEvents.push(event) })
		);

		// Reached only after COMMIT; a thrown error above discards the recorded events.
		await this.eventBus.publishAll(recordedEvents);
		return result;
	}
}
