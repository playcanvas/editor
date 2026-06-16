import { tmpdir } from 'os';

import { expect, test, type Page } from '@playwright/test';

import { capture } from '../../lib/capture';
import {
    checkCookieAccept,
    createEsmScript,
    createProject,
    deleteProject
} from '../../lib/common';
import { editorBlankUrl, editorUrl } from '../../lib/config';
import { middleware } from '../../lib/middleware';
import { uniqueName } from '../../lib/utils';

test.describe.configure({
    mode: 'serial'
});

test.describe('create/delete', () => {
    const projectName = uniqueName('ui-project');
    let page: Page;

    test.describe.configure({
        mode: 'serial'
    });

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await middleware(page.context());
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('create project', async () => {
        expect(await capture('create-project', page, async () => {
            await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
            await checkCookieAccept(page);

            // create project
            await page.getByRole('button', { name: 'NEW PROJECT' }).click();
            await page.locator('.modal-new-project-form-content input[type="text"]').first().fill(projectName);
            await page.getByRole('button', { name: 'CREATE' }).click();

            // continue browsing
            await page.getByRole('button', { name: 'Continue browsing' }).click();
        })).toStrictEqual([]);
    });

    // FIXME: Forking not supported in Editor UI

    test('delete project', async () => {
        expect(await capture('delete-project', page, async () => {
            await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
            await page.getByText(projectName).first().click();
            await page.getByRole('button', { name: 'DELETE PROJECT' }).click();
            await page.getByRole('textbox').nth(4).fill(projectName);
            await page.getByRole('button', { name: 'DELETE', exact: true }).click();
        })).toStrictEqual([]);
    });
});

test.describe('export/import', () => {
    const projectName = uniqueName('api-export');
    const exportPath = `${tmpdir()}/${uniqueName('exported-project')}.zip`;
    let projectId: number;
    let page: Page;

    test.describe.configure({
        mode: 'serial'
    });

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await middleware(page.context());

        // create a temporary project
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await checkCookieAccept(page);
        projectId = await createProject(page, projectName);
    });

    test.afterAll(async () => {
        // delete temporary project
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await deleteProject(page, projectId);

        await page.close();
    });

    test('export project', async () => {
        test.setTimeout(4 * 60 * 1000);
        expect(await capture('export-project', page, async () => {
            // open project dialog
            await page.getByText(projectName).first().click();

            // save export project
            const downloadPagePromise = page.waitForEvent('popup');
            const downloadPromise = page.waitForEvent('download');
            await page.getByRole('button', { name: 'EXPORT PROJECT' }).click();
            await downloadPagePromise;
            const download = await downloadPromise;
            await download.saveAs(exportPath);
        })).toStrictEqual([]);
    });

    test('import project', async () => {
        test.setTimeout(4 * 60 * 1000);
        expect(await capture('import-project', page, async () => {
            // close project dialog
            const close = page.locator('.picker-project .close');
            await close.waitFor({ state: 'visible' });
            await close.click();

            // import project
            const fileChooserPromise = page.waitForEvent('filechooser');
            const upload = page.getByRole('button', { name: '', exact: true }).click();
            const fileChooser = await fileChooserPromise;
            await fileChooser.setFiles(exportPath);
            await upload;

            // continue browsing
            await page.getByRole('button', { name: 'Continue browsing' }).click();
        })).toStrictEqual([]);
    });

    test('delete imported project', async () => {
        expect(await capture('delete-imported-project', page, async () => {
            await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
            await page.getByText(projectName).first().click();
            await page.getByRole('button', { name: 'DELETE PROJECT' }).click();
            await page.getByRole('textbox').nth(4).fill(projectName);
            await page.getByRole('button', { name: 'DELETE', exact: true }).click();
        })).toStrictEqual([]);
    });
});

