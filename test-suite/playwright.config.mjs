import { defineConfig } from '@playwright/test';

import { AUTH_STATES, LOCAL_FRONTEND } from './lib/config';

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
    forbidOnly: true,
    failOnFlakyTests: true,
    retries: 0,
    workers: AUTH_STATES.length, // one account per worker
    reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]],
    webServer: LOCAL_FRONTEND ? {
        command: 'npm run serve',
        cwd: process.env.PC_FRONTEND_DIR ?? '..',
        url: 'http://localhost:3487/js/editor.js',
        reuseExistingServer: !process.env.CI
    } : undefined,
    use: {
        // local backend serves a self-signed cert that node's request api rejects (chromium
        // trusts it via the keychain); harmless for dev/prod which have valid certs
        ignoreHTTPSErrors: true,
        // shared contexts retain per-test traces; video needs a context per test
        trace: 'retain-on-failure',
        video: 'off',
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
            name: 'suite',
            use: {
                browserName: 'chromium',
                storageState: AUTH_STATES[0],
                launchOptions: {
                    args: CHROME_ARGS
                }
            },
            dependencies: ['auth']
        }
    ]
});
