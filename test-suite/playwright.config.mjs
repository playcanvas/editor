import { defineConfig, devices } from '@playwright/test';

import { AUTH_STATE } from './lib/config';

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
                ...devices['Desktop Chrome'],
                storageState: AUTH_STATE,
                launchOptions: {
                    args: [
                        '--disable-web-security'
                    ]
                }
            }
        },
        {
            name: 'clean',
            testMatch: /clean\.setup\.ts/,
            use: {
                ...devices['Desktop Chrome'],
                storageState: AUTH_STATE,
                launchOptions: {
                    args: [
                        '--disable-web-security'
                    ]
                }
            },
            dependencies: ['auth']
        },
        {
            name: 'chrome',
            use: {
                ...devices['Desktop Chrome'],
                storageState: AUTH_STATE,
                launchOptions: {
                    args: [
                        '--disable-web-security'
                    ]
                }
            },
            dependencies: ['clean']
        }
    ]
});
