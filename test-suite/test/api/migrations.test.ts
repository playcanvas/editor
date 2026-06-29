import type { Observer } from '@playcanvas/observer';
import { expect, test, type Page } from '@playwright/test';

import { checkCookieAccept, deleteProject, importProject } from '../../lib/common';
import { editorBlankUrl, editorUrl } from '../../lib/config';
import { middleware } from '../../lib/middleware';

const IN_PATH = 'test/fixtures/projects/texture-blank.zip';

test.describe.configure({
    mode: 'serial'
});

test.describe('migrations', () => {
    let projectId: number;
    let page: Page;
    let materialId: number;

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

    test('prepare engine v1 data', async () => {
        await page.goto(editorUrl(projectId), { waitUntil: 'networkidle' });
        materialId = await page.evaluate(async () => {
            const projectSettings = window.editor.call('settings:project') as Observer;
            projectSettings.set('engineV2', false);

            const sceneSettings = window.editor.call('sceneSettings') as Observer;
            sceneSettings.set('render.gamma_correction', 1);
            sceneSettings.set('render.tonemapping', 3);

            const root = window.editor.api.globals.entities.root;
            if (!root.get('components.camera')) {
                root.addComponent('camera');
            }
            root.set('components.camera.gammaCorrection', 0);
            root.set('components.camera.toneMapping', 0);

            const material = await window.editor.api.globals.assets.createMaterial({ name: 'TEST_MATERIAL' });
            material.set('data.shader', 'phong');
            material.set('data.useGammaTonemap', false);
            material.set('data.useTonemap', true);
            return material.get('id');
        });
    });

    test('automatically migrates to engine v2 without reverse writes', async () => {
        await page.goto(editorUrl(projectId), { waitUntil: 'networkidle' });
        await page.waitForFunction(
            () => (window.editor.call('settings:project') as Observer).get('engineV2') === true
        );

        const data = await page.evaluate((id) => {
            const root = window.editor.api.globals.entities.root;
            const material = window.editor.api.globals.assets.findOne(asset => asset.get('id') === id);
            return {
                engineV2: (window.editor.call('settings:project') as Observer).get('engineV2'),
                gamma: root.get('components.camera.gammaCorrection'),
                tone: root.get('components.camera.toneMapping'),
                shader: material.get('data.shader'),
                useGammaTonemap: material.get('data.useGammaTonemap'),
                useTonemap: material.get('data.useTonemap')
            };
        }, materialId);

        expect(data).toStrictEqual({
            engineV2: true,
            gamma: 1,
            tone: 3,
            shader: 'phong',
            useGammaTonemap: false,
            useTonemap: true
        });
    });
});
