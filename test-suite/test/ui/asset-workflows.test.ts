import { readFileSync } from 'node:fs';

import { JOB_TEST_TIMEOUT, JOB_TIMEOUT, READY_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { AssetWorkflows } from '../../lib/pages/asset-workflows';
import { AssetsPanel } from '../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { Inspector } from '../../lib/pages/inspector';
import { uniqueName } from '../../lib/utils';
import { model } from '../fixtures/assets';

const FONT = readFileSync(new URL('../fixtures/files/courier-prime.ttf', import.meta.url));
let baseline: ProjectState;

test.describe('asset workflows', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        await new EditorShell(editorPage).restore(baseline);
    });

    test('reimport a model and preserve its assigned render asset', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const workflows = new AssetWorkflows(editorPage);
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const file = { name: `${uniqueName('reimport')}.glb`, mimeType: 'model/gltf-binary', buffer: model() };
        const [render, container] = await workflows.upload(file, ['render', 'container']);
        const id = await hierarchy.createEntity({ name: uniqueName('render'), components: { render: {} } });
        await hierarchy.setSelection([id]);
        await inspector.assignAsset(inspector.component('render'), 'Asset', render.name);
        const before = await workflows.launch();
        expect(await before.evaluate(id => (window as any).pc.app.root.findByGuid(id).render.meshInstances[0].mesh.aabb.halfExtents.x, id)).toBe(1);
        await before.close();

        await workflows.reimport({ ...file, buffer: model(2) }, container.id);
        expect(await inspector.read(id, 'components.render.asset')).toBe(render.id);
        const after = await workflows.launch();
        expect(await after.evaluate((id) => {
            const render = (window as any).pc.app.root.findByGuid(id).render;
            return { asset: render.asset, width: render.meshInstances[0].mesh.aabb.halfExtents.x * 2 };
        }, id)).toEqual({ asset: render.id, width: 4 });
        await after.close();
    });

    test('assign an imported animation through an Anim State Graph and play its pose in Launch', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const workflows = new AssetWorkflows(editorPage);
        const assets = new AssetsPanel(editorPage);
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const [render, animation] = await workflows.upload({ name: `${uniqueName('animation')}.glb`, mimeType: 'model/gltf-binary', buffer: model() }, ['render', 'animation']);
        await assets.armAdd({ type: 'animstategraph' });
        await assets.newAsset('Anim State Graph');
        const graph = await assets.awaitAdd({ type: 'animstategraph' });
        const states = await assets.field(graph.id, 'data.states');
        const state = Object.values(states).find((state: any) => state.nodeType === 1) as { name: string };
        expect(state).toBeDefined();

        const root = await hierarchy.createEntity({ name: 'FixtureRoot' });
        const child = await hierarchy.createEntity({ name: 'FixtureTriangle', parent: root, components: { render: {} } });
        await hierarchy.setSelection([child]);
        await inspector.assignAsset(inspector.component('render'), 'Asset', render.name);
        await hierarchy.setSelection([root]);
        await inspector.addComponent(['Animation', 'Anim']);
        const anim = inspector.component('anim');
        await inspector.assignAsset(anim, 'State Graph', graph.name);
        await inspector.assignAsset(anim, state.name, animation.name);

        const launch = await workflows.launch();
        const played = await new EditorShell(launch).arm(({ root, child }: { root: string; child: string }) => {
            const app = (window as any).pc.app;
            const entity = app.root.findByGuid(child);
            const component = app.root.findByGuid(root).anim;
            const initial = entity.getLocalPosition().y;
            let check: () => void;
            return {
                done: new Promise<{ y: number; speed: number; time: number }>((resolve) => {
                    check = () => {
                        const y = entity.getLocalPosition().y;
                        if (Math.abs(y - initial) > 0.02) {
                            app.off('frameend', check);
                            resolve({ y, speed: component.speed, time: component.baseLayer.activeStateCurrentTime });
                        }
                    };
                    app.on('frameend', check);
                }),
                dispose: () => app.off('frameend', check)
            };
        }, { root, child }, { what: 'animation to move the assigned mesh node', timeout: READY_TIMEOUT });
        const pose = await played();
        expect(pose.y).toBeGreaterThanOrEqual(0);
        expect(pose.y).toBeLessThanOrEqual(1);
        expect(pose.speed).toBe(1);
        expect(Number.isFinite(pose.time)).toBe(true);
        await launch.close();
    });

    test('import and regenerate a font, then render assigned text in Launch', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const workflows = new AssetWorkflows(editorPage);
        const assets = new AssetsPanel(editorPage);
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const shell = new EditorShell(editorPage);
        const [font] = await workflows.upload({ name: `${uniqueName('font')}.ttf`, mimeType: 'font/ttf', buffer: FONT }, ['font', 'json', 'texture']);
        const refs = await assets.field(font.id, 'data');
        expect(refs.jsonAsset).toEqual(expect.any(Number));
        expect(refs.textureAssets).toHaveLength(1);

        const item = assets.gridItem(font.name).and(editorPage.locator(':not(.pcui-asset-grid-view-item-source)'));
        if (!await item.evaluate(el => el.classList.contains('pcui-gridview-item-selected'))) {
            await item.click();
        }
        const panel = editorPage.locator('.asset-font-inspector-font');
        await expect(panel).toBeVisible();
        const characters = shell.labelGroup(panel, 'Characters').locator('textarea, input');
        await characters.fill('ABCé');
        await characters.press('Tab');
        const regenerated = await shell.arm((id: number) => ({ done: new Promise<void>((resolve) => {
            const event = window.editor.on('fonts:reprocessed', (asset: any) => {
                if (Number(asset.get('id')) === id) {
                    event.unbind();
                    resolve();
                }
            });
        }) }), font.id, { what: 'font regeneration', timeout: JOB_TIMEOUT });
        await panel.getByRole('button', { name: 'REGENERATE FONT ASSETS', exact: true }).click();
        await regenerated();
        await expect(panel.getByRole('button', { name: 'REGENERATE FONT ASSETS', exact: true })).toBeEnabled();
        const updated = await assets.field(font.id, 'data');
        expect(updated.jsonAsset).toBe(refs.jsonAsset);
        expect(updated.textureAssets.slice(0, refs.textureAssets.length)).toEqual(refs.textureAssets);
        expect(await assets.field(font.id, 'meta.chars')).toBe('ABCé');

        const screen = await hierarchy.createEntity({ name: uniqueName('screen'), components: { screen: {} } });
        const id = await hierarchy.createEntity({ name: uniqueName('text'), parent: screen, components: { element: { type: 'text', text: 'ABCé', fontAsset: null, fontSize: 32, width: 200, height: 50 } } });
        await hierarchy.setSelection([id]);
        expect(await inspector.read(id, 'components.element.fontAsset')).toBeNull();
        await inspector.assignAsset(inspector.component('element'), 'Font', font.name);
        expect(await inspector.read(id, 'components.element.fontAsset')).toBe(font.id);

        const launch = await workflows.launch();
        const rendered = await launch.evaluate((id) => {
            const element = (window as any).pc.app.root.findByGuid(id).element;
            return {
                text: element.text,
                chars: Object.keys(element.font.data.chars),
                width: element.textWidth,
                height: element.textHeight,
                textures: element.font.textures.length
            };
        }, id);
        expect(rendered.text).toBe('ABCé');
        expect(rendered.chars).toEqual(expect.arrayContaining(['A', 'B', 'C', 'é']));
        expect(rendered.width).toBeGreaterThan(0);
        expect(rendered.height).toBeGreaterThan(0);
        expect(rendered.textures).toBe(updated.textureAssets.length);
        await launch.close();
    });
});
