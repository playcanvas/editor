import { test as setup } from '@playwright/test';

import { deleteProjectsByPrefix } from '../lib/common';
import { editorBlankUrl } from '../lib/config';
import { JOB_TEST_TIMEOUT } from '../lib/constants';
import { middleware } from '../lib/middleware';

setup('removing old projects', async ({ page }) => {
    setup.setTimeout(JOB_TEST_TIMEOUT);
    await middleware(page.context());

    // delete projects left behind by earlier runs
    await page.goto(editorBlankUrl());
    await page.locator('.picker-project-cms').waitFor();
    await deleteProjectsByPrefix(page, 'e2e-');
});
