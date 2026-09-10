import { statSync } from 'fs';
import { tmpdir } from 'os';

import type { BrowserContext, Page } from '@playwright/test';

import {
    checkCookieAccept,
    createEsmScript,
    createProject,
    deleteApp,
    deleteProject,
    deleteProjectsByPrefix,
    downloadApp,
    exportProject,
    importProject,
    publishApp
} from '../../lib/common';
import { codeEditorUrl, editorBlankUrl, editorSceneUrl, editorUrl } from '../../lib/config';
import { JOB_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { middleware } from '../../lib/middleware';
import { waitForCodeEditor, waitForEditor } from '../../lib/ready';
import { uniqueName } from '../../lib/utils';

const BUILD_TIMEOUT = 4 * 60_000;

test.describe.configure({
    mode: 'serial'
});

/** ids of every project owned by the current user */
const projectIds = (page: Page) => page.evaluate(async () => {
    const res: any = await window.editor.api.globals.rest.users.userProjects(window.config.self.id, '').promisify();
    return (res.result ?? []).map((project: any) => project.id as number);
});

test.describe('create/delete', () => {
    const projectName = uniqueName('api-project');
    const forkedProjectName = uniqueName('api-project');
    let projectId: number;
    let forkedProjectId: number;

    test('create project', async ({ blankPage }) => {
        projectId = await createProject(blankPage, projectName);
        expect(projectId).toBeGreaterThan(0);
        expect(await projectIds(blankPage)).toContain(projectId);
    });

    test('fork project', async ({ blankPage }) => {
        test.setTimeout(BUILD_TIMEOUT);
        forkedProjectId = await createProject(blankPage, forkedProjectName, projectId);
        expect(forkedProjectId).not.toBe(projectId);
        expect(await projectIds(blankPage)).toContain(forkedProjectId);
    });

    test('delete forked project', async ({ blankPage }) => {
        await deleteProject(blankPage, forkedProjectId);
        await expect.poll(() => projectIds(blankPage)).not.toContain(forkedProjectId);
    });

    test('delete project', async ({ blankPage }) => {
        await deleteProject(blankPage, projectId);
        await expect.poll(() => projectIds(blankPage)).not.toContain(projectId);
    });
});

test.describe('export/import', () => {
    const projectName = uniqueName('api-export');
    const exportPath = `${tmpdir()}/${uniqueName('exported-project')}.zip`;
    let context: BrowserContext;
    let setup: Page;
    let projectId: number;
    let importedProjectId: number;

    test.beforeAll(async ({ browser, authState }) => {
        context = await browser.newContext({ storageState: authState });
        await middleware(context);
        setup = await context.newPage();
        await setup.goto(editorBlankUrl());
        await setup.locator('.picker-project-cms').waitFor();
        await checkCookieAccept(setup);
        projectId = await createProject(setup, projectName);
    });

    test.afterAll(async () => {
        // the import copies the name, so clear both projects by prefix
        test.setTimeout(JOB_TIMEOUT);
        await deleteProjectsByPrefix(setup, projectName);
        await context.close();
    });

    test('export project', async ({ blankPage }) => {
        test.setTimeout(BUILD_TIMEOUT);
        const downloadPromise = blankPage.waitForEvent('download');
        await exportProject(blankPage, projectId);
        const download = await downloadPromise;
        await download.saveAs(exportPath);
        expect(statSync(exportPath).size).toBeGreaterThan(0);
    });

    test('import project', async ({ blankPage }) => {
        test.setTimeout(BUILD_TIMEOUT);
        importedProjectId = await importProject(blankPage, exportPath);
        expect(importedProjectId).toBeGreaterThan(0);
        expect(importedProjectId).not.toBe(projectId);
        expect(await projectIds(blankPage)).toContain(importedProjectId);
    });

    test('delete imported project', async ({ blankPage }) => {
        await deleteProject(blankPage, importedProjectId);
        await expect.poll(() => projectIds(blankPage)).not.toContain(importedProjectId);
    });
});

test.describe('navigation', () => {
    const projectName = uniqueName('api-nav');
    let context: BrowserContext;
    let setup: Page;
    let projectId: number;
    let sceneId: number;
    let engineVersions: typeof window.config.engineVersions;

    test.beforeAll(async ({ browser, authState }) => {
        context = await browser.newContext({ storageState: authState });
        await middleware(context);
        setup = await context.newPage();
        await setup.goto(editorBlankUrl());
        await setup.locator('.picker-project-cms').waitFor();
        await checkCookieAccept(setup);
        projectId = await createProject(setup, projectName);

        // the launcher matrix needs the scene and the engine versions the project offers
        await setup.goto(editorUrl(projectId, { disableBubbles: true }));
        await waitForEditor(setup);
        sceneId = parseInt(await setup.evaluate(() => window.config.scene.id), 10);
        engineVersions = await setup.evaluate(() => window.config.engineVersions);
    });

    test.afterAll(async () => {
        await deleteProject(setup, projectId);
        await context.close();
    });

    test('goto editor', async ({ page }) => {
        await page.goto(editorUrl(projectId, { disableBubbles: true }));
        await waitForEditor(page);
        expect(await page.evaluate(() => window.config.project.id)).toBe(projectId);
        expect(await page.evaluate(() => parseInt(window.config.scene.id, 10))).toBe(sceneId);
    });

    test('goto code editor', async ({ page }) => {
        await page.goto(codeEditorUrl(projectId));
        await waitForCodeEditor(page);
        await expect(page.locator('#ui-left')).toBeVisible();
        expect(await page.evaluate(() => window.config.project.id)).toBe(projectId);
    });

    for (const version of ['current', 'previous', 'releaseCandidate'] as const) {
        for (const type of ['debug', 'profiler', 'release'] as const) {
            for (const device of ['webgpu', 'webgl2'] as const) {
                test(`goto launcher (version: ${version}, type: ${type}, device: ${device})`, { tag: '@slow' }, async ({ openLaunch }) => {
                    const engine = engineVersions[version];
                    test.skip(!engine, `no ${version} engine version available`);

                    const args: Record<string, string> = { device, version: engine.version };
                    if (type === 'debug') {
                        args.debug = 'true';
                    }
                    if (type === 'profiler') {
                        args.profile = 'true';
                    }

                    const launch = await openLaunch(sceneId, args);
                    expect(await launch.evaluate(() => (window as any).pc.app.frame)).toBeGreaterThan(0);
                });
            }
        }
    }
});

test.describe('publish/download', () => {
    const projectName = uniqueName('api-apps');
    let context: BrowserContext;
    let setup: Page;
    let projectId: number;
    let sceneId: number;

    test.beforeAll(async ({ browser, authState }) => {
        context = await browser.newContext({ storageState: authState });
        await middleware(context);
        setup = await context.newPage();
        await setup.goto(editorBlankUrl());
        await setup.locator('.picker-project-cms').waitFor();
        await checkCookieAccept(setup);
        projectId = await createProject(setup, projectName);

        await setup.goto(editorUrl(projectId, { disableBubbles: true }));
        await waitForEditor(setup);
        sceneId = parseInt(await setup.evaluate(() => window.config.scene.id), 10);
    });

    test.afterAll(async () => {
        await deleteProject(setup, projectId);
        await context.close();
    });

    const open = async (page: Page) => {
        await page.goto(editorSceneUrl(sceneId, { disableBubbles: true }));
        await waitForEditor(page);
    };

    const appIds = (page: Page) => page.evaluate(async () => {
        const res: any = await window.editor.api.globals.rest.projects.projectApps().promisify();
        return (res.result ?? []).map((app: any) => app.id as number);
    });

    test('goto editor', async ({ page }) => {
        await open(page);
        expect(await page.evaluate(() => window.config.project.id)).toBe(projectId);
    });

    for (const scripts of ['classic', 'esm'] as const) {
        if (scripts === 'esm') {
            test('create ESM script', async ({ page }) => {
                await open(page);
                const assetId = await createEsmScript(page, 'test-esm.mjs');
                expect(assetId).toBeGreaterThan(0);
                expect(await page.evaluate((id) => {
                    return window.editor.api.globals.assets.get(id)?.get('type');
                }, assetId)).toBe('script');
            });
        }

        test(`download app (scripts: ${scripts})`, async ({ page }) => {
            test.setTimeout(BUILD_TIMEOUT);
            await open(page);

            const job = await downloadApp(page, sceneId);
            expect(job.download_url).toMatch(/^https?:\/\//);
        });

        test(`publish app (scripts: ${scripts})`, async ({ page }) => {
            test.setTimeout(BUILD_TIMEOUT);
            await open(page);

            // publish app
            const app = await publishApp(page, sceneId);
            expect(app.url).toMatch(/^https?:\/\//);
            expect(await appIds(page)).toContain(app.id);

            // the published build is served from its own host, so assert it responds
            const res = await page.goto(app.url);
            expect(res?.status()).toBe(200);

            // delete app
            await open(page);
            await deleteApp(page, app.id);
            await expect.poll(() => appIds(page)).not.toContain(app.id);
        });
    }
});
