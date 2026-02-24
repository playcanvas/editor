import { test as setup } from '@playwright/test';

import { HOST } from '../lib/config';
import { middleware } from '../lib/middleware';

setup('user authenticated', async ({ page }) => {
    await middleware(page.context());

    // check if already authenticated by looking for editor title
    await page.goto(`https://${HOST}/editor`, { waitUntil: 'networkidle' });
    const title = await page.title();
    if (!/Editor/.test(title)) {
        throw new Error('not authenticated');
    }

    // check for test suite flag present on account
    const res1 = await page.request.get(`https://${HOST}/api/id`);
    const { id } = await res1.json();
    const res2 = await page.request.get(`https://${HOST}/api/users/${id}`);
    const { flags } = await res2.json();
    if (!flags?.testSuite) {
        throw new Error('test suite flag not present on account');
    }
});
