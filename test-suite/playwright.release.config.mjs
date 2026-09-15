import { defineConfig } from '@playwright/test';

import config from './playwright.config.mjs';

export default defineConfig({
    ...config,
    forbidOnly: true,
    failOnFlakyTests: true,
    metadata: { ...config.metadata, release: true },
    webServer: config.webServer ? { ...config.webServer, reuseExistingServer: false } : undefined,
    reporter: [...config.reporter, ['./lib/release-reporter.ts']],
    projects: config.projects.map(project => ({
        ...project,
        use: {
            ...project.use,
            ignoreHTTPSErrors: false,
            launchOptions: {
                ...project.use.launchOptions,
                args: project.use.launchOptions.args.filter(arg => arg !== '--disable-web-security')
            }
        }
    }))
});
