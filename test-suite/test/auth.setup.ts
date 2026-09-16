import { test as setup } from '@playwright/test';

import { AUTH_STATES, HOST } from '../lib/config';
import { middleware } from '../lib/middleware';

setup('user authenticated', async ({ page, browser }) => {
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

    const ids = new Set([id]);
    for (const state of AUTH_STATES.slice(1)) {
        const context = await browser.newContext({ storageState: state });
        await middleware(context);
        const guest = await context.newPage();
        await guest.goto(`https://${HOST}/editor`);
        await guest.locator('.picker-project-cms').waitFor();
        const identity = await (await guest.request.get(`https://${HOST}/api/id`)).json();
        const user = await (await guest.request.get(`https://${HOST}/api/users/${identity.id}`)).json();
        await context.close();
        if (!user.flags?.testSuite || ids.has(identity.id)) {
            throw new Error('each worker needs a distinct authenticated testSuite account');
        }
        ids.add(identity.id);
    }
});
