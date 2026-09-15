import type { Page } from '@playwright/test';

/** What a page-side subscription hands back: `done` settles once the step has landed. */
export type Armed<T> = { done: Promise<T> };

/** Caps an armed wait, so a missed event fails with its own name rather than a test timeout. */
export type ArmCap = { what: string; timeout: number };

/**
 * Subscribes in the page before the action that triggers the event. `subscribe` runs now and
 * returns `{ done }` — already resolved when the state the event announces holds, otherwise
 * resolving on the event — and the thunk it returns awaits that after the action, then releases
 * the handle. Works for any emitter the page has: the editor Caller, the editor-api globals,
 * an observer, the engine app.
 */
export const arm = async <T>(page: Page, subscribe: (arg: any) => Armed<T>, arg?: any, cap?: ArmCap) => {
    const handle = await page.evaluateHandle(subscribe, arg);
    return async () => {
        const value = await page.evaluate(({ armed, cap: c }) => {
            if (!c) {
                return armed.done;
            }
            return Promise.race([armed.done, new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error(`timed out waiting for ${c.what}`)), c.timeout);
            })]);
        }, { armed: handle, cap: cap ?? null });
        await handle.dispose();
        return value as T;
    };
};
