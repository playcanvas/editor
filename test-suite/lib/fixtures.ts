import { test as base, expect, type BrowserContext, type BrowserContextOptions, type Page } from '@playwright/test';

import { checkCookieAccept, createProject, deleteProject } from './common';
import { AUTH_STATES, codeEditorUrl, editorBlankUrl, editorSceneUrl, editorUrl, launchSceneUrl, type SearchParams } from './config';
import { attachConsoleCapture, ConsoleErrors } from './console';
import { middleware } from './middleware';
import { waitForCodeEditor, waitForEditor, waitForLaunch } from './ready';
import { uniqueName } from './utils';

export type Project = { id: number; name: string; sceneId: number };
export type WorkerFixtures = { authState: BrowserContextOptions['storageState']; project: Project };
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

    storageState: async ({ authState }, use) => {
        await use(authState);
    },

    context: async ({ context }, use) => {
        await middleware(context);
        await use(context);
    },

    project: [async ({ browser, authState }, use) => {
        const context = await browser.newContext({ storageState: authState });
        await middleware(context);
        const page = await context.newPage();
        await page.goto(editorBlankUrl());
        await page.locator(CMS).waitFor();
        await checkCookieAccept(page);
        const name = uniqueName('project');
        const id = await createProject(page, name);
        await page.goto(editorUrl(id, { disableBubbles: true }));
        await waitForEditor(page);
        const sceneId = parseInt(await page.evaluate(() => window.config.scene.id), 10);
        await use({ id, name, sceneId });
        await page.goto(editorBlankUrl());
        await page.locator(CMS).waitFor();
        await deleteProject(page, id);
        await context.close();
    }, { scope: 'worker' }],

    errors: [async ({ context }, use, testInfo) => {
        const errors = new ConsoleErrors();
        const log: string[] = [];
        attachConsoleCapture(context, errors, log);
        await use(errors);
        await testInfo.attach('console.log', { body: log.join('\n'), contentType: 'text/plain' });
        expect(errors.unexpected, 'unexpected console errors').toEqual([]);
    }, { auto: true }],

    blankPage: async ({ page }, use) => {
        await page.goto(editorBlankUrl());
        await page.locator(CMS).waitFor();
        await checkCookieAccept(page);
        await use(page);
    },

    editorPage: async ({ page, project }, use) => {
        await page.goto(editorSceneUrl(project.sceneId, { disableBubbles: true }));
        await waitForEditor(page);
        await checkCookieAccept(page);
        await use(page);
    },

    codeEditorPage: async ({ context, project }, use) => {
        const page = await context.newPage();
        await page.goto(codeEditorUrl(project.id));
        await waitForCodeEditor(page);
        await use(page);
        await page.close();
    },

    openLaunch: async ({ context }, use) => {
        await use(async (sceneId, params = {}) => {
            const page = await context.newPage();
            await page.goto(launchSceneUrl(sceneId, params));
            await waitForLaunch(page);
            return page;
        });
    },

    collaborator: async ({ browser }, use, testInfo) => {
        if (AUTH_STATES.length < 2) {
            await use(null);
            return;
        }

        // the account after this worker's own, so a collaborator is never the same user
        const next = (testInfo.parallelIndex + 1) % AUTH_STATES.length;
        const context = await browser.newContext({ storageState: AUTH_STATES[next] });
        await middleware(context);
        await use(context);
        await context.close();
    }
});

export { expect };
