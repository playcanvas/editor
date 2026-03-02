import { expect, test, type Page } from '@playwright/test';

import { capture } from '../../lib/capture';
import { checkCookieAccept, deleteProject, importProject } from '../../lib/common';
import { editorBlankUrl, editorUrl } from '../../lib/config';
import { middleware } from '../../lib/middleware';

type Asset = Exclude<ReturnType<typeof window.editor.api.globals.assets.get>, null>;

const IN_PATH = 'test/fixtures/projects/texture-blank.zip';
const TEXTURE_NAME = 'TEST_TEXTURE.png';
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
    let projectId: number;
    let page: Page;
    let currentAssetId: number;

    test.describe.configure({
        mode: 'serial'
    });

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await middleware(page.context());

        // import project containing test texture
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await checkCookieAccept(page);
        projectId = await importProject(page, IN_PATH);
    });

    test.afterAll(async () => {
        // delete temporary project
        await page.goto(editorBlankUrl(), { waitUntil: 'networkidle' });
        await deleteProject(page, projectId);
        await page.close();
    });

    const convertTextureViaUI = async (sourceAssetId: number, targetFormat: string): Promise<number> => {
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

    test('prepare project', async () => {
        expect(await capture('editor', page, async () => {
            await page.goto(editorUrl(projectId), { waitUntil: 'networkidle' });
        })).toStrictEqual([]);

        currentAssetId = await page.evaluate((name) => {
            const asset = window.editor.api.globals.assets.findOne((a: Asset) => (a.get('name') as string).startsWith(name));
            if (!asset) {
                throw new Error(`Asset "${name}" not found`);
            }
            return asset.get('id') as number;
        }, TEXTURE_NAME);

        expect(currentAssetId).toBeGreaterThan(0);
    });

    for (const { source, target } of [
        { source: 'png', target: 'webp' },
        { source: 'webp', target: 'avif' },
        { source: 'avif', target: 'jpeg' },
        { source: 'jpeg', target: 'png' }
    ]) {
        test(`convert ${source.toUpperCase()} to ${target.toUpperCase()}`, async () => {
            test.setTimeout(2 * 60 * 1000);

            let newAssetId = 0;
            expect(await capture(`convert-${source}-to-${target}`, page, async () => {
                newAssetId = await convertTextureViaUI(currentAssetId, target);
            })).toStrictEqual([]);

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

            currentAssetId = newAssetId;
        });
    }
});
