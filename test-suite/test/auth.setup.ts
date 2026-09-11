import { test as setup } from '@playwright/test';

import { HOST } from '../lib/config';
import { middleware } from '../lib/middleware';

setup('user authenticated', async ({ page }) => {
    await middleware(page.context());

    // check if already authenticated by looking for editor title. an unauthenticated request
    // lands on the login page, so read the title before waiting on any editor state
    await page.goto(`https://${HOST}/editor`);
    const title = await page.title();
    if (!/Editor/.test(title)) {
        throw new Error('not authenticated');
    }

    // the blank editor is ready when the project cms renders
    await page.locator('.picker-project-cms').waitFor();

    // check for test suite flag present on account
    const res1 = await page.request.get(`https://${HOST}/api/id`);
    const { id } = await res1.json();
    const res2 = await page.request.get(`https://${HOST}/api/users/${id}`);
    const { flags } = await res2.json();
    if (!flags?.testSuite) {
        throw new Error('test suite flag not present on account');
    }
});
