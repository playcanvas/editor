type EventData = Record<string, { name: string; time: number; [key: string]: unknown }>;

type EventOperation = {
    kind: 'event.add' | 'event.update' | 'event.remove';
    id?: number;
    name?: string;
    time?: number;
    properties?: Record<string, unknown>;
};

const fail = (message: string): never => {
    throw new Error(message);
};

const id = (value: unknown) => {
    if (!Number.isSafeInteger(value) || Number(value) < 0) {
        fail('Event id must be a non-negative safe integer.');
    }
    return Number(value);
};

const validate = (event: Record<string, unknown>) => {
    if (typeof event.name !== 'string' || !event.name.trim()) {
        fail('Event name must be a non-empty string.');
    }
    const time = event.time;
    if (typeof time !== 'number' || !Number.isFinite(time) || time < 0) {
        fail('Event time must be a finite non-negative number.');
    }
    if (Number(time) > 1) {
        fail('Event time must be between 0 and 1.');
    }
    if (
        event.number !== undefined &&
        event.number !== null &&
        (typeof event.number !== 'number' || !Number.isFinite(event.number))
    ) {
        fail('Event number payload must be finite or null.');
    }
    if (event.string !== undefined && typeof event.string !== 'string') {
        fail('Event string payload must be a string.');
    }
};

const modifyAnimationEvents = (value: EventData = {}, operations: EventOperation[]) => {
    const events = structuredClone(value);
    const ids: number[] = [];
    if (!Array.isArray(operations) || !operations.length) {
        fail('At least one animation event operation is required.');
    }
    operations.forEach((op, index) => {
        if (op.kind === 'event.add') {
            let eventId = op.id;
            if (eventId === undefined) {
                eventId = 0;
                while (Object.hasOwn(events, eventId)) {
                    eventId++;
                }
            } else {
                eventId = id(eventId);
            }
            if (Object.hasOwn(events, eventId)) {
                fail(`Event ${eventId} already exists.`);
            }
            const event = { ...op.properties, name: op.name, time: op.time };
            validate(event);
            events[eventId] = event as EventData[string];
            ids.push(eventId);
            return;
        }
        const eventId = id(op.id);
        if (!Object.hasOwn(events, eventId)) {
            fail(`Event ${eventId} not found.`);
        }
        if (op.kind === 'event.update') {
            const event = { ...events[eventId], ...op.properties };
            validate(event);
            events[eventId] = event as EventData[string];
        } else if (op.kind === 'event.remove') {
            delete events[eventId];
        } else {
            fail(`Operation ${index} has unsupported kind "${(op as EventOperation).kind}".`);
        }
    });
    return { events, ids };
};

export { modifyAnimationEvents };
export type { EventData as AnimationEventData, EventOperation as AnimationEventOperation };
