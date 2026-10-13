import { readFileSync } from 'node:fs';

import { JOB_TEST_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { AssetWorkflows } from '../../lib/pages/asset-workflows';
import { AssetsPanel } from '../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { Inspector } from '../../lib/pages/inspector';
import { uniqueName } from '../../lib/utils';
import { model, splat } from '../fixtures/assets';

const PNG = readFileSync(new URL('../fixtures/files/test.png', import.meta.url));

// the Light submenu names an omni light "Omni Light" while the component stores 'point'
const LIGHT_TYPES = [
    { type: 'directional', item: 'Directional Light' },
    { type: 'point', item: 'Omni Light' },
    { type: 'spot', item: 'Spot Light' }
];

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;

test.describe('components-3d', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        await new EditorShell(editorPage).restore(baseline);
    });

    for (const { type, item } of LIGHT_TYPES) {
        test(`add light (type: ${type})`, async ({ editorPage }) => {
            const inspector = new Inspector(editorPage);
            const hierarchy = new HierarchyPanel(editorPage);
            const id = await hierarchy.createEntity({ name: uniqueName('ent') });

            await hierarchy.setSelection([id]);
            await expect(inspector.entity).toBeVisible();
            await inspector.addComponent(['Light', item]);

            const light = inspector.component('light');
            await expect(light).toBeVisible();
            expect(await inspector.read(id, 'components.light.type')).toBe(type);

            // range and the cone angles only make sense for the types that have them
            expect(await inspector.fieldVisible(light, 'Range')).toBe(type !== 'directional');
            expect(await inspector.fieldVisible(light, 'Outer Cone Angle')).toBe(type === 'spot');
        });
    }

    test('edit light colour', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { light: {} } });

        await hierarchy.setSelection([id]);
        const light = inspector.component('light');
        await expect(light).toBeVisible();
        expect(await inspector.read(id, 'components.light.color')).toEqual([1, 1, 1]);

        await inspector.openColorPicker(light, 'Color');
        await inspector.setColorChannel('g', 64);

        expect((await inspector.read(id, 'components.light.color'))[1]).toBeCloseTo(64 / 255, 5);
        expect((await inspector.shell.history()).last).toMatch(/components\.light\.color/);
    });

    test('toggle cast shadows shows shadow fields', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({
            name: uniqueName('ent'),
            components: { light: { type: 'directional' } }
        });

        await hierarchy.setSelection([id]);
        const light = inspector.component('light');
        await expect(light).toBeVisible();
        expect(await inspector.read(id, 'components.light.castShadows')).toBe(false);
        expect(await inspector.fieldVisible(light, 'Distance')).toBe(false);
        expect(await inspector.fieldVisible(light, 'Shadow Intensity')).toBe(false);

        await inspector.toggle(light, 'Cast Shadows');

        expect(await inspector.read(id, 'components.light.castShadows')).toBe(true);
        await expect(inspector.field(light, 'Distance')).toBeVisible();
        await expect(inspector.field(light, 'Shadow Intensity')).toBeVisible();
        await expect(inspector.field(light, 'Cascades')).toBeVisible();
    });

    test('switch projection swaps fov and ortho height', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { camera: {} } });

        await hierarchy.setSelection([id]);
        const camera = inspector.component('camera');
        await expect(camera).toBeVisible();
        expect(await inspector.fieldVisible(camera, 'Field Of View')).toBe(true);
        expect(await inspector.fieldVisible(camera, 'Ortho Height')).toBe(false);

        await inspector.setSelect(camera, 'Projection', 'Orthographic');

        expect(await inspector.read(id, 'components.camera.projection')).toBe(1);
        await expect(inspector.field(camera, 'Ortho Height')).toBeVisible();
        await expect(inspector.field(camera, 'Field Of View')).toBeHidden();

        await inspector.setNumber(camera, 'Ortho Height', 7);
        expect(await inspector.read(id, 'components.camera.orthoHeight')).toBe(7);
    });

    test('edit clear colour', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { camera: {} } });

        await hierarchy.setSelection([id]);
        const camera = inspector.component('camera');
        await expect(camera).toBeVisible();

        await inspector.openColorPicker(camera, 'Clear Color');
        await inspector.setColorChannel('r', 200);

        expect((await inspector.read(id, 'components.camera.clearColor'))[0]).toBeCloseTo(200 / 255, 5);
        await inspector.closeColorPicker();

        // the buffer toggle owns the colour field, so turning it off hides the picker
        await inspector.toggle(camera, 'Clear Color Buffer');
        expect(await inspector.read(id, 'components.camera.clearColorBuffer')).toBe(false);
        await expect(inspector.field(camera, 'Clear Color')).toBeHidden();
    });

    test('edit camera priority', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { camera: {} } });

        await hierarchy.setSelection([id]);
        const camera = inspector.component('camera');
        await expect(camera).toBeVisible();

        await inspector.setNumber(camera, 'Priority', 3);

        expect(await inspector.read(id, 'components.camera.priority')).toBe(3);

        await inspector.shell.undo();
        expect(await inspector.read(id, 'components.camera.priority')).toBe(0);
    });

    test('switch render type', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { render: {} } });

        await hierarchy.setSelection([id]);
        const render = inspector.component('render');
        await expect(render).toBeVisible();
        expect(await inspector.fieldVisible(render, 'Asset')).toBe(true);

        await inspector.setSelect(render, 'Type', 'Sphere');

        expect(await inspector.read(id, 'components.render.type')).toBe('sphere');

        // the render asset slot belongs to the asset type only
        await expect(inspector.assetSlot(render, 'Asset')).toBeHidden();
    });

    test('assign material asset', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const assets = new AssetsPanel(editorPage);
        const material = await assets.create('createMaterial', { name: uniqueName('mat') });

        // a primitive render only grows a material slot once the array holds one
        const id = await hierarchy.createEntity({
            name: uniqueName('ent'),
            components: { render: { type: 'box', materialAssets: [null] } }
        });

        await hierarchy.setSelection([id]);
        const render = inspector.component('render');
        await expect(inspector.assetSlot(render, 'Material #0')).toBeVisible();

        await inspector.assignAsset(render, 'Material #0', material.name);

        expect(await inspector.read(id, 'components.render.materialAssets')).toEqual([material.id]);
    });

    test('clear material slot', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const assets = new AssetsPanel(editorPage);
        const material = await assets.create('createMaterial', { name: uniqueName('mat') });
        const id = await hierarchy.createEntity({
            name: uniqueName('ent'),
            components: { render: { type: 'box', materialAssets: [material.id] } }
        });

        await hierarchy.setSelection([id]);
        const render = inspector.component('render');
        const slot = inspector.assetSlot(render, 'Material #0');
        await expect(slot.locator('.pcui-asset-input-asset').first()).toHaveText(material.name);

        await inspector.clearAsset(render, 'Material #0');

        expect(await inspector.read(id, 'components.render.materialAssets')).toEqual([null]);
        await expect(slot.locator('.pcui-asset-input-asset').first()).toHaveText('Empty');
    });

    test('toggle cast shadows', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { render: {} } });

        await hierarchy.setSelection([id]);
        const render = inspector.component('render');
        await expect(render).toBeVisible();
        expect(await inspector.read(id, 'components.render.castShadows')).toBe(true);

        await inspector.toggle(render, 'Cast Shadows');

        expect(await inspector.read(id, 'components.render.castShadows')).toBe(false);
        await expect(inspector.field(render, 'Shadow Cascades')).toBeHidden();
    });

    test('switch collision type swaps extents and radius', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { collision: {} } });

        await hierarchy.setSelection([id]);
        const collision = inspector.component('collision');
        await expect(collision).toBeVisible();
        expect(await inspector.fieldVisible(collision, 'Half Extents')).toBe(true);
        expect(await inspector.fieldVisible(collision, 'Radius')).toBe(false);

        await inspector.setSelect(collision, 'Type', 'Sphere');

        expect(await inspector.read(id, 'components.collision.type')).toBe('sphere');
        await expect(inspector.field(collision, 'Radius')).toBeVisible();
        await expect(inspector.field(collision, 'Half Extents')).toBeHidden();

        await inspector.setNumber(collision, 'Radius', 2);
        expect(await inspector.read(id, 'components.collision.radius')).toBe(2);
    });

    test('assign mesh asset', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const workflows = new AssetWorkflows(editorPage);
        const [asset] = await workflows.upload({ name: `${uniqueName('mesh')}.glb`, mimeType: 'model/gltf-binary', buffer: model() }, ['render', 'container', 'animation']);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { collision: {}, render: {} } });

        await hierarchy.setSelection([id]);
        const collision = inspector.component('collision');
        await expect(collision).toBeVisible();

        await inspector.setSelect(collision, 'Type', 'Mesh');

        expect(await inspector.read(id, 'components.collision.type')).toBe('mesh');
        await expect(inspector.assetSlot(collision, 'Render Asset')).toBeVisible();
        await expect(inspector.assetSlot(collision, 'Model Asset')).toBeVisible();

        await inspector.assignAsset(collision, 'Render Asset', asset.name);
        expect(await inspector.read(id, 'components.collision.renderAsset')).toBe(asset.id);
        await inspector.assignAsset(inspector.component('render'), 'Asset', asset.name);
        expect(await inspector.read(id, 'components.render.asset')).toBe(asset.id);

        const launch = await workflows.launch();
        const state = await launch.evaluate(({ id, asset }) => {
            const app = (window as any).pc.app;
            const entity = app.root.findByGuid(id);
            const resource = app.assets.get(asset).resource;
            return {
                collision: entity.collision.renderAsset,
                render: entity.render.asset,
                meshes: resource.meshes.length,
                vertices: entity.render.meshInstances[0].mesh.vertexBuffer.numVertices
            };
        }, { id, asset: asset.id });
        expect(state).toEqual({ collision: asset.id, render: asset.id, meshes: 1, vertices: 3 });
        await launch.close();
    });

    test('switch body type', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { rigidbody: {} } });

        await hierarchy.setSelection([id]);
        const rigidbody = inspector.component('rigidbody');
        await expect(rigidbody).toBeVisible();
        expect(await inspector.fieldVisible(rigidbody, 'Mass')).toBe(false);

        await inspector.setSelect(rigidbody, 'Type', 'Dynamic');

        expect(await inspector.read(id, 'components.rigidbody.type')).toBe('dynamic');
        await expect(inspector.field(rigidbody, 'Mass')).toBeVisible();
        await expect(inspector.field(rigidbody, 'Linear Damping')).toBeVisible();
    });

    test('edit mass', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({
            name: uniqueName('ent'),
            components: { rigidbody: { type: 'dynamic' } }
        });

        await hierarchy.setSelection([id]);
        const rigidbody = inspector.component('rigidbody');
        await expect(inspector.field(rigidbody, 'Mass')).toBeVisible();

        await inspector.setNumber(rigidbody, 'Mass', 12);

        expect(await inspector.read(id, 'components.rigidbody.mass')).toBe(12);

        await inspector.shell.undo();
        expect(await inspector.read(id, 'components.rigidbody.mass')).toBe(1);
    });

    test('edit friction', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { rigidbody: {} } });

        await hierarchy.setSelection([id]);
        const rigidbody = inspector.component('rigidbody');
        await expect(rigidbody).toBeVisible();

        await inspector.setSlider(rigidbody, 'Friction', 0.25);

        expect(await inspector.read(id, 'components.rigidbody.friction')).toBe(0.25);
    });

    test('edit particle count', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({
            name: uniqueName('ent'),
            components: { particlesystem: {} }
        });

        await hierarchy.setSelection([id]);
        const particles = inspector.component('particlesystem');
        await expect(particles).toBeVisible();
        expect(await inspector.read(id, 'components.particlesystem.numParticles')).toBe(30);

        await inspector.setNumber(particles, 'Particle Count', 12);

        expect(await inspector.read(id, 'components.particlesystem.numParticles')).toBe(12);
    });

    test('switch emitter shape', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({
            name: uniqueName('ent'),
            components: { particlesystem: {} }
        });

        await hierarchy.setSelection([id]);
        const particles = inspector.component('particlesystem');
        await expect(particles).toBeVisible();
        expect(await inspector.fieldVisible(particles, 'Emitter Extents')).toBe(true);
        expect(await inspector.fieldVisible(particles, 'Emitter Radius')).toBe(false);

        await inspector.setSelect(particles, 'Emitter Shape', 'Sphere');

        expect(await inspector.read(id, 'components.particlesystem.emitterShape')).toBe(1);
        await expect(inspector.field(particles, 'Emitter Radius')).toBeVisible();
        await expect(inspector.field(particles, 'Emitter Extents')).toBeHidden();
    });

    test('assign colour map', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const assets = new AssetsPanel(editorPage);
        const texture = await assets.uploadFile({
            name: `${uniqueName('tex')}.png`,
            type: 'texture',
            mimeType: 'image/png',
            buffer: PNG
        });
        const id = await hierarchy.createEntity({
            name: uniqueName('ent'),
            components: { particlesystem: {} }
        });

        await hierarchy.setSelection([id]);
        const particles = inspector.component('particlesystem');
        await expect(inspector.assetSlot(particles, 'Color Map')).toBeVisible();

        await inspector.assignAsset(particles, 'Color Map', texture.name);

        expect(await inspector.read(id, 'components.particlesystem.colorMapAsset')).toBe(texture.id);
    });

    test('edit zone size', async ({ editorPage }) => {
        // without the flag the zone component is filtered out of components:list, so no
        // inspector is ever built for it
        const allowed = await editorPage.evaluate(() => !!window.editor.call('users:hasFlag', 'hasZoneComponent'));
        test.skip(!allowed, 'needs the hasZoneComponent account flag');

        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { zone: {} } });

        await hierarchy.setSelection([id]);
        const zone = inspector.component('zone');
        await expect(zone).toBeVisible();

        await inspector.setVector(zone, 'Size', [3, 4, 5]);

        expect(await inspector.read(id, 'components.zone.size')).toEqual([3, 4, 5]);
    });

    test('assign splat asset', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const workflows = new AssetWorkflows(editorPage);
        const [asset] = await workflows.upload({ name: `${uniqueName('splat')}.ply`, mimeType: 'application/octet-stream', buffer: splat() }, ['gsplat']);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { gsplat: {} } });

        await hierarchy.setSelection([id]);
        const gsplat = inspector.component('gsplat');
        await expect(gsplat).toBeVisible();
        await expect(inspector.assetSlot(gsplat, 'Asset')).toBeVisible();
        expect(await inspector.read(id, 'components.gsplat.asset')).toBeNull();

        await inspector.assignAsset(gsplat, 'Asset', asset.name);
        expect(await inspector.read(id, 'components.gsplat.asset')).toBe(asset.id);
        await inspector.shell.undo();
        expect(await inspector.read(id, 'components.gsplat.asset')).toBeNull();
        await inspector.shell.redo();
        expect(await inspector.read(id, 'components.gsplat.asset')).toBe(asset.id);

        const launch = await workflows.launch();
        expect(await launch.evaluate(({ id, asset }) => {
            const app = (window as any).pc.app;
            return { asset: app.root.findByGuid(id).gsplat.asset, splats: app.assets.get(asset).resource.numSplats };
        }, { id, asset: asset.id })).toEqual({ asset: asset.id, splats: 9 });
        await launch.close();
    });
});
