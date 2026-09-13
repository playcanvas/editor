import type { Observer } from '@playcanvas/observer';
import type { BrowserContext, Page } from '@playwright/test';

import { checkCookieAccept, deleteProject, importProject } from '../../lib/common';
import { editorBlankUrl, editorUrl } from '../../lib/config';
import { JOB_TEST_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { middleware } from '../../lib/middleware';
import { waitForEditor } from '../../lib/ready';

const IN_PATH = 'test/fixtures/projects/texture-blank.zip';
const TEXTURE_NAME = 'TEST_TEXTURE';
const TEXTURE_ERROR = 'The TEST_TEXTURE has sRGB set to false. The Color Map Asset property from Root requires sRGB to be true';

test.describe.configure({
    mode: 'serial'
});

test.describe('migrations', () => {
    test.skip(true, 'Cannot update legacy paths on frontend');

    let context: BrowserContext;
    let setup: Page;
    let projectId: number;
    let materialId: number;
    let textureId: number;

    // migrations run on load, so this spec imports and owns a legacy project
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

    test('prepare project', async ({ page }) => {
        await open(page);

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

        expect(textureId).toBeGreaterThan(0);
        expect(materialId).toBeGreaterThan(0);
    });

    test('check migrations', async ({ page, errors }) => {
        // the sRGB conflict is the behaviour under test here
        errors.allow(/sRGB set to false/);

        await open(page);

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

        // the colour map still points at a non-sRGB texture, so the editor reports it
        expect(errors.list.some(m => m.includes(TEXTURE_ERROR))).toBe(true);
    });

    test('fix sRGB conflicts', async ({ page, errors }) => {
        await open(page);

        await page.evaluate((textureId) => {
            // remove texture from particlesystem normalMapAsset
            const root = window.editor.api.globals.entities.root;
            root.unset('components.particlesystem.normalMapAsset');

            // set texture sRGB to true
            const texture = window.editor.api.globals.assets.findOne((asset: Observer) => asset.get('id') === textureId);
            texture.set('data.srgb', true);
        }, textureId);

        // reloading with the conflict fixed reports nothing
        await open(page);
        expect(errors.unexpected).toStrictEqual([]);
    });
});

test.describe('engine v1 migration', () => {
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

    test('prepare engine v1 project', async ({ page }) => {
        await open(page);

        await page.evaluate(() => {
            const settings = window.editor.call('settings:project') as Observer;
            settings.set('engineV2', false);

            const scene = window.editor.call('sceneSettings') as Observer;
            scene.set('render.gamma_correction', 1);
            scene.set('render.tonemapping', 3);

            const root = window.editor.api.globals.entities.root;
            if (!root.get('components.camera')) {
                root.addComponent('camera');
            }
            root.set('components.camera.gammaCorrection', 0);
            root.set('components.camera.toneMapping', 0);
        });

        // the ops must reach the server before this page closes, or the next
        // test loads the unmigrated project and nothing migrates
        await page.waitForFunction(() => !window.editor.api.globals.realtime.connection.sharedb.hasPending());
        expect(await page.evaluate(() => (window.editor.call('settings:project') as Observer).get('engineV2'))).toBe(false);
    });

    test('automatically migrates to engine v2', async ({ page }) => {
        await open(page);
        await page.waitForFunction(
            () => (window.editor.call('settings:project') as Observer).get('engineV2') === true
        );

        expect(
            await page.evaluate(() => {
                const root = window.editor.api.globals.entities.root;
                return {
                    engineV2: (window.editor.call('settings:project') as Observer).get('engineV2'),
                    gamma: root.get('components.camera.gammaCorrection'),
                    tone: root.get('components.camera.toneMapping')
                };
            })
        ).toStrictEqual({
            engineV2: true,
            gamma: 1,
            tone: 3
        });
    });
});
