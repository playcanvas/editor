import { defineConfig } from '@playwright/test';

import { AUTH_STATES } from './lib/config';

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
    fullyParallel: false, // FIXME: Enable once account per worker is implemented
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1, // FIXME: Enable once account per worker is implemented
    reporter: process.env.CI ? 'list' : 'html',
    use: {
        trace: 'on-first-retry'
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
