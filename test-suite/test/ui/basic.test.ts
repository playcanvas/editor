import { statSync } from 'fs';
import { tmpdir } from 'os';

import type { BrowserContext, Locator, Page } from '@playwright/test';

import {
    checkCookieAccept,
    createEsmScript,
    createProject,
    deleteProject,
    deleteProjectsByPrefix
} from '../../lib/common';
import { editorBlankUrl, editorSceneUrl, editorUrl } from '../../lib/config';
import { JOB_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { middleware } from '../../lib/middleware';
import { buildArtifact, closeBuilds, deleteBuild, openBuilds, startBuild } from '../../lib/pages/builds';
import { EditorShell } from '../../lib/pages/common';
import { waitForCodeEditor, waitForEditor, waitForLaunch } from '../../lib/ready';
import { uniqueName } from '../../lib/utils';

const BUILD_TIMEOUT = 4 * 60_000;
const TICKED = /pcui-boolean-input-ticked/;

test.describe.configure({
    mode: 'serial'
});

// three modals share the .picker-modal-confirmation class, so match the button text
const continueBrowsing = (page: Page) => page.locator('.picker-modal-confirmation .positive-action-button').filter({ hasText: 'Continue Browsing' });

/** the cms grid row of a project, matched on its name label */
const cmsRow = (page: Page, name: string) => page.locator(`.project-container:has(.project-name:text-is("${name}"))`);

/** delete the project whose dialog is open in the cms */
const deleteOpenProject = async (page: Page, name: string) => {
    await page.locator('#delete-project-button').click();
    await page.locator('.picker-delete-project .form-group--input input').fill(name);
    await page.locator('.picker-delete-project .delete-project-button').click();
};

/** drive a pcui boolean input to a known state */
const setTick = async (input: Locator, value: boolean) => {
    if (await input.evaluate(el => el.classList.contains('pcui-boolean-input-ticked')) !== value) {
        await input.click();
    }
    if (value) {
        await expect(input).toHaveClass(TICKED);
    } else {
        await expect(input).not.toHaveClass(TICKED);
    }
};

test.describe('create/delete', () => {
    const projectName = uniqueName('ui-project');

    test('create project', async ({ blankPage }) => {
        test.setTimeout(JOB_TIMEOUT);

        await blankPage.locator('.new-project-button').click();
        await blankPage.locator('.modal-new-project-form-content input[type="text"]').first().fill(projectName);
        await blankPage.locator('.picker-project-new .create-btn').click();

        // creation ends in a confirmation modal; keep browsing the cms
        await continueBrowsing(blankPage).click();
        await expect(cmsRow(blankPage, projectName)).toBeVisible({ timeout: JOB_TIMEOUT });
    });

    // FIXME: Forking not supported in Editor UI

    test('delete project', async ({ blankPage }) => {
        await cmsRow(blankPage, projectName).click();
        await deleteOpenProject(blankPage, projectName);
        await expect(cmsRow(blankPage, projectName)).toHaveCount(0, { timeout: JOB_TIMEOUT });
    });
});

test.describe('export/import', () => {
    const projectName = uniqueName('ui-export');
    const exportPath = `${tmpdir()}/${uniqueName('exported-project')}.zip`;
    let context: BrowserContext;
    let setup: Page;
    let projectId: number;

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

        // open project dialog
        await cmsRow(blankPage, projectName).click();

        // save export project
        const downloadPagePromise = blankPage.waitForEvent('popup');
        const downloadPromise = blankPage.waitForEvent('download');
        await blankPage.getByRole('button', { name: /Export Project/ }).click();
        await downloadPagePromise;
        const download = await downloadPromise;
        await download.saveAs(exportPath);

        expect(statSync(exportPath).size).toBeGreaterThan(0);
        expect(projectId).toBeGreaterThan(0);
    });

    test('import project', async ({ blankPage }) => {
        test.setTimeout(BUILD_TIMEOUT);

        // import project
        const fileChooserPromise = blankPage.waitForEvent('filechooser');
        await blankPage.locator('.import-project-button').click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(exportPath);

        // the import ends in the same confirmation modal as a create
        await continueBrowsing(blankPage).click({ timeout: BUILD_TIMEOUT });

        // the import keeps the exported name, so the cms now lists it twice
        await expect(cmsRow(blankPage, projectName)).toHaveCount(2, { timeout: BUILD_TIMEOUT });
    });

    test('delete imported project', async ({ blankPage }) => {
        test.setTimeout(BUILD_TIMEOUT);

        await expect(cmsRow(blankPage, projectName)).toHaveCount(2);
        await cmsRow(blankPage, projectName).first().click();
        await deleteOpenProject(blankPage, projectName);
        await expect(cmsRow(blankPage, projectName)).toHaveCount(1, { timeout: JOB_TIMEOUT });
    });
});

