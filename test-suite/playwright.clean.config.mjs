import { defineConfig } from '@playwright/test';

import config from './playwright.config.mjs';

export default defineConfig({
    ...config,
    projects: [config.projects[0], {
        name: 'clean',
        testMatch: /clean\.setup\.ts/,
        use: config.projects[0].use,
        dependencies: ['auth']
    }]
});
