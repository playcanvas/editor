import type { Observer } from '@playcanvas/observer';
import { expect, test, type Page } from '@playwright/test';

import { capture } from '../../lib/capture';
import { checkCookieAccept, deleteProject, importProject } from '../../lib/common';
import { editorBlankUrl, editorUrl } from '../../lib/config';
import { middleware } from '../../lib/middleware';

const IN_PATH = 'test/fixtures/projects/texture-blank.zip';
const TEXTURE_NAME = 'TEST_TEXTURE';
const TEXTURE_ERROR = 'The TEST_TEXTURE has sRGB set to false. The Color Map Asset property from Root requires sRGB to be true';

test.describe.configure({
    mode: 'serial'
});

test.describe('migrations', () => {
    test.skip(true, 'Cannot update legacy paths on frontend');

    let projectId: number;
    let page: Page;
    let materialId: number;
    let textureId: number;

    test.describe.configure({
        mode: 'serial'
    });

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await middleware(page.context());

        // import project containing textures
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

    test('prepare project', async () => {
        expect(await capture('editor', page, async () => {
            await page.goto(editorUrl(projectId), { waitUntil: 'networkidle' });
        })).toStrictEqual([]);

        [textureId, materialId] = await page.evaluate(async (textureName) => {
            // fetch Texture
            const texture = window.editor.api.globals.assets.findOne((asset: Observer) => asset.get('name') === textureName);

            // setup project settings
            const projectSettings = window.editor.call('settings:project') as Observer;
            (projectSettings.sync as any)._paths = null;
            projectSettings.set('deviceTypes', ['webgpu']);
            projectSettings.set('preferWebGl2', false);
            projectSettings.set('useLegacyAudio', true);
            projectSettings.set('useLegacyScripts', false);
            projectSettings.set('engineV2', true);
            projectSettings.unset('enableWebGl2');
            projectSettings.unset('enableWebGpu');

            // setup entities
            const root = window.editor.api.globals.entities.root;
            root.addComponent('audiosource');
            root.addComponent('camera');
            root.addComponent('light');
            root.addComponent('particlesystem');
            root.set('components.light.castShadows', true);
            root.set('components.light.shadowType', 1);
            root.set('components.particlesystem.colorMapAsset', texture.get('id'));
            root.set('components.particlesystem.normalMapAsset', texture.get('id'));

            // setup material
            const material = await window.editor.api.globals.assets.createMaterial({ name: 'TEST_MATERIAL' });
            material.set('data.emissiveMap', texture.get('id'));
            material.set('data.ambientTint', false);
            material.set('data.ambient', [1, 0, 0]);
            material.set('data.diffuse', [0, 0, 0]);
            material.set('data.emissive', [1, 1, 1]);
            material.set('data.fresnelModel', 0);
            material.set('data.shader', 'phong');
            material.set('data.useGammaTonemap', false);
            material.unset('data.diffuseTint');
            material.unset('data.emissiveTint');
            material.unset('data.metalnessTint');
            material.unset('data.sheenTint');
            material.unset('data.sheenGlossTint');
            material.unset('data.useTonemap');

            return [texture.get('id'), material.get('id')];
        }, TEXTURE_NAME);
    });

    test('check migrations', async () => {
        expect(await capture('editor', page, async () => {
            await page.goto(editorUrl(projectId), { waitUntil: 'networkidle' });

            // check project settings migration
            const projectSettings = await page.evaluate(() => {
                return (window.editor.call('settings:project') as Observer).json();
            });
            expect(projectSettings.hasOwnProperty('deviceTypes')).toBe(false);
            expect(projectSettings.hasOwnProperty('preferWebGl2')).toBe(false);
            expect(projectSettings.hasOwnProperty('useLegacyAudio')).toBe(false);
            expect(projectSettings.engineV2).toBe(true);
            expect(projectSettings.useLegacyScripts).toBe(false);
            expect(projectSettings.enableWebGpu).toBe(true);
            expect(projectSettings.enableWebGl2).toBe(false);

            // check material migration
            const material = await page.evaluate((id) => {
                return window.editor.api.globals.assets.findOne((asset: Observer) => asset.get('id') === id).json();
            }, materialId);
            expect(material.data.hasOwnProperty('fresnelModel')).toBe(false);
            expect(material.data.ambientTint).toBe(true);
            expect(material.data.ambient).toStrictEqual([1, 1, 1]);
            expect(material.data.diffuseTint).toBe(true);
            expect(material.data.diffuse).toStrictEqual([0, 0, 0]);
            expect(material.data.emissiveTint).toBe(true);
            expect(material.data.emissive).toStrictEqual([1, 1, 1]);
            expect(material.data.metalnessTint).toBe(true);
            expect(material.data.sheenTint).toBe(true);
            expect(material.data.sheenGlossTint).toBe(true);
            expect(material.data.useGammaTonemap).toBe(false);
            expect(material.data.useTonemap).toBe(false);
            expect(material.data.shader).toBe('blinn');

            // check texture migration
            const texture = await page.evaluate((id) => {
                return window.editor.api.globals.assets.findOne((asset: Observer) => asset.get('id') === id).json();
            }, textureId);
            expect(texture.data.hasOwnProperty('srgb')).toBe(true);

            // check entity migration
            const root = await page.evaluate(() => {
                return window.editor.api.globals.entities.root.json();
            });
            expect(root.components.light.shadowType).toBe(2); // VSM16
            expect(root.components.camera.gammaCorrection).toBe(1); // 2.2
        })).toContain(TEXTURE_ERROR);
    });

    test('fix sRGB conflicts', async () => {
        await page.evaluate((textureId) => {
            // remove texture from particlesystem normalMapAsset
            const root = window.editor.api.globals.entities.root;
            root.unset('components.particlesystem.normalMapAsset');

            // set texture sRGB to true
            const texture = window.editor.api.globals.assets.findOne((asset: Observer) => asset.get('id') === textureId);
            texture.set('data.srgb', true);
        }, textureId);

        // check for errors
        expect(await capture('editor', page, async () => {
            await page.goto(editorUrl(projectId), { waitUntil: 'networkidle' });
        })).toStrictEqual([]);
    });
});
