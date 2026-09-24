/**
 * ShareDB composes queued ops into one submit, so a single rejection reaches every op's
 * callback with the same error. Collects those ops and reports the rejection once.
 *
 * @param report - Called once per rejection with every op it covered
 * @returns A callback taking the error and the ops of one submit
 */
export const batchRejections = (report: (err: unknown, ops: object[]) => void) => {
    const pending = new Map<unknown, object[]>();
    return (err: unknown, ops: object[]) => {
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
