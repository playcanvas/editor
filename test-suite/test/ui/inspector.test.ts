import type { Page } from '@playwright/test';

import { expect, test } from '../../lib/fixtures';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { Inspector } from '../../lib/pages/inspector';
import { uniqueName } from '../../lib/utils';

// smallest valid png, used to create a real texture asset
const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';

const createEntity = (page: Page, data: Record<string, unknown>) => {
    return page.evaluate((d) => {
        return window.editor.api.globals.entities.create(d as any).get('resource_id') as string;
    }, data);
};

const selectEntities = (page: Page, ids: string[]) => {
    return page.evaluate((list) => {
        const globals = window.editor.api.globals;
        globals.selection.set(list.map(id => globals.entities.get(id)));
    }, ids);
};

const selectAsset = (page: Page, id: number) => {
    return page.evaluate((assetId) => {
        const globals = window.editor.api.globals;
        globals.selection.set([globals.assets.get(assetId)]);
    }, id);
};

const entityValue = (page: Page, id: string, path: string) => {
    return page.evaluate(({ id, path }) => {
        return window.editor.api.globals.entities.get(id)?.get(path);
    }, { id, path });
};

const entityHas = (page: Page, id: string, path: string) => {
    return page.evaluate(({ id, path }) => {
        return window.editor.api.globals.entities.get(id)?.has(path);
    }, { id, path });
};

const assetValue = (page: Page, id: number, path: string) => {
    return page.evaluate(({ id, path }) => {
        return window.editor.api.globals.assets.get(id)?.get(path);
    }, { id, path });
};

const createMaterial = (page: Page, name: string) => {
    return page.evaluate(async (n) => {
        const asset = await window.editor.api.globals.assets.createMaterial({ name: n });
        return asset.get('id') as number;
    }, name);
};

const createTexture = (page: Page, name: string) => {
    return page.evaluate(async ({ name, b64 }) => {
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const file = new File([bytes], name, { type: 'image/png' });
        const asset = await window.editor.api.globals.assets.upload({ filename: name, file, type: 'texture', name });
        return asset.get('id') as number;
    }, { name, b64: PNG_1X1 });
};

const hierarchyRow = (page: Page, name: string) => {
    return page.locator(
        `#layout-hierarchy .pcui-treeview-item:has(> .pcui-treeview-item-contents > .pcui-treeview-item-text:text-is("${name}"))`
    );
};

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;

test.beforeEach(async ({ editorPage }) => {
    baseline = await new EditorShell(editorPage).snapshot();
});

test.afterEach(async ({ editorPage }) => {
    await new EditorShell(editorPage).restore(baseline);
});

test('selecting an entity inspects it', async ({ editorPage }) => {
    const inspector = new Inspector(editorPage);
    const name = uniqueName('entity');
    const id = await createEntity(editorPage, { name });

    await selectEntities(editorPage, [id]);

    await expect(inspector.entity).toBeVisible();
    await expect(inspector.header).toHaveText('Entity');
    await expect(inspector.field(inspector.entityFields, 'Name').locator('input'))
    .toHaveValue(await entityValue(editorPage, id, 'name'));
});

test('add component adds an omni light', async ({ editorPage }) => {
    const inspector = new Inspector(editorPage);
    const id = await createEntity(editorPage, { name: uniqueName('entity') });

    await selectEntities(editorPage, [id]);
    await expect(inspector.entity).toBeVisible();
    await inspector.recordHistory();
    await inspector.addComponent(['Light', 'Omni Light']);

    await expect(inspector.component('light')).toBeVisible();
    await expect.poll(() => entityValue(editorPage, id, 'components.light.type')).toBe('point');
    expect(await inspector.historyActions()).toEqual(['entities.light']);
});

test('light intensity commits, undoes and redoes', async ({ editorPage }) => {
    const inspector = new Inspector(editorPage);
    const id = await createEntity(editorPage, { name: uniqueName('entity'), components: { light: {} } });

    await selectEntities(editorPage, [id]);
    const light = inspector.component('light');
    await expect(light).toBeVisible();

    const before = await entityValue(editorPage, id, 'components.light.intensity');
    expect(before).not.toBe(5);

    await inspector.setNumber(light, 'Intensity', 5);
    await expect.poll(() => entityValue(editorPage, id, 'components.light.intensity')).toBe(5);

    await inspector.shell.undo();
    await expect.poll(() => entityValue(editorPage, id, 'components.light.intensity')).toBe(before);

    await inspector.shell.redo();
    await expect.poll(() => entityValue(editorPage, id, 'components.light.intensity')).toBe(5);
});

test('component menu removes the component and undo restores it', async ({ editorPage }) => {
    const inspector = new Inspector(editorPage);
    const id = await createEntity(editorPage, { name: uniqueName('entity'), components: { light: {} } });

    await selectEntities(editorPage, [id]);
    await expect(inspector.component('light')).toBeVisible();

    await inspector.componentMenu('light', 'Remove Component');

    await expect(inspector.component('light')).toBeHidden();
    await expect.poll(() => entityHas(editorPage, id, 'components.light')).toBe(false);

    await inspector.shell.undo();

    await expect(inspector.component('light')).toBeVisible();
    await expect.poll(() => entityHas(editorPage, id, 'components.light')).toBe(true);
});

