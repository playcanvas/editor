import { statSync } from 'fs';
import { execFile } from 'node:child_process';
import { resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import { tmpdir } from 'os';

import type { BrowserContext, Frame, Locator, Page } from '@playwright/test';

import {
    checkCookieAccept,
    createProject,
    deleteProject,
    deleteProjects
} from '../../lib/common';
import { editorBlankUrl, editorSceneUrl, editorUrl } from '../../lib/config';
import { JOB_TEST_TIMEOUT, JOB_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { middleware } from '../../lib/middleware';
import { AssetsPanel } from '../../lib/pages/assets';
import { buildArtifact, closeBuilds, deleteBuild, openBuilds, startBuild } from '../../lib/pages/builds';
import { EditorShell } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { waitForCodeEditor, waitForEditor, waitForLaunch } from '../../lib/ready';
import { uniqueName } from '../../lib/utils';

const TICKED = /pcui-boolean-input-ticked/;

// the full version/type/device and classic/esm matrices live in test/api/basic.test.ts; these
// copies exist for the settings, launch-option and builds ui, which one combo exercises
const LAUNCH_COMBO = { version: 'current', type: 'debug', device: 'webgl2' };
const BUILD_SCRIPTS = 'classic';
const DELIVERY_PARENT = 'Delivery Parent';
const DELIVERY_BOX = 'Delivery Box';
const DELIVERY_MATERIAL = 'Delivery Material';
const DOWNLOAD_ORIGIN = 'http://download.test';

/** Populates delivery projects with a hierarchy and an asset reference to preserve. */
const populate = async (page: Page) => {
    const material = await new AssetsPanel(page).create('createMaterial', {
        name: DELIVERY_MATERIAL,
        data: { diffuse: [1, 0, 0] }
    });
    const hierarchy = new HierarchyPanel(page);
    const parent = await hierarchy.createEntity({ name: DELIVERY_PARENT });
    await hierarchy.createEntity({
        name: DELIVERY_BOX,
        parent,
        components: { render: { type: 'box', materialAssets: [material.id] } }
    });
    await new EditorShell(page).flushScene();
};

/** Checks the delivered scene, hierarchy and resolved material inside the running app. */
const verifyDelivery = async (page: Page | Frame) => {
    await waitForLaunch(page);
    expect(await page.evaluate((box) => {
        const entity = (window as any).pc.app.root.findByName(box);
        const material = entity?.render?.meshInstances[0]?.material;
        return {
            parent: entity?.parent?.name,
            type: entity?.render?.type,
            color: material ? [material.diffuse.r, material.diffuse.g, material.diffuse.b] : null
        };
    }, DELIVERY_BOX)).toEqual({ parent: DELIVERY_PARENT, type: 'box', color: [1, 0, 0] });
};

// three .picker-modal-confirmation modals sit in the dom from load, so match the button by name
// and by role, which never binds a hidden node
const continueBrowsing = (page: Page) => page.getByRole('button', { name: 'Continue Browsing' });

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
    test.describe.configure({ mode: 'serial' });

    const projectName = uniqueName('ui-project');

    test('create project', async ({ blankPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);

        await blankPage.locator('.new-project-button').click();
        await blankPage.locator('.modal-new-project-form-content input[type="text"]').first().fill(projectName);

        const created = blankPage.waitForResponse(res => res.request().method() === 'POST' && res.url().endsWith('/api/projects'));
        await blankPage.locator('.picker-project-new .create-btn').click();
        expect((await created).status()).toBe(201);

        // the dialog subscribes to messenger project.create only after a follow-up projects/<id>
        // GET, so the message can beat it and the confirmation modal then never opens; the cms
        // refreshes its list off the same message from a listener bound at load, so that is the
        // signal the create landed
        await expect(cmsRow(blankPage, projectName)).toBeVisible({ timeout: JOB_TIMEOUT });

        // the refreshed row proves the message was delivered, so the modal has settled by now
        if (await continueBrowsing(blankPage).isVisible()) {
            await continueBrowsing(blankPage).click();
            await expect(continueBrowsing(blankPage)).toBeHidden();
        }
    });

    // FIXME: Forking not supported in Editor UI

    test('delete project', async ({ blankPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);

        await cmsRow(blankPage, projectName).click();
        await deleteOpenProject(blankPage, projectName);
        await expect(cmsRow(blankPage, projectName)).toHaveCount(0, { timeout: JOB_TIMEOUT });
    });
});

