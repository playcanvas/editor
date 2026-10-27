import type { BrowserContext, Page } from '@playwright/test';

import { checkCookieAccept, createProject, deleteProject } from '../../lib/common';
import { editorBlankUrl } from '../../lib/config';
import { JOB_TEST_TIMEOUT, JOB_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { middleware } from '../../lib/middleware';
import { waitForEditor } from '../../lib/ready';
import { uniqueName } from '../../lib/utils';

// /editor is the projects home: it loads none of the scene editor, and each project opens in its own tab

/** a project's card or list row on the projects page, matched on its name */
const cmsRow = (page: Page, name: string) => page.locator(`.cms-list > :is(.cms-card, .cms-row):has(:text-is("${name}"))`);

/** the visible menu items of project settings */
const settingsMenus = (page: Page) => page.locator('.picker-project .left .ui-list > li:visible');

/** opens a project's settings from the projects page, then the project from them, in its own tab */
const openFromHome = async (home: Page, name: string) => {
    await cmsRow(home, name).click();
    const [editorTab] = await Promise.all([
        home.waitForEvent('popup'),
        home.locator('.cms-editor-button').click()
    ]);
    await waitForEditor(editorTab);
    return editorTab;
};

test.describe('projects home', () => {
    const projectName = uniqueName('ui-home');
    let context: BrowserContext;
    let setup: Page;
    let projectId: number;

    test.beforeAll(async ({ browser, authState }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        context = await browser.newContext({ storageState: authState });
        await middleware(context);
        setup = await context.newPage();
        await setup.goto(editorBlankUrl());
        await setup.locator('.picker-project-cms').waitFor();
        await checkCookieAccept(setup);
        projectId = await createProject(setup, projectName);
    });

    test.afterAll(async () => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        await deleteProject(setup, projectId);
        await context.close();
    });

    test('loads without the scene editor', async ({ blankPage }) => {
        await expect(blankPage.locator('.picker-project-cms')).toBeVisible();
        expect(await blankPage.evaluate(() => window.name)).toBe('editor:projects');
        expect(await blankPage.evaluate(() => typeof (window as any).pc)).toBe('undefined');
        await expect(blankPage.locator('#layout-toolbar, #layout-viewport, #layout-hierarchy')).toHaveCount(0);
    });

    test('opens a project in its own tab and switches back to it', async ({ blankPage }) => {
        const editorTab = await openFromHome(blankPage, projectName);
        try {
            expect(new URL(blankPage.url()).pathname).toBe('/editor');
            expect(await editorTab.evaluate(() => window.name)).toBe(`editor:${projectId}`);

            // a second Open editor finds the same tab by name instead of opening or reloading one
            const pages = blankPage.context().pages().length;
            await editorTab.evaluate(() => {
                (window as any).__stillOpen = true;
            });
            await blankPage.locator('.cms-editor-button').click();
            expect(await blankPage.evaluate(name => (window.open('', name) as any).__stillOpen, `editor:${projectId}`)).toBe(true);
            expect(blankPage.context().pages().length).toBe(pages);
        } finally {
            await editorTab.close();
        }
    });

    test('the editor switches to the projects tab it came from', async ({ blankPage }) => {
        const editorTab = await openFromHome(blankPage, projectName);
        try {
            await blankPage.evaluate(() => {
                (window as any).__stillOpen = true;
            });

            // Ctrl+O, All Projects and the breadcrumb all switch to the projects tab rather than covering the editor
            await editorTab.keyboard.press('ControlOrMeta+o');
            // the breadcrumb's first button is Projects; narrow windows show it as an icon only
            await editorTab.locator('.control-strip-crumbs .control-strip-btn').first().click();
            expect(await editorTab.evaluate(() => (window.open('', 'editor:projects') as any).__stillOpen)).toBe(true);
            await expect(editorTab.locator('.picker-project-cms')).toHaveCount(0);
            expect(new URL(blankPage.url()).pathname).toBe('/editor');
        } finally {
            await editorTab.close();
        }
    });

    test('project settings on the projects page', async ({ blankPage }) => {
        await cmsRow(blankPage, projectName).click();
        await expect(settingsMenus(blankPage)).toHaveText(['Project settings', 'Dev log', 'Team']);
        await expect(blankPage.locator('.cms-editor-button')).toBeVisible();
        await expect(blankPage.locator('.cms-play-button')).toBeVisible();
        await expect(blankPage.locator('#delete-project-button')).toBeVisible();
        await expect(blankPage.locator('.project-cms-button')).toHaveCount(0);

        // the owner can change the thumbnail straight away
        await expect(blankPage.locator('.picker-project .thumbnail-buttons')).toHaveCSS('opacity', '1');
    });

    test('project settings in the editor', async ({ editorPage }) => {
        await editorPage.evaluate(() => window.editor.call('picker:project', 'project-main'));
        await expect(settingsMenus(editorPage)).toHaveText([
            'Project settings',
            'Dev log',
            'Scenes',
            'Version control',
            'Builds & Publish',
            'Team'
        ]);
        await expect(editorPage.locator('.project-cms-button')).toBeVisible();
        await expect(editorPage.locator('.cms-editor-button, .cms-play-button, #delete-project-button')).toHaveCount(0);

        // the upload overlay shows over the thumbnail while project settings is open
        await expect(editorPage.locator('.picker-project .thumbnail-buttons')).toHaveCSS('opacity', '1');
        await editorPage.evaluate(() => window.editor.call('picker:project:close'));
    });

    test('new project starts from a kit', async ({ blankPage }) => {
        await blankPage.locator('.cms-side .cms-new').click();

        // empty first and picked, then the starter kit projects
        const kits = blankPage.locator('.picker-project-new .starter-kit:not(.skeleton)');
        await expect(kits.locator('h4').nth(0)).toHaveText('Empty Project');
        await expect(blankPage.locator('.picker-project-new .starter-kit.selected h4')).toHaveText('Empty Project');

        // picking another kit fills the form with its name
        const last = kits.last();
        const name = await last.locator('h4').innerText();
        await last.click();
        await expect(blankPage.locator('.picker-project-new .modal-new-project-form-content input[type="text"]').first()).toHaveValue(
            name
        );
        await blankPage.locator('.picker-project-new .pcui-button.close').click();
        await expect(blankPage.locator('.picker-project-new')).toBeHidden();
    });

    test('creates a project from a starter kit', async ({ blankPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const name = uniqueName('ui-kit');
        await blankPage.locator('.cms-side .cms-new').click();

        // wait for the kit list, then pick the first kit after empty
        const kits = blankPage.locator('.picker-project-new .starter-kit:not(.skeleton)');
        await expect(kits.first()).toBeVisible();
        test.skip((await kits.count()) < 2, 'this environment has no starter kits');
        await kits.nth(1).click();
        await blankPage.locator('.picker-project-new .modal-new-project-form-content input[type="text"]').first().fill(name);

        // the kit forks its project; the fork job's data names the new project
        const created = blankPage.waitForResponse(res => res.request().method() === 'POST' && res.url().endsWith('/api/projects'));
        const job = blankPage.waitForResponse(res => /\/api\/jobs\/\d+$/.test(res.url()), { timeout: JOB_TIMEOUT });
        await blankPage.locator('.picker-project-new .create-btn-container .pm-button.primary').click();
        expect((await created).request().postDataJSON().fork_from).toBeGreaterThan(0);

        const forked: number = (await (await job).json()).data?.forked_id;
        expect(forked).toBeTruthy();
        try {
            await expect(blankPage.getByRole('button', { name: 'Not now' })).toBeVisible();
            await blankPage.getByRole('button', { name: 'Not now' }).click();
            await expect(cmsRow(blankPage, name)).toBeVisible({ timeout: JOB_TIMEOUT });
        } finally {
            await deleteProject(setup, forked);
        }
    });

    test('fork in the editor has no kit grid', async ({ editorPage }) => {
        const id = await editorPage.evaluate(() => window.config.project.id);
        await editorPage.evaluate(projectId => window.editor.call('picker:project:fork', { id: projectId }), id);
        await expect(editorPage.locator('.picker-project-new.fork')).toBeVisible();
        await expect(editorPage.locator('.picker-project-new .starter-kit')).toHaveCount(0);
        await editorPage.locator('.picker-project-new .pcui-button.close').click();
        await expect(editorPage.locator('.picker-project-new')).toBeHidden();
    });
});
