import type { Page } from '@playwright/test';

import { createEsmScript } from '../../lib/common';
import { JOB_TEST_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { uniqueName } from '../../lib/utils';

const THROW_MSG = 'intentional e2e error';

// throws once from update(), not initialize(): an initialize() throw aborts
// AppBase.start() before its first requestAnimationFrame, so the app never reaches
// frame 1 and the launch readiness wait can never pass
const scriptText = (name: string) => `
import { Script } from 'playcanvas';

export class E2eThrow extends Script {
    static scriptName = '${name}';

    initialize() {
        this.thrown = false;
    }

    update() {
        if (this.thrown) {
            return;
        }
        this.thrown = true;
        throw new Error('${THROW_MSG}');
    }
}
`.trim();

const device = (page: Page) => page.evaluate(() => {
    const gd = (window as any).pc.app.graphicsDevice;
    return { type: gd.deviceType as string, isWebGPU: !!gd.isWebGPU, isWebGL2: !!gd.isWebGL2 };
});

test('launch boots the scene and keeps ticking', async ({ project, openLaunch }) => {
    const launch = await openLaunch(project.sceneId);

    const state = await launch.evaluate(() => {
        const app = (window as any).pc.app;
        return {
            frame: app.frame as number,
            children: app.scene.root.children.length as number,
            splash: !!document.getElementById('application-splash-wrapper')
        };
    });

    expect(state.frame).toBeGreaterThan(0);
    expect(state.splash).toBe(false);
    expect(state.children).toBeGreaterThan(0);

    // a single rendered frame is not a running app; prove the tick loop advances
    await launch.waitForFunction(f => (window as any).pc.app.frame > f, state.frame);
});

test('device=webgl2 creates a webgl2 device', async ({ project, openLaunch }) => {
    const launch = await openLaunch(project.sceneId, { device: 'webgl2' });

    const gd = await device(launch);
    expect(gd.type).toBe('webgl2');
    expect(gd.isWebGL2).toBe(true);

    const tooltip = launch.locator('#application-tooltips .tooltip');
    await expect(tooltip).toHaveCount(1);
    await expect(tooltip).toHaveText(/currently using the graphics device: WebGL 2\.0/);
    await expect(launch.locator('#application-tooltips .tooltip', { hasText: 'not supported' })).toHaveCount(0);
});

test('device=webgpu creates a webgpu device', async ({ project, openLaunch }) => {
    const launch = await openLaunch(project.sceneId, { device: 'webgpu' });

    const tooltip = launch.locator('#application-tooltips .tooltip');
    await expect(tooltip).toHaveCount(1);
    const text = (await tooltip.innerText()).trim();
    test.skip(text.includes('not supported'), text);

    const gd = await device(launch);
    expect(gd.type).toBe('webgpu');
    expect(gd.isWebGPU).toBe(true);
});

test('a script that throws on update surfaces in the application console', async ({ context, editorPage, project, openLaunch, errors }) => {
    test.setTimeout(JOB_TEST_TIMEOUT);
    errors.allow(new RegExp(THROW_MSG));

    // the registry name is the class's static scriptName, which must be an identifier,
    // so strip the hyphens uniqueName puts in the filename
    const file = uniqueName('throw');
    const script = file.replace(/[^a-z0-9]/gi, '');
    const assetId = await createEsmScript(editorPage, `${file}.mjs`, scriptText(script));

    const guid = await editorPage.evaluate((name) => {
        return window.editor.api.globals.entities.create({ name } as any).get('resource_id') as string;
    }, uniqueName('thrower'));

    try {
        await editorPage.evaluate(async ({ guid, script }) => {
            const entities = window.editor.api.globals.entities;
            await entities.addScript([entities.get(guid)!], script);
        }, { guid, script });

        // the throw lands on the first frame, so listen before the page is created
        const raised: string[] = [];
        context.on('page', p => p.on('pageerror', err => raised.push(err.message)));

        const launch = await openLaunch(project.sceneId);

        await expect(launch.locator('#application-console:not(.hidden) p.error').first()).toContainText(THROW_MSG);
        await expect.poll(() => raised.some(m => m.includes(THROW_MSG))).toBe(true);
        expect(errors.list.some(m => m.includes(THROW_MSG))).toBe(true);

        // the throw must not stall the tick loop
        const before = await launch.evaluate(() => (window as any).pc.app.frame as number);
        await launch.waitForFunction(f => (window as any).pc.app.frame > f, before);
    } finally {
        await editorPage.evaluate(async ({ guid, id }) => {
            const { entities, assets } = window.editor.api.globals;
            const entity = entities.get(guid);
            if (entity) {
                await entities.delete([entity]);
            }
            const asset = assets.get(id);
            if (asset) {
                await assets.delete([asset]);
            }
        }, { guid, id: assetId });
    }
});

test('profile=true shows the dev tools and Alt+T toggles them', async ({ project, openLaunch }) => {
    const launch = await openLaunch(project.sceneId, { profile: true });

    const tools = launch.locator('#dev-tools');
    await expect(tools).toBeVisible();

    await launch.keyboard.press('Alt+T');
    await expect(tools).toBeHidden();

    await launch.keyboard.press('Alt+T');
    await expect(tools).toBeVisible();
});
