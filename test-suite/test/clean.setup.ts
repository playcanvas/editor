import { test as setup } from '@playwright/test';

import { deleteAllProjects } from '../lib/common';
import { editorBlankUrl } from '../lib/config';
import { middleware } from '../lib/middleware';

setup('removing old projects', async ({ page }) => {
    await middleware(page.context());

    // delete all projects
    await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
    await deleteAllProjects(page);
});
