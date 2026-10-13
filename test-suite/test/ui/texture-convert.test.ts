import type { BrowserContext, Page } from '@playwright/test';

import { checkCookieAccept, deleteProject, importProject } from '../../lib/common';
import { editorBlankUrl, editorUrl } from '../../lib/config';
import { JOB_TEST_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { middleware } from '../../lib/middleware';
import { waitForEditor } from '../../lib/ready';

type Asset = Exclude<ReturnType<typeof window.editor.api.globals.assets.get>, null>;

const IN_PATH = 'test/fixtures/projects/texture-blank.zip';
const TEXTURE_NAME = 'TEST_TEXTURE';
const FORMAT_LABELS: Record<string, string> = {
    webp: 'WebP',
    avif: 'AVIF',
    jpeg: 'JPEG',
    png: 'PNG'
};

test.describe.configure({
    mode: 'serial'
});

test.describe('texture-convert', () => {
    let context: BrowserContext;
    let setup: Page;
    let projectId: number;

    // the fixture project ships the source texture, so this spec owns its project
    test.beforeAll(async ({ browser, authState }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        context = await browser.newContext({ storageState: authState });
        await middleware(context);
        setup = await context.newPage();
        await setup.goto(editorBlankUrl());
        await setup.locator('.picker-project-cms').waitFor();
        await checkCookieAccept(setup);
        projectId = await importProject(setup, IN_PATH);
    });

    test.afterAll(async () => {
        await deleteProject(setup, projectId);
        await context.close();
    });

    const open = async (page: Page) => {
        await page.goto(editorUrl(projectId, { disableBubbles: true }));
        await waitForEditor(page);
    };

    const convertTextureViaUI = async (page: Page, sourceAssetId: number, targetFormat: string): Promise<number> => {
        // right-click the asset grid item
        const assetName = await page.evaluate((id) => {
            const asset = window.editor.api.globals.assets.get(id);
            if (!asset) {
                throw new Error(`Asset ${id} not found`);
            }
            return asset.get('name') as string;
        }, sourceAssetId);
        await page.locator('.pcui-asset-grid-view-item').filter({ hasText: assetName }).first().click({ button: 'right' });

        // creation promise — wait for the new asset to appear AND have meta.format set
        const createPromise = page.evaluate(() => {
            return new Promise<number>((resolve) => {
                const handle = window.editor.api.globals.messenger.on('message', (name: string, data: any) => {
                    if (name === 'asset.new') {
                        handle.unbind();
                        const newId = parseInt(data.asset.id, 10);

                        // wait for the new asset to have meta.format set, which indicates it's
                        // ready for use by the convert handler
                        const waitForMeta = (asset: Asset) => {
                            const meta = asset.get('meta');
                            if (meta && meta.format) {
                                resolve(newId);
                                return;
                            }
                            const check = () => {
                                const m = asset.get('meta');
                                if (m && m.format) {
                                    asset.unbind('meta:set', check);
                                    asset.unbind('meta.format:set', check);
                                    resolve(newId);
                                }
                            };
                            asset.on('meta:set', check);
                            asset.on('meta.format:set', check);
                        };

                        // wait for asset to load into the local store, then wait for meta.format
                        const existing = window.editor.api.globals.assets.get(newId);
                        if (existing) {
                            waitForMeta(existing);
                            return;
                        }
                        const addHandle = window.editor.api.globals.assets.on('add', (asset) => {
                            if (asset.get('id') === newId) {
                                addHandle.unbind();
                                waitForMeta(asset);
                            }
                        });
                    }
                });
            });
        });

        // hover "Convert" to expand submenu, then click the target format
        await page.locator('.pcui-menu-item-content > .pcui-label').filter({ hasText: /^Convert$/ }).hover();
        const label = FORMAT_LABELS[targetFormat];
        await page.locator('.pcui-menu-item-content > .pcui-label').filter({ hasText: new RegExp(`^${label}$`) }).dispatchEvent('click');

        // wait for new asset to be created with meta.format ready
        return await createPromise;
    };

    // each conversion consumes the asset the previous one produced, found by extension
    const textureId = (page: Page, ext: string) => page.evaluate(({ name, ext }) => {
        const asset = window.editor.api.globals.assets.findOne((a: Asset) => {
            const assetName = a.get('name') as string;
            return assetName.startsWith(name) && assetName.endsWith(`.${ext}`);
        });
        if (!asset) {
            throw new Error(`Asset "${name}.${ext}" not found`);
        }
        return asset.get('id') as number;
    }, { name: TEXTURE_NAME, ext });

    test('prepare project', async ({ page }) => {
        await open(page);
        expect(await textureId(page, 'png')).toBeGreaterThan(0);
    });

    for (const { source, target } of [
        { source: 'png', target: 'webp' },
        { source: 'webp', target: 'avif' },
        { source: 'avif', target: 'jpeg' },
        { source: 'jpeg', target: 'png' }
    ]) {
        test(`convert ${source.toUpperCase()} to ${target.toUpperCase()}`, async ({ page }) => {
            await open(page);

            const newAssetId = await convertTextureViaUI(page, await textureId(page, source), target);
            const newAsset = await page.evaluate((id) => {
                const asset = window.editor.api.globals.assets.get(id);
                if (!asset) {
                    throw new Error(`Asset ${id} not found`);
                }
                return {
                    name: asset.get('name') as string,
                    type: asset.get('type') as string
                };
            }, newAssetId);

            expect(newAsset.name).toContain(`.${target}`);
            expect(newAsset.type).toBe('texture');
        });
    }
});