test('position vector records one action per axis', async ({ editorPage }) => {
    const inspector = new Inspector(editorPage);
    const id = await createEntity(editorPage, { name: uniqueName('entity') });

    await selectEntities(editorPage, [id]);
    await expect(inspector.entity).toBeVisible();
    await inspector.recordHistory();
    await inspector.setVector(inspector.entityFields, 'Position', [1, 2, 3]);

    await expect.poll(() => entityValue(editorPage, id, 'position')).toEqual([1, 2, 3]);
    expect(await inspector.historyActions()).toEqual(['position.0', 'position.1', 'position.2']);
});

test('component header toggle flips enabled', async ({ editorPage }) => {
    const inspector = new Inspector(editorPage);
    const id = await createEntity(editorPage, { name: uniqueName('entity'), components: { light: {} } });

    await selectEntities(editorPage, [id]);
    const enabled = inspector.componentEnabled('light');
    await expect(enabled.locator('.pcui-label')).toHaveText('ON');

    await inspector.toggleComponent('light');

    await expect.poll(() => entityValue(editorPage, id, 'components.light.enabled')).toBe(false);
    await expect(enabled.locator('.pcui-label')).toHaveText('OFF');

    await inspector.toggleComponent('light');

    await expect.poll(() => entityValue(editorPage, id, 'components.light.enabled')).toBe(true);
    await expect(enabled.locator('.pcui-label')).toHaveText('ON');
});

test('mixed values across a multi selection edit both entities', async ({ editorPage }) => {
    const inspector = new Inspector(editorPage);
    const first = await createEntity(editorPage, {
        name: uniqueName('entity'),
        components: { light: { intensity: 1 } }
    });
    const second = await createEntity(editorPage, {
        name: uniqueName('entity'),
        components: { light: { intensity: 4 } }
    });

    await selectEntities(editorPage, [first, second]);
    await expect(inspector.header).toHaveText('2 Entities');

    const light = inspector.component('light');
    await expect(inspector.field(light, 'Intensity').locator('.pcui-slider')).toHaveClass(/pcui-multiple-values/);

    await inspector.setNumber(light, 'Intensity', 7);

    await expect.poll(() => entityValue(editorPage, first, 'components.light.intensity')).toBe(7);
    await expect.poll(() => entityValue(editorPage, second, 'components.light.intensity')).toBe(7);

    await inspector.shell.undo();

    await expect.poll(() => entityValue(editorPage, first, 'components.light.intensity')).toBe(1);
    await expect.poll(() => entityValue(editorPage, second, 'components.light.intensity')).toBe(4);
});

test('unchecking Enabled disables the entity and its hierarchy row', async ({ editorPage }) => {
    const inspector = new Inspector(editorPage);
    const name = uniqueName('entity');
    const id = await createEntity(editorPage, { name });

    await selectEntities(editorPage, [id]);
    await expect(inspector.entity).toBeVisible();
    await expect(hierarchyRow(editorPage, name)).not.toHaveClass(/pcui-disabled/);

    await inspector.toggle(inspector.entityFields, 'Enabled');

    await expect.poll(() => entityValue(editorPage, id, 'enabled')).toBe(false);
    await expect(hierarchyRow(editorPage, name)).toHaveClass(/pcui-disabled/);
});

test('material diffuse colour picker edits the asset in one action', async ({ editorPage }) => {
    const inspector = new Inspector(editorPage);
    const id = await createMaterial(editorPage, uniqueName('material'));

    await selectAsset(editorPage, id);
    await expect(inspector.asset).toBeVisible();
    await expect(inspector.header).toHaveText('material');

    const diffuse = inspector.panel(inspector.assetType('material'), 'DIFFUSE');
    await inspector.expand(diffuse);

    const before = await assetValue(editorPage, id, 'data.diffuse');
    expect(before).toHaveLength(3);
    expect(before[0]).not.toBeCloseTo(64 / 255, 5);

    await inspector.recordHistory();
    await inspector.openColorPicker(diffuse, 'Color');
    await expect(inspector.colorPicker).toBeVisible();
    await inspector.setColorChannel('r', 64);

    await expect.poll(async () => (await assetValue(editorPage, id, 'data.diffuse'))[0]).toBeCloseTo(64 / 255, 5);
    const actions = await inspector.historyActions();
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatch(/^data\.diffuse/);
});

test('texture Mipmaps toggle flips the asset flag', async ({ editorPage }) => {
    const inspector = new Inspector(editorPage);
    const id = await createTexture(editorPage, `${uniqueName('texture')}.png`);

    await selectAsset(editorPage, id);
    await expect(inspector.asset).toBeVisible();
    await expect(inspector.header).toHaveText('texture');

    const texture = inspector.assetType('texture');
    const before = await assetValue(editorPage, id, 'data.mipmaps');

    await inspector.toggle(texture, 'Mipmaps');

    await expect.poll(() => assetValue(editorPage, id, 'data.mipmaps')).toBe(!before);
});
