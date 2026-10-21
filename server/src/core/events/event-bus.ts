/**
 * Minimal in-process event bus.
 *
 * An event is a fact that already happened ("VacationRequestApproved").
 * Any number of listeners may subscribe; they run after the command's
 * transaction has committed. A failing listener is logged and never breaks
 * the command that produced the event.
 */
export interface DomainEvent {
	readonly type: string;
	readonly occurredAt: Date;
}

export type EventListener<EventType extends DomainEvent = DomainEvent> = (event: EventType) => Promise<void> | void;

export class EventBus {
	private readonly listeners = new Map<string, EventListener<any>[]>();

	subscribe<EventType extends DomainEvent>(type: string, listener: EventListener<EventType>): void {
		const existing = this.listeners.get(type) ?? [];
		this.listeners.set(type, [...existing, listener]);
	}

	async publish(event: DomainEvent): Promise<void> {
		const listeners = this.listeners.get(event.type) ?? [];
		await Promise.all(
			listeners.map(async (listener) => {
				try {
					await listener(event);
				} catch (error) {
					console.error(`[EventBus] Listener failed for "${event.type}"`, error);
				}
			})
		);
	}

	async publishAll(events: DomainEvent[]): Promise<void> {
		for (const event of events) {
			await this.publish(event);
		}
	}
}