test.describe('navigation', () => {
    const projectName = uniqueName('ui-nav');
    let projectId: number;
    let sceneId: number;
    let page: Page;

    test.describe.configure({
        mode: 'serial'
    });

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await middleware(page.context());

        // create a temporary project
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await checkCookieAccept(page);
        projectId = await createProject(page, projectName);
    });

    test.afterAll(async () => {
        // delete temporary project
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await deleteProject(page, projectId);

        await page.close();
    });

    test('goto editor', async () => {
        expect(await capture('editor', page, async () => {
            await page.getByText(projectName).first().click();
            await page.getByRole('button', { name: 'EDITOR' }).click();
            await page.waitForURL('**/editor/scene/**', { waitUntil: 'networkidle' });
            sceneId = parseInt(await page.evaluate(() => window.config.scene.id), 10);
        })).toStrictEqual([]);
    });

    test('goto code editor', async () => {
        expect(await capture('code-editor', page, async () => {
            // open code editor
            const codePagePromise = page.waitForEvent('popup');
            await page.locator('.pcui-element.font-regular.logo').click();
            await page.locator('span').filter({ hasText: /^Code Editor$/ }).click();
            const codePage = await codePagePromise;
            await codePage.waitForURL('**/editor/code/**', { waitUntil: 'networkidle' });
            codePage.close();
        })).toStrictEqual([]);
    });

    test('open settings', async () => {
        expect(await capture('settings', page, async () => {
            // open settings dialog
            await page.locator('.pcui-element.font-regular.logo').click();
            await page.locator('span').filter({ hasText: /^Settings$/ }).click();
            await page.waitForSelector('.pcui-container.settings');

            await page.getByText('RENDERING', { exact: true }).click();
        })).toStrictEqual([]);
    });

    for (const version of ['current', 'previous', 'releaseCandidate'] as const) {
        for (const type of ['debug', 'profiler', 'release'] as const) {
            for (const device of ['webgpu', 'webgl2'] as const) {
                test(`goto launcher (version: ${version}, type: ${type}, device: ${device})`, async () => {
                    expect(await capture('launcher', page, async () => {
                        // select version
                        await page.locator([
                            '.pcui-container.settings',
                            '.pcui-collapsible:nth-child(2)',
                            '.pcui-panel-content',
                            '.pcui-inspector',
                            ':first-child',
                            ':nth-child(2)'
                        ].join(' > ')).click();
                        const option = await page.locator(`#layout-attributes #${version}`);
                        if (await option.count() > 0) {
                            await option.click();
                        }

                        // select type
                        const launch = page.locator('.control-strip.top-right > .launch > .pcui-button').first();
                        const debug = await page.locator('div').filter({ hasText: /^Debug$/ }).locator('div');
                        const profiler = await page.locator('div').filter({ hasText: /^Profiler$/ }).locator('div');
                        await launch.hover();
                        if ((await debug.getAttribute('class'))?.includes('pcui-boolean-input-ticked')) {
                            await debug.click();
                        }
                        if ((await profiler.getAttribute('class'))?.includes('pcui-boolean-input-ticked')) {
                            await profiler.click();
                        }
                        switch (type) {
                            case 'debug': {
                                await debug.click();
                                break;
                            }
                            case 'profiler': {
                                await profiler.click();
                                break;
                            }
                        }

                        // select device
                        const webgpu = await page.locator('div').filter({ hasText: /^Enable WebGPU$/ }).locator('div');
                        const webgl2 = await page.locator('div').filter({ hasText: /^Enable WebGL 2\.0$/ }).locator('div');
                        if ((await webgpu.getAttribute('class'))?.includes('pcui-boolean-input-ticked')) {
                            await webgpu.click();
                        }
                        if ((await webgl2.getAttribute('class'))?.includes('pcui-boolean-input-ticked')) {
                            await webgl2.click();
                        }
                        switch (device) {
                            case 'webgpu': {
                                await webgpu.click();
                                break;
                            }
                            case 'webgl2': {
                                await webgl2.click();
                                break;
                            }
                        }

                        // launch page
                        const launchPagePromise = page.waitForEvent('popup');
                        await launch.click();
                        const launchPage = await launchPagePromise;
                        await launchPage.waitForURL(`**/${sceneId}**`, { waitUntil: 'networkidle' });
                        await launchPage.close();
                    })).toStrictEqual([]);
                });
            }
        }
    }
});

