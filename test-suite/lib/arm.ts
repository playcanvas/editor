import type { Frame, Page } from '@playwright/test';

/** What a page-side subscription hands back: `done` settles once the step has landed. */
export type Armed<T> = { done: Promise<T>; dispose?: () => void };

/** Caps an armed wait, so a missed event fails with its own name rather than a test timeout. */
export type ArmCap = { what: string; timeout: number };

/**
 * Subscribes in the page before the action that triggers the event. `subscribe` runs now and
 * returns `{ done }` — already resolved when the state the event announces holds, otherwise
 * resolving on the event — and the thunk it returns awaits that after the action, then releases
 * the handle. Works for any emitter the page has: the editor Caller, the editor-api globals,
 * an observer, the engine app.
 */
export const arm = async <T>(page: Page | Frame, subscribe: (arg: any) => Armed<T>, arg?: any, cap?: ArmCap) => {
    const handle = await page.evaluateHandle(subscribe, arg);
    return async () => {
        const value = await page.evaluate(({ armed, cap: c }) => {
            if (!c) {
                return armed.done.then((result) => {
                    armed.dispose?.();
                    return result;
                }, (error) => {
                    armed.dispose?.();
                    throw error;
                });
            }
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    armed.dispose?.();
                    reject(new Error(`timed out waiting for ${c.what}`));
                }, c.timeout);
                armed.done.then((result) => {
                    clearTimeout(timer);
                    armed.dispose?.();
                    resolve(result);
                }, (error) => {
                    clearTimeout(timer);
                    armed.dispose?.();
                    reject(error);
                });
            });
        }, { armed: handle, cap: cap ?? null }).then(
            async (result) => {
                await handle.dispose(); return result;
            },
            async (error) => {
                await handle.dispose(); throw error;
            }
        );
        return value as T;
    };
};
