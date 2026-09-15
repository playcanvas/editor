import type { Page } from '@playwright/test';

import { arm } from './arm';
import { READY_TIMEOUT } from './constants';

export const waitForEditor = async (page: Page) => {
    await page.locator('body.editor-ready').waitFor({ state: 'attached', timeout: READY_TIMEOUT });
};

export const waitForCodeEditor = async (page: Page) => {
    await page.locator('body.code-editor-ready').waitFor({ state: 'attached', timeout: READY_TIMEOUT });
};

export const waitForLaunch = async (page: Page) => {
    // nothing announces the engine global, which only appears once the launch bundle has booted,
    // so the app itself has to be waited for before its events can be armed
    await page.waitForFunction(() => !!(window as any).pc?.app, null, { timeout: READY_TIMEOUT });

    const running = await arm(page, () => {
        const app = (window as any).pc.app;

        // the splash is removed on the app's own 'start', which precedes every frame
        const up = () => app.frame > 0 && !document.getElementById('application-splash-wrapper');
        if (up()) {
            return { done: Promise.resolve() };
        }
        return { done: new Promise<void>((resolve) => {
            const rendered = () => {
                if (!up()) {
                    return;
                }
                app.off('frameend', rendered);
                resolve();
            };
            app.on('frameend', rendered);
        }) };
    }, undefined, { what: 'the launch app to render a frame', timeout: READY_TIMEOUT });
    await running();
};

/** Resolves on the launch app's next rendered frame, which proves the tick loop advances. */
export const waitForFrame = async (page: Page) => {
    const ticked = await arm(page, () => ({ done: new Promise<void>((resolve) => {
        (window as any).pc.app.once('frameend', () => resolve());
    }) }), undefined, { what: 'the launch app to tick', timeout: READY_TIMEOUT });
    await ticked();
};
