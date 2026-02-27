import type { Observer } from '@playcanvas/observer';
import { expect, test, type Page } from '@playwright/test';

import { capture } from '../../lib/capture';
import { checkCookieAccept, deleteProject, importProject } from '../../lib/common';
import { editorBlankUrl, editorUrl } from '../../lib/config';
import { middleware } from '../../lib/middleware';

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
        // listen for new source asset via messenger (set up before triggering conversion)
        const newAssetPromise = page.evaluate(() => {
            return new Promise<number>((resolve) => {
                const handle = window.editor.api.globals.messenger.on('message', (name: string, data: any) => {
                    if (name === 'asset.new' && data.asset.source) {
                        handle.unbind();
                        const newId = parseInt(data.asset.id, 10);

                        // wait for asset to load into the local store
                        if (window.editor.api.globals.assets.get(newId)) {
                            resolve(newId);
                            return;
                        }
                        const addHandle = window.editor.api.globals.assets.on('add', (asset) => {
                            if (asset.get('id') === newId) {
                                addHandle.unbind();
                                resolve(newId);
                            }
                        });
                    }
                });
            });
        });

        // right-click the asset grid item
        const assetName = await page.evaluate((id) => {
            const asset = window.editor.api.globals.assets.get(id);
            if (!asset) throw new Error(`Asset ${id} not found`);
            return asset.get('name') as string;
        }, sourceAssetId);
        await page.locator('.pcui-asset-grid-view-item').filter({ hasText: assetName }).first().click({ button: 'right' });

        // hover "Convert" to expand submenu, then click the target format
        await page.locator('.ui-menu-item .text').filter({ hasText: /^Convert$/ }).hover();
        const label = FORMAT_LABELS[targetFormat];
        await page.locator('.ui-menu-item .text').filter({ hasText: new RegExp(`^${label}$`) }).click();

        return await newAssetPromise;
    };

    test('prepare project', async () => {
        expect(await capture('editor', page, async () => {
            await page.goto(editorUrl(projectId), { waitUntil: 'networkidle' });
        })).toStrictEqual([]);

        currentAssetId = await page.evaluate((name) => {
            const asset = window.editor.api.globals.assets.findOne((a: Observer) => (a.get('name') as string).startsWith(name));
            if (!asset) throw new Error(`Asset "${name}" not found`);
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
                if (!asset) throw new Error(`Asset ${id} not found`);
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
