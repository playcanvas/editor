import { test as setup } from '@playwright/test';

import { HOST } from '../lib/config';
import { middleware } from '../lib/middleware';

setup('authenticate user', async ({ page }) => {
    await middleware(page.context());
    await page.goto(`https://${HOST}/editor`, { waitUntil: 'networkidle' });
    const title = await page.title();
    if (/Editor/.test(title)) {
        setup.skip(true, 'already authenticated');
        return;
    }
    throw new Error('not authenticated');
});