test.describe('export/import', () => {
    test.describe.configure({ mode: 'serial' });

    const projectName = uniqueName('ui-export');
    const exportPath = `${tmpdir()}/${uniqueName('exported-project')}.zip`;
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
        await setup.goto(editorUrl(projectId, { disableBubbles: true }));
        await waitForEditor(setup);
        await populate(setup);
    });

    test.afterAll(async () => {
        test.setTimeout(JOB_TEST_TIMEOUT);

        // the ui can delete either copy; resolve this run's exact name to the surviving ids
        const ids = await setup.evaluate(async (name) => {
            const res: any = await window.editor.api.globals.rest.users.userProjects(window.config.self.id, '').promisify();
            return (res.result ?? []).filter((project: any) => project.name === name).map((project: any) => Number(project.id)) as number[];
        }, projectName);
        await deleteProjects(setup, ids);
        await context.close();
    });

    test('export project', async ({ blankPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);

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
        test.setTimeout(JOB_TEST_TIMEOUT);

        // import project
        const fileChooserPromise = blankPage.waitForEvent('filechooser');
        await blankPage.locator('.import-project-button').click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(exportPath);

        // the import ends in the same confirmation modal as a create
        await continueBrowsing(blankPage).click({ timeout: JOB_TEST_TIMEOUT });

        // the import keeps the exported name, so the cms now lists it twice
        await expect(cmsRow(blankPage, projectName)).toHaveCount(2, { timeout: JOB_TEST_TIMEOUT });

        const imported = await blankPage.evaluate(async ({ name, source }) => {
            const res: any = await window.editor.api.globals.rest.users.userProjects(window.config.self.id, '').promisify();
            return Number(res.result.find((project: any) => project.name === name && Number(project.id) !== source)?.id);
        }, { name: projectName, source: projectId });
        expect(imported).toBeGreaterThan(0);
        await blankPage.goto(editorUrl(imported, { disableBubbles: true }));
        await waitForEditor(blankPage);
        const hierarchy = new HierarchyPanel(blankPage);
        await expect(hierarchy.childRow(DELIVERY_PARENT, DELIVERY_BOX)).toHaveCount(1);

        const [launch] = await Promise.all([
            blankPage.waitForEvent('popup'),
            blankPage.locator('.control-strip.top-right > .launch > .control-strip-btn').click()
        ]);
        await verifyDelivery(launch);
        await launch.close();
    });

    test('delete imported project', async ({ blankPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);

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
        test.setTimeout(JOB_TEST_TIMEOUT);
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
        test.setTimeout(JOB_TEST_TIMEOUT);
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

    const { version, type, device } = LAUNCH_COMBO;
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
});

test.describe('publish/download', () => {
    test.describe.configure({ mode: 'serial' });

    const projectName = uniqueName('ui-apps');
    let context: BrowserContext;
    let setup: Page;
    let projectId: number;
    let sceneId: number;

    test.beforeAll(async ({ browser, authState }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
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
        await populate(setup);
    });

    test.afterAll(async () => {
        test.setTimeout(JOB_TEST_TIMEOUT);
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

    test(`download app (scripts: ${BUILD_SCRIPTS})`, async ({ page }, testInfo) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
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
        const archive = testInfo.outputPath('app.zip');
        await download.saveAs(archive);
        const appPage = await page.context().newPage();
        const directory = testInfo.outputPath('app');
        await promisify(execFile)('unzip', ['-q', archive, '-d', directory]);
        await appPage.route(`${DOWNLOAD_ORIGIN}/**`, async (route) => {
            const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
            const file = resolve(directory, `.${pathname === '/' ? '/index.html' : pathname}`);
            if (!file.startsWith(`${resolve(directory)}${sep}`)) {
                await route.abort();
                return;
            }
            await route.fulfill({ path: file });
        });
        await appPage.goto(DOWNLOAD_ORIGIN);
        await verifyDelivery(appPage);
        await appPage.close();

        // delete the build so a rerun starts with an empty download history
        await deleteBuild(page, 'download');
        await closeBuilds(page);
    });

    test('preserve build options when switching download formats', async ({ page }) => {
        await open(page);
        await openBuilds(page);
        const scenes = page.waitForResponse(/\/api\/projects\/\d+\/scenes/);
        await page.locator('.builds-toolbar > .download').click();
        await scenes;
        const form = page.locator('.picker-publish-new');
        const dropdown = form.locator('.download-format-dropdown');
        const options = form.locator('.options').filter({ has: page.getByText('Options', { exact: true }) });
        const sourcemaps = options.locator('.field').filter({ hasText: 'Generate Source Maps' }).locator('.pcui-boolean-input');
        await setTick(sourcemaps, true);

        await dropdown.locator('.pcui-select-input-value').click();
        await dropdown.locator('[id="npm"]').click();
        await expect(options).toBeHidden();
        await expect(form.locator('.web-download')).not.toHaveClass(/pcui-disabled/);

        await dropdown.locator('.pcui-select-input-value').click();
        const lens = dropdown.locator('[id="web_lens"]');
        if (await page.evaluate(() => !!window.config.self.flags.superUser)) {
            await expect(lens).toBeVisible();
            await lens.click();
            await expect(options).toBeVisible();
            await expect(sourcemaps).toHaveClass(TICKED);
            await dropdown.locator('.pcui-select-input-value').click();
        } else {
            await expect(lens).toHaveCount(0);
        }
        await dropdown.locator('[id="static"]').click();
        await expect(options).toBeVisible();
        await expect(sourcemaps).toHaveClass(TICKED);
        await page.keyboard.press('Escape');
        await expect(form).toBeHidden();
    });

    test(`publish app (scripts: ${BUILD_SCRIPTS})`, async ({ page }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        await open(page);

        await openBuilds(page);
        await startBuild(page, 'publish');

        // launch app
        const [appPage] = await Promise.all([
            page.waitForEvent('popup'),
            buildArtifact(page, 'publish').click()
        ]);
        const iframe = await appPage.locator('iframe').elementHandle();
        const frame = await iframe!.contentFrame();
        expect(frame).not.toBeNull();
        await verifyDelivery(frame!);
        expect(appPage.url()).toMatch(/\/b\//);
        await appPage.close();

        // delete app
        await deleteBuild(page, 'publish');
        await closeBuilds(page);
    });
});
