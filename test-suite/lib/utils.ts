const RUN_ID = process.env.E2E_RUN_ID ?? 'local';
const WORKER = process.env.TEST_PARALLEL_INDEX ?? '0';

/**
 * Wait for a period of time.
 *
 * @param ms - The time to wait.
 * @returns A promise that resolves after the time.
 */
export const wait = (ms: number) => {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
};

const map = new Map<string, number>();
/**
 * Generate a name unique to this run, worker and call, so concurrent runs never collide.
 *
 * @param name - The base name.
 * @returns A unique name.
 */
export const uniqueName = (name: string) => {
    const next = (map.get(name) ?? 0) + 1;
    map.set(name, next);
    return `e2e-${RUN_ID}-w${WORKER}-${name}-${next}`;
};
