import { chromium } from '@playwright/test';

import { AUTH_STATE, HOST } from '../lib/config';

const browser = await chromium.launch({
    headless: false
});
const context = await browser.newContext({ storageState: AUTH_STATE });
const page = await context.newPage();
page.on('close', async () => {
    await browser.close();
});

await page.goto(`https://${HOST}`, { waitUntil: 'networkidle' });
