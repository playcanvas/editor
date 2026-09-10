import type { Page } from '@playwright/test';

import { READY_TIMEOUT } from './constants';

export const waitForEditor = async (page: Page) => {
    await page.locator('body.editor-ready').waitFor({ state: 'attached', timeout: READY_TIMEOUT });
};

export const waitForCodeEditor = async (page: Page) => {
    await page.locator('body.code-editor-ready').waitFor({ state: 'attached', timeout: READY_TIMEOUT });
};

export const waitForLaunch = async (page: Page) => {
    await page.waitForFunction(() => {
        const app = (window as any).pc?.app;
        return !!app && app.frame > 0 && !document.getElementById('application-splash-wrapper');
    }, null, { timeout: READY_TIMEOUT });
};
