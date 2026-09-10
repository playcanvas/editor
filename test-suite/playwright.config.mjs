import { defineConfig } from '@playwright/test';

import { AUTH_STATES } from './lib/config';

// stamp the run so every entity a worker creates is traceable and collision free
process.env.E2E_RUN_ID ??= process.env.GITHUB_RUN_ID ?? Date.now().toString(36);

const CHROME_ARGS = [
    '--disable-web-security',
    '--ignore-gpu-blocklist',
    '--use-gl=angle',
    '--use-angle=default'
];

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    timeout: 2 * 60 * 1000,
    testDir: './test',
    fullyParallel: false, // tests in a file share the worker project fixture
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: AUTH_STATES.length, // one account per worker
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list'], ['html']],
    use: {
        trace: 'retain-on-failure',
        video: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },
    projects: [
        {
            name: 'auth',
            testMatch: /auth\.setup\.ts/,
            use: {
                browserName: 'chromium',
                storageState: AUTH_STATES[0],
                launchOptions: {
                    args: CHROME_ARGS
                }
            }
        },
        {
            name: 'clean',
            testMatch: /clean\.setup\.ts/,
            use: {
                browserName: 'chromium',
                storageState: AUTH_STATES[0],
                launchOptions: {
                    args: CHROME_ARGS
                }
            },
            dependencies: ['auth']
        },
        {
            name: 'suite',
            use: {
                browserName: 'chromium',
                storageState: AUTH_STATES[0],
                launchOptions: {
                    args: CHROME_ARGS
                }
            },
            dependencies: ['clean']
        }
    ]
});
