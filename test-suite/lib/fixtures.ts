import { test as base, expect, type BrowserContext, type BrowserContextOptions, type Page } from '@playwright/test';

import { checkCookieAccept, createProject, deleteProject } from './common';
import { AUTH_STATES, codeEditorUrl, editorBlankUrl, editorUrl, launchSceneUrl, type SearchParams } from './config';
import { attachConsoleCapture, ConsoleErrors } from './console';
import { JOB_TEST_TIMEOUT } from './constants';
import { middleware } from './middleware';
import { type Baseline, EditorShell } from './pages/common';
import { waitForCodeEditor, waitForEditor, waitForLaunch } from './ready';
import { uniqueName } from './utils';

export type Project = { id: number; name: string; sceneId: number };

/** The worker's one editor page and the state every test gets it back in. */
export type SharedEditor = { page: Page; base: Baseline };

export type WorkerFixtures = {
    authState: BrowserContextOptions['storageState'];
    project: Project & { page: Page };
    editorContext: BrowserContext;
    sharedEditor: SharedEditor;
};
export type EditorFixtures = {
    errors: ConsoleErrors;
    blankPage: Page;
    editorPage: Page;
    codeEditorPage: Page;
    openLaunch: (sceneId: number, params?: SearchParams) => Promise<Page>;
    collaborator: BrowserContext | null;
};

const CMS = '.picker-project-cms';

export const test = base.extend<EditorFixtures, WorkerFixtures>({
    // eslint-disable-next-line no-empty-pattern
    authState: [async ({}, use, workerInfo) => {
        await use(AUTH_STATES[workerInfo.parallelIndex % AUTH_STATES.length]);
    }, { scope: 'worker' }],

    // one context for the whole worker: the editor page, the pages a spec opens beside it and
    // the console capture all hang off it, so only the pages are per test. playwright traces a
    // context it created through the browser fixture in one chunk per test, so `use.trace` keeps
    // working even though this context outlives every test
    editorContext: [async ({ browser, authState }, use) => {
        const context = await browser.newContext({ storageState: authState });
        await middleware(context);
        await use(context);
        await context.close();
    }, { scope: 'worker' }],

    context: async ({ editorContext }, use) => {
        await use(editorContext);
    },

    // the built-in page fixture leaves the close to the context, which now outlives the test
    page: async ({ context }, use) => {
        const page = await context.newPage();
        await use(page);
        await page.close();
    },

    project: [async ({ editorContext }, use) => {
        const page = await editorContext.newPage();
        await page.goto(editorBlankUrl());
        await page.locator(CMS).waitFor();
        await checkCookieAccept(page);
        const name = uniqueName('project');
        const id = await createProject(page, name);
        await page.goto(editorUrl(id, { disableBubbles: true }));
        await waitForEditor(page);
        const sceneId = parseInt(await page.evaluate(() => window.config.scene.id), 10);
        await use({ id, name, sceneId, page });
        await deleteProject(page, id);
        await page.close();
    }, { scope: 'worker', timeout: JOB_TEST_TIMEOUT }],

    // loading the editor is the most expensive thing in the suite, so the worker does it once
    // and every test is handed the same page through `editorPage`
    sharedEditor: [async ({ project }, use) => {
        const { page } = project;
        const base = await new EditorShell(page).baseline();
        await use({ page, base });
    }, { scope: 'worker' }],

    errors: [async ({ context }, use, testInfo) => {
        const errors = new ConsoleErrors();
        const log: string[] = [];

        // the context outlives the test, so the listeners have to come off with it
        const detach = attachConsoleCapture(context, errors, log);
        await use(errors);
        detach();
        await testInfo.attach('console.log', { body: log.join('\n'), contentType: 'text/plain' });
        expect(errors.unexpected, 'unexpected console errors').toEqual([]);
    }, { auto: true }],

    blankPage: async ({ page }, use) => {
        await page.goto(editorBlankUrl());
        await page.locator(CMS).waitFor();
        await checkCookieAccept(page);
        await use(page);
    },

    editorPage: async ({ sharedEditor }, use, testInfo) => {
        const { page, base } = sharedEditor;
        await new EditorShell(page).reset(base);
        await use(page);

        // a failed test can leave anything behind — a drag mid-flight, a modal `reset` knows
        // nothing about — so mark the page and let the next reset load it again
        base.dirty = testInfo.status !== testInfo.expectedStatus || testInfo.errors.length > 0;
    },

    codeEditorPage: async ({ context, project }, use) => {
        const page = await context.newPage();
        await page.goto(codeEditorUrl(project.id));
        await waitForCodeEditor(page);
        await use(page);
        await page.close();
    },

    openLaunch: async ({ context }, use) => {
        const opened: Page[] = [];
        await use(async (sceneId, params = {}) => {
            const page = await context.newPage();
            opened.push(page);
            await page.goto(launchSceneUrl(sceneId, params));
            await waitForLaunch(page);
            return page;
        });

        // the context outlives the test, so a launch page left open would keep on rendering
        await Promise.all(opened.filter(page => !page.isClosed()).map(page => page.close()));
    },

    collaborator: async ({ browser, errors }, use, testInfo) => {
        if (AUTH_STATES.length < 2) {
            await use(null);
            return;
        }

        // the account after this worker's own, so a collaborator is never the same user
        const next = (testInfo.parallelIndex + 1) % AUTH_STATES.length;
        const context = await browser.newContext({ storageState: AUTH_STATES[next] });
        await middleware(context);
        const log: string[] = [];
        const detach = attachConsoleCapture(context, errors, log);
        await use(context);
        await context.close();
        detach();
        await testInfo.attach('collaborator-console.log', { body: log.join('\n'), contentType: 'text/plain' });
    }
});

export { expect };