test.describe('navigation', () => {
    const projectName = uniqueName('ui-nav');
    let context: BrowserContext;
    let setup: Page;
    let projectId: number;
    let sceneId: number;
    let engineVersions: typeof window.config.engineVersions;
    let webgpuLabel: string;

    test.beforeAll(async ({ browser, authState }) => {
        context = await browser.newContext({ storageState: authState });
        await middleware(context);
        setup = await context.newPage();
        await setup.goto(editorBlankUrl());
        await setup.locator('.picker-project-cms').waitFor();
        await checkCookieAccept(setup);
        projectId = await createProject(setup, projectName);

        // the launcher matrix needs the scene, the engine versions and the
        // rendering label, which carries a "(beta)" suffix on engine v1 projects
        await setup.goto(editorUrl(projectId, { disableBubbles: true }));
        await waitForEditor(setup);
        sceneId = parseInt(await setup.evaluate(() => window.config.scene.id), 10);
        engineVersions = await setup.evaluate(() => window.config.engineVersions);
        webgpuLabel = await setup.evaluate(() => {
            return `Enable WebGPU${(window.config.project.settings as any)?.engineV2 ? '' : ' (beta)'}`;
        });
    });

    test.afterAll(async () => {
        await deleteProject(setup, projectId);
        await context.close();
    });

    const openEditor = async (page: Page) => {
        await page.goto(editorSceneUrl(sceneId, { disableBubbles: true }));
        await waitForEditor(page);
    };

    /** open the settings inspector and unfold its RENDERING section */
    const openSettings = async (page: Page, shell: EditorShell) => {
        await shell.openLogoMenu('Settings');
        const settings = page.locator('#layout-attributes .pcui-container.settings');
        await expect(settings).toBeVisible();
        const webgpu = shell.labelGroup(settings, webgpuLabel).locator('.pcui-boolean-input');
        if (!await webgpu.isVisible()) {
            await settings.getByText('RENDERING', { exact: true }).click();
        }
        await expect(webgpu).toBeVisible();
        return settings;
    };

    test('goto editor', async ({ blankPage }) => {
        await cmsRow(blankPage, projectName).click();
        await blankPage.locator('.cms-editor-button').click();
        await waitForEditor(blankPage);

        expect(await blankPage.evaluate(() => window.config.project.id)).toBe(projectId);
        expect(await blankPage.evaluate(() => parseInt(window.config.scene.id, 10))).toBe(sceneId);
    });

    test('goto code editor', async ({ page }) => {
        await openEditor(page);

        const [codePage] = await Promise.all([
            page.waitForEvent('popup'),
            new EditorShell(page).openLogoMenu('Code Editor')
        ]);
        await waitForCodeEditor(codePage);
        await expect(codePage.locator('#ui-left')).toBeVisible();
        expect(await codePage.evaluate(() => window.config.project.id)).toBe(projectId);
        await codePage.close();
    });

    test('open settings', async ({ page }) => {
        await openEditor(page);

        const shell = new EditorShell(page);
        const settings = await openSettings(page, shell);
        await expect(settings.locator('.settings-engine-version')).toBeVisible();
        await expect(shell.labelGroup(settings, 'Enable WebGL 2.0')).toBeVisible();
    });

    for (const version of ['current', 'previous', 'releaseCandidate'] as const) {
        for (const type of ['debug', 'profiler', 'release'] as const) {
            for (const device of ['webgpu', 'webgl2'] as const) {
                test(`goto launcher (version: ${version}, type: ${type}, device: ${device})`, { tag: '@slow' }, async ({ page }) => {
                    const engine = engineVersions[version];
                    test.skip(!engine, `no ${version} engine version available`);

                    await openEditor(page);
                    const shell = new EditorShell(page);
                    const settings = await openSettings(page, shell);

                    // select version
                    const select = settings.locator('.settings-engine-version');
                    await select.locator('.pcui-select-input-value').click();
                    await select.locator(`.pcui-select-input-list [id="${version}"]`).click();

                    // select device — the launch button follows the project device order
                    await setTick(shell.labelGroup(settings, webgpuLabel).locator('.pcui-boolean-input'), device === 'webgpu');
                    await setTick(shell.labelGroup(settings, 'Enable WebGL 2.0').locator('.pcui-boolean-input'), device === 'webgl2');

                    // select type — the launch options reveal on hover
                    const launch = page.locator('.control-strip.top-right > .launch > .control-strip-btn');
                    await launch.hover();
                    await setTick(page.locator('.launch-option-debug .pcui-boolean-input'), type === 'debug');
                    await setTick(page.locator('.launch-option-profiler .pcui-boolean-input'), type === 'profiler');

                    // launch page
                    const [launchPage] = await Promise.all([
                        page.waitForEvent('popup'),
                        launch.click()
                    ]);
                    await waitForLaunch(launchPage);

                    const url = new URL(launchPage.url());
                    expect(url.pathname).toContain(String(sceneId));
                    expect(url.searchParams.get('debug')).toBe(type === 'debug' ? 'true' : null);
                    expect(url.searchParams.get('profile')).toBe(type === 'profiler' ? 'true' : null);
                    expect(url.searchParams.get('version')).toBe(version === 'current' ? null : engine.version);
                    expect(await launchPage.evaluate(() => (window as any).pc.app.graphicsDevice.deviceType)).toBe(device);
                    await launchPage.close();
                });
            }
        }
    }
});

