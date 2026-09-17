import { readFileSync } from 'node:fs';

import type { Page } from '@playwright/test';

import { expect, test } from '../../lib/fixtures';
import { AssetsPanel } from '../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { Inspector } from '../../lib/pages/inspector';
import { uniqueName } from '../../lib/utils';

const PNG = readFileSync(new URL('../fixtures/files/test.png', import.meta.url));

// the cubemap inspector never puts a class on its own root, so its faces are the handle
const FACE = '.pcui-cubemap-asset-inspector-face';

const assetValue = (page: Page, id: number, path: string) => {
    return page.evaluate(({ id, path }) => {
        return window.editor.api.globals.assets.get(id)?.get(path);
    }, { id, path });
};

const uploadTexture = (assets: AssetsPanel) => {
    return assets.uploadFile({
        name: `${uniqueName('tex')}.png`,
        type: 'texture',
        mimeType: 'image/png',
        buffer: PNG
    });
};

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;

test.describe('asset-inspector', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        await new EditorShell(editorPage).restore(baseline);
    });

    test('edit material diffuse', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const assets = new AssetsPanel(editorPage);
        const material = await assets.create('createMaterial', { name: uniqueName('mat') });

        await assets.select(material.name);
        await expect(inspector.asset).toBeVisible();
        await expect(inspector.header).toHaveText('material');

        const diffuse = inspector.panel(inspector.assetType('material'), 'DIFFUSE');
        await inspector.expand(diffuse);

        const before = await assetValue(editorPage, material.id, 'data.diffuse');
        expect(before).toHaveLength(3);
        expect(before[0]).not.toBeCloseTo(64 / 255, 5);

        await inspector.recordHistory();
        await inspector.openColorPicker(diffuse, 'Color');
        const changed = await assets.armField(material.id, 'data.diffuse', [64 / 255, before[1], before[2]]);
        await inspector.setColorChannel('r', 64);
        await changed();
        expect((await assetValue(editorPage, material.id, 'data.diffuse'))[0]).toBeCloseTo(64 / 255, 5);
        const actions = await inspector.historyActions();
        expect(actions).toHaveLength(1);
        expect(actions[0]).toMatch(/^data\.diffuse/);
    });

    test('edit material channels', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const assets = new AssetsPanel(editorPage);
        const texture = await uploadTexture(assets);
        const material = await assets.create('createMaterial', { name: uniqueName('mat') });

        await assets.select(material.name);
        const diffuse = inspector.panel(inspector.assetType('material'), 'DIFFUSE');
        await inspector.expand(diffuse);

        // the channel select only appears once a map is set
        expect(await inspector.fieldVisible(diffuse, 'Color Channel')).toBe(false);
        const assigned = await assets.armField(material.id, 'data.diffuseMap', texture.id);
        await inspector.assignAsset(diffuse, 'Diffuse', texture.name);
        await assigned();
        expect(await assetValue(editorPage, material.id, 'data.diffuseMap')).toBe(texture.id);
        await expect(inspector.field(diffuse, 'Color Channel')).toBeVisible();

        const channel = await assets.armField(material.id, 'data.diffuseMapChannel', 'g');
        await inspector.setSelect(diffuse, 'Color Channel', 'G');
        await channel();
        expect(await assetValue(editorPage, material.id, 'data.diffuseMapChannel')).toBe('g');
    });

    test('switch material workflow', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const assets = new AssetsPanel(editorPage);
        const material = await assets.create('createMaterial', { name: uniqueName('mat') });

        await assets.select(material.name);
        const specular = inspector.panel(inspector.assetType('material'), 'SPECULAR');
        await inspector.expand(specular);

        // there is no shader select: the metalness flag is what swaps the lighting workflow
        const before = await assetValue(editorPage, material.id, 'data.useMetalness');
        const changed = await assets.armField(material.id, 'data.useMetalness', !before);
        await inspector.toggle(specular, 'Use Metalness');
        await changed();
        expect(await assetValue(editorPage, material.id, 'data.useMetalness')).toBe(!before);
    });

    test('toggle texture mipmaps', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const assets = new AssetsPanel(editorPage);
        const asset = await uploadTexture(assets);

        await assets.select(asset.name);
        await expect(inspector.asset).toBeVisible();
        await expect(inspector.header).toHaveText('texture');

        const texture = inspector.assetType('texture');
        const before = await assetValue(editorPage, asset.id, 'data.mipmaps');

        const changed = await assets.armField(asset.id, 'data.mipmaps', !before);
        await inspector.toggle(texture, 'Mipmaps');
        await changed();
        expect(await assetValue(editorPage, asset.id, 'data.mipmaps')).toBe(!before);
    });

    // RGBM and sRGB are mutually exclusive, but enforcing that must never rewrite the asset
    // on its own: linking the fields used to clear RGBM on any texture that carried both,
    // silently turning an RGBM environment map into a much brighter sRGB one
    test('preserve texture encoding flags on select', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const assets = new AssetsPanel(editorPage);
        const asset = await uploadTexture(assets);

        // the state a generated cubemap face lands in: RGBM pixels plus the default sRGB flag
        await editorPage.evaluate((id) => {
            const texture = window.editor.api.globals.assets.get(id);
            texture.set('data.rgbm', true);
            texture.set('data.srgb', true);
        }, asset.id);

        await inspector.recordHistory();
        await assets.select(asset.name);
        const texture = inspector.assetType('texture');
        await expect(texture).toBeVisible();

        expect(await assetValue(editorPage, asset.id, 'data.rgbm')).toBe(true);
        expect(await assetValue(editorPage, asset.id, 'data.srgb')).toBe(true);
        // selecting is itself a history action, so only the flag writes matter here
        expect(await inspector.historyActions()).not.toContainEqual(expect.stringMatching(/^data\.(rgbm|srgb)/));
        await expect(inspector.field(texture, 'RGBM').locator('.pcui-boolean-input')).toHaveClass(/ticked/);
    });

    test('toggle texture encoding flags', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const assets = new AssetsPanel(editorPage);
        const asset = await uploadTexture(assets);

        await editorPage.evaluate((id) => {
            const texture = window.editor.api.globals.assets.get(id);
            texture.set('data.rgbm', false);
            texture.set('data.srgb', true);
        }, asset.id);

        await assets.select(asset.name);
        const texture = inspector.assetType('texture');
        await expect(texture).toBeVisible();

        // enabling one flag has to clear the other: the two encodings cannot both apply
        const rgbm = await assets.armField(asset.id, 'data.srgb', false);
        await inspector.toggle(texture, 'RGBM');
        await rgbm();
        expect(await assetValue(editorPage, asset.id, 'data.rgbm')).toBe(true);
        expect(await assetValue(editorPage, asset.id, 'data.srgb')).toBe(false);

        const srgb = await assets.armField(asset.id, 'data.rgbm', false);
        await inspector.toggle(texture, 'sRGB');
        await srgb();
        expect(await assetValue(editorPage, asset.id, 'data.srgb')).toBe(true);
        expect(await assetValue(editorPage, asset.id, 'data.rgbm')).toBe(false);
    });

    test('edit texture filtering', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const assets = new AssetsPanel(editorPage);
        const asset = await uploadTexture(assets);

        await assets.select(asset.name);
        const texture = inspector.assetType('texture');
        await expect(texture).toBeVisible();

        const changed = await assets.armField(asset.id, 'data.magfilter', 'nearest');
        await inspector.setSelect(texture, 'Filtering', 'Point');
        await changed();

        // one select drives both filters, and the min filter carries the mip suffix
        expect(await assetValue(editorPage, asset.id, 'data.magfilter')).toBe('nearest');
        expect(await assetValue(editorPage, asset.id, 'data.minfilter')).toBe('nearest_mip_nearest');
        expect((await inspector.shell.history()).last).toBe('assets.filtering');

        const address = await assets.armField(asset.id, 'data.addressu', 'clamp');
        await inspector.setSelect(texture, 'Address U', 'Clamp');
        await address();
        expect(await assetValue(editorPage, asset.id, 'data.addressu')).toBe('clamp');
    });

    test('set cubemap faces', async ({ editorPage, errors }) => {
        // every empty face falls back to <home>/editor/scene/img/asset-placeholder-texture.png,
        // which the local frontend dev server does not serve, and the 404 carries no url
        errors.allow(/Failed to load resource: the server responded with a status of 404/);

        const inspector = new Inspector(editorPage);
        const assets = new AssetsPanel(editorPage);
        const texture = await uploadTexture(assets);
        const cubemap = await assets.create('createCubemap', { name: uniqueName('cube') });

        await assets.select(cubemap.name);
        await expect(inspector.asset).toBeVisible();
        await expect(inspector.header).toHaveText('cubemap');

        const face = editorPage.locator(`${FACE}.Right`);
        await expect(face).toBeVisible();
        expect(await assetValue(editorPage, cubemap.id, 'data.textures')).toEqual([null, null, null, null, null, null]);

        // a face is a thumbnail rather than an asset slot, so clicking it opens the picker
        await face.click();
        const picker = editorPage.locator('.picker-asset');
        await picker.waitFor();
        const assigned = await assets.armField(cubemap.id, 'data.textures.0', texture.id);
        await assets.gridItem(texture.name).click();
        await picker.waitFor({ state: 'hidden' });
        await assigned();
        expect((await assetValue(editorPage, cubemap.id, 'data.textures'))[0]).toBe(texture.id);
    });

    test('read json text', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const assets = new AssetsPanel(editorPage);
        const token = uniqueName('value');
        const asset = await assets.create('createJson', { name: `${uniqueName('data')}.json`, json: { e2e: token } });

        await assets.select(asset.name);
        await expect(inspector.asset).toBeVisible();
        await expect(inspector.header).toHaveText('json');

        // the json inspector is a read-only code block, fetched from the asset file url
        const panel = inspector.panel(inspector.asset, 'JSON');
        await expect(panel).toBeVisible();
        await expect(panel.locator('.pcui-code-inner')).toContainText(token);
    });

    test('edit template asset', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const assets = new AssetsPanel(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const entity = uniqueName('ent');
        const entityId = await hierarchy.createEntity({ name: entity, components: { light: {} } });

        const asset = await editorPage.evaluate(async ([id, name]) => {
            const globals = window.editor.api.globals;
            const created = await globals.assets.createTemplate({ entity: globals.entities.get(id)!, name });
            return { id: created.get('id') as number, name: created.get('name') as string };
        }, [entityId, uniqueName('template')] as const);

        await assets.select(asset.name);
        await expect(inspector.asset).toBeVisible();
        await expect(inspector.header).toHaveText('template');

        const renamed = uniqueName('template');
        const named = await assets.armField(asset.id, 'name', renamed);
        await assets.rename(renamed);
        await named();
        expect(await assets.field(asset.id, 'name')).toBe(renamed);
        await expect(assets.gridItem(renamed)).toBeVisible();
        expect(await assetValue(editorPage, asset.id, 'data.entities')).not.toBeNull();
    });
});
