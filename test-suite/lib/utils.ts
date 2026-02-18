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
 * Generate a unique name.
 *
 * @returns A unique name.
 */
export const uniqueName = (name: string) => {
    const id = map.get(name) || 0;
    const next = id + 1;
    map.set(name, next);
    return `${name}-${next}`;
};