test.describe('publish/download', () => {
    const projectName = uniqueName('ui-apps');
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

    test('goto editor', async ({ page }) => {
        await open(page);
        expect(await page.evaluate(() => window.config.project.id)).toBe(projectId);
    });

    for (const scripts of ['classic', 'esm'] as const) {
        if (scripts === 'esm') {
            test('create ESM script', async ({ page }) => {
                test.setTimeout(BUILD_TIMEOUT);
                await open(page);

                const assetId = await createEsmScript(page, 'test-esm.mjs');
                expect(assetId).toBeGreaterThan(0);
            });
        }

        test(`download app (scripts: ${scripts})`, async ({ page }) => {
            test.setTimeout(BUILD_TIMEOUT);
            await open(page);

            await openBuilds(page);
            await startBuild(page, 'download');

            // download artifact link
            const downloadPagePromise = page.waitForEvent('popup');
            const downloadPromise = page.waitForEvent('download');
            await buildArtifact(page, 'download').click();
            await downloadPagePromise;
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toMatch(/\.zip$/);

            // delete build so the next iteration starts with an empty download history
            await deleteBuild(page, 'download');
            await closeBuilds(page);
        });

        test(`publish app (scripts: ${scripts})`, async ({ page }) => {
            test.setTimeout(BUILD_TIMEOUT);
            await open(page);

            await openBuilds(page);
            await startBuild(page, 'publish');

            // launch app
            const [appPage] = await Promise.all([
                page.waitForEvent('popup'),
                buildArtifact(page, 'publish').click()
            ]);
            await appPage.waitForLoadState();
            expect(appPage.url()).toMatch(/\/b\//);
            await appPage.close();

            // delete app
            await deleteBuild(page, 'publish');
            await closeBuilds(page);
        });
    }
});