test.describe('publish/download', () => {
    const projectName = uniqueName('ui-apps');
    let projectId: number;
    let page: Page;

    test.describe.configure({
        mode: 'serial'
    });

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await middleware(page.context());

        // create a temporary project
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await checkCookieAccept(page);
        projectId = await createProject(page, projectName);
    });

    test.afterAll(async () => {
        // delete temporary project
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await deleteProject(page, projectId);

        await page.close();
    });

    test('goto editor', async () => {
        expect(await capture('editor', page, async () => {
            await page.goto(editorUrl(projectId), { waitUntil: 'networkidle' });
        })).toStrictEqual([]);
    });

    for (const scripts of ['classic', 'esm'] as const) {
        if (scripts === 'esm') {
            test('create ESM script', async () => {
                expect(await capture('create-esm-script', page, async () => {
                    // navigate to editor to ensure clean state
                    await page.goto(editorUrl(projectId), { waitUntil: 'networkidle' });

                    // create ESM script
                    await createEsmScript(page, 'test-esm.mjs');
                })).toStrictEqual([]);
            });
        }

        test(`download app (scripts: ${scripts})`, async () => {
            test.setTimeout(4 * 60 * 1000);
            expect(await capture(`download-project-${scripts}`, page, async () => {
                // open builds dialog
                await page.getByRole('button', { name: '' }).click();

                // open download form
                const scenesList = page.waitForResponse(/playcanvas.com\/api\/projects\/\d+\/scenes/);
                await page.locator('.builds-toolbar > .download').click();
                await scenesList;

                // start download build
                await page.waitForSelector('.picker-publish-new > .form-footer > .web-download.pcui-button:not(.pcui-disabled)');
                await page.locator('.picker-publish-new > .form-footer > .web-download').click();

                // wait for the new build to complete in the history list
                await page.waitForSelector('.build-item.download.complete .row-artifact.download', { timeout: 3 * 60 * 1000 });

                // download artifact link
                const downloadPagePromise = page.waitForEvent('popup');
                const downloadPromise = page.waitForEvent('download');
                await page.locator('.build-item.download.complete .row-artifact.download').first().click();
                await downloadPagePromise;
                await downloadPromise;

                // delete build so the next iteration starts with an empty download history
                await page.locator('.build-item.download.complete .kebab').first().click();
                await page.locator('.picker-builds-menu .pcui-menu-item').filter({ hasText: /^Delete$/ }).first().click();
                await page.getByRole('button', { name: 'Yes' }).click();
                await page.waitForSelector('.build-item.download', { state: 'detached' });

                // dismiss dialog
                await page.locator('.picker-project .close').first().click();
            })).toStrictEqual([]);
        });

        test(`publish app (scripts: ${scripts})`, async () => {
            test.setTimeout(4 * 60 * 1000);
            expect(await capture(`publish-project-${scripts}`, page, async () => {
                // open builds dialog
                await page.getByRole('button', { name: '' }).click();

                // open publish form
                const scenesList = page.waitForResponse(/playcanvas.com\/api\/projects\/\d+\/scenes/);
                await page.locator('.builds-toolbar > .publish').click();
                await scenesList;

                // start publish build
                await page.waitForSelector('.picker-publish-new > .form-footer > .publish.pcui-button:not(.pcui-disabled)');
                await page.locator('.picker-publish-new > .form-footer > .publish').click();

                // wait for the new build to complete in the history list
                await page.waitForSelector('.build-item.publish.complete .row-artifact.open', { timeout: 3 * 60 * 1000 });

                // launch app
                const appPagePromise = page.waitForEvent('popup');
                await page.locator('.build-item.publish.complete .row-artifact.open').first().click();
                const appPage = await appPagePromise;
                await appPage.waitForURL('**/b/**', { waitUntil: 'networkidle' });
                await appPage.close();

                // delete app
                await page.locator('.build-item.publish.complete .kebab').first().click();
                await page.locator('.picker-builds-menu .pcui-menu-item').filter({ hasText: /^Delete$/ }).first().click();
                await page.getByRole('button', { name: 'Yes' }).click();
                await page.waitForSelector('.build-item.publish', { state: 'detached' });

                // dismiss dialog
                await page.locator('.picker-project .close').first().click();
            })).toStrictEqual([]);
        });
    }
});
