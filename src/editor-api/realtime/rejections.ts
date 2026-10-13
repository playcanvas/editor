/**
 * ShareDB composes queued ops into one submit, so a single rejection reaches every op's
 * callback with the same error. Collects those ops and reports the rejection once.
 *
 * @param report - Called once per rejection with every op it covered
 * @returns A callback taking the error and the ops of one submit
 */
export const batchRejections = <T>(report: (err: unknown, ops: T[]) => void) => {
    const pending = new Map<unknown, T[]>();
    return (err: unknown, ops: T[]) => {
        const batch = pending.get(err);
        if (batch) {
            batch.push(...ops);
            return;
        }

        // the callbacks run synchronously, so the batch is complete by the next microtask
        pending.set(err, [...ops]);
        queueMicrotask(() => {
            report(err, pending.get(err));
            pending.delete(err);
        });
    };
};
