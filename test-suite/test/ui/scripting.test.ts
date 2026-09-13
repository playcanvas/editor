import type { Page } from '@playwright/test';

import { createEsmScript } from '../../lib/common';
import { JOB_TEST_TIMEOUT, JOB_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { AssetsPanel } from '../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { Inspector } from '../../lib/pages/inspector';
import { waitForEditor } from '../../lib/ready';
import { uniqueName } from '../../lib/utils';

// scripts:handleParse is registered only once the script worker has finished init
const WORKER_INIT_TIMEOUT = 30_000;

// a pcui panel holds its children in a content container, so the component panel's own
// widgets are one level down from its root
const SCRIPTS_CONTAINER = '> .pcui-panel-content > .script-component-inspector-scripts';
const SCRIPT_PANEL = '> .script-component-inspector-script';

const esm = (name: string, jsdoc = '/** @attribute */', init = ' = 1') => `import { Script } from 'playcanvas';

export class Test extends Script {
    static scriptName = '${name}';

    ${jsdoc}
    speed${init};
}
`;

const classic = (name: string) => `var Foo = pc.createScript('${name}');
Foo.attributes.add('speed', { type: 'number', default: 1 });
`;

// the script asset inspector never puts a class on its own root, so it is only
// reachable as the SCRIPTS panel of the asset inspector
const assetScripts = (page: Page) => {
    return new Inspector(page).panel(page.locator('#layout-attributes .asset-inspector'), 'SCRIPTS');
};

const waitForParser = (page: Page) => {
    return page.waitForFunction(() => (window.editor as any).methods.has('scripts:handleParse'), null, { timeout: WORKER_INIT_TIMEOUT });
};

const createScript = async (page: Page, filename: string, text: string) => {
    await waitForParser(page);
    return page.evaluate(([name, body]) => {
        return window.editor.api.globals.assets
        .createScript({ filename: name, text: body })
        .then((asset: any) => asset.get('id') as number);
    }, [filename, text] as const);
};

/** Replaces the file of a script asset and waits for the new hash to land. */
const setText = async (page: Page, id: number, text: string) => {
    const hash = await page.evaluate(assetId => window.editor.api.globals.assets.get(assetId)?.get('file.hash') as string, id);
    await page.evaluate(async ([assetId, body]) => {
        const assets = window.editor.api.globals.assets;
        const asset = assets.get(assetId as number);
        if (!asset) {
            throw new Error(`asset ${assetId} not found`);
        }
        await assets.upload({
            id: asset.get('id'),
            type: 'script',
            filename: asset.get('file.filename'),
            file: new Blob([body as string], { type: 'text/javascript' })
        });
    }, [id, text] as const);
    await page.waitForFunction(([assetId, old]) => {
        return window.editor.api.globals.assets.get(assetId as number)?.get('file.hash') !== old;
    }, [id, hash] as const);
};

const addScript = (page: Page, entityId: string, name: string) => {
    return page.evaluate(([id, script]) => {
        const entity = window.editor.api.globals.entities.get(id);
        if (!entity) {
            throw new Error(`entity ${id} not found`);
        }
        return window.editor.api.globals.entities.addScript([entity], script);
    }, [entityId, name] as const);
};

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;

test.beforeEach(async ({ editorPage }) => {
    baseline = await new EditorShell(editorPage).snapshot();
});

test.afterEach(async ({ editorPage }) => {
    await new EditorShell(editorPage).restore(baseline);
});

test('creates an esm script and shows its attributes in the asset inspector', async ({ editorPage }) => {
    test.setTimeout(JOB_TEST_TIMEOUT);
    const assets = new AssetsPanel(editorPage);
    const name = uniqueName('esm');
    const filename = `${name}.mjs`;

    const id = await createScript(editorPage, filename, esm(name));

    expect(await assets.field(id, 'type')).toBe('script');
    expect(await assets.field(id, 'name')).toBe(filename);
    await expect.poll(() => assets.field(id, `data.scripts.${name}.attributes.speed.type`), { timeout: JOB_TIMEOUT }).toBe('number');

    await assets.select(filename);
    const inspector = assetScripts(editorPage);
    await expect(inspector).toBeVisible();
    await expect(inspector.locator('.script-asset-inspector-script')).toHaveText([name]);
    await expect(inspector.locator('.script-asset-inspector-attribute')).toHaveText(['speed']);
});

test('creates a classic script from the new asset menu and parses its attributes', async ({ editorPage }) => {
    test.setTimeout(JOB_TEST_TIMEOUT);
    const assets = new AssetsPanel(editorPage);
    const name = uniqueName('classic');
    const filename = `${name}.js`;

    await waitForParser(editorPage);
    await assets.armAdd({ name: filename });
    await assets.newAsset('Script');

    const picker = editorPage.locator('.picker-script-create');
    await expect(picker).toBeVisible();
    const nameInput = picker.locator('.pcui-text-input input');
    await nameInput.pressSequentially(filename);
    await nameInput.press('Enter');
    await expect(picker).toBeHidden();

    const asset = await assets.awaitAdd({ name: filename });
    expect(await assets.field(asset.id, 'type')).toBe('script');
    await expect(assets.gridItem(filename)).toBeVisible();

    // the boilerplate declares a script but no attributes, so the rows only appear
    // once the file carries one and the asset inspector re-parses it
    await expect.poll(() => assets.field(asset.id, 'data.scripts'), { timeout: JOB_TIMEOUT }).not.toEqual({});
    await setText(editorPage, asset.id, classic(name));

    await assets.select(filename);
    const inspector = assetScripts(editorPage);
    await expect(inspector).toBeVisible();
    await inspector.locator('.pcui-panel-header .pcui-button', { hasText: 'PARSE' }).click();

    await expect(inspector.locator('.script-asset-inspector-attribute')).toHaveText(['speed'], { timeout: JOB_TIMEOUT });
    await expect(inspector.locator('.script-asset-inspector-script')).toHaveText([name]);
    expect(await assets.field(asset.id, `data.scripts.${name}.attributes.speed.type`)).toBe('number');
});

test('reports an invalid jsdoc attribute type in the asset inspector', async ({ editorPage, errors }) => {
    test.setTimeout(JOB_TEST_TIMEOUT);
    errors.allow(/There was an error while parsing script asset/);
    const assets = new AssetsPanel(editorPage);
    const name = uniqueName('invalid');
    const filename = `${name}.mjs`;

    // an invalid parse result is never sent to the backend, so the script has to be
    // created valid and then broken, otherwise createScript times out waiting for it
    const id = await createScript(editorPage, filename, esm(name));
    await expect.poll(() => assets.field(id, `data.scripts.${name}.attributes.speed`), { timeout: JOB_TIMEOUT }).toBeTruthy();
    const parsed = await assets.field(id, 'data.scripts');
    await setText(editorPage, id, esm(name, '/**\n     * @attribute\n     * @type {Function}\n     */', ''));

    await assets.select(filename);
    const inspector = assetScripts(editorPage);
    await expect(inspector).toBeVisible();
    await inspector.locator('.pcui-panel-header .pcui-button', { hasText: 'PARSE' }).click();

    const errorContainer = inspector.locator('.script-asset-inspector-attribute-error-container');
    await expect(errorContainer).toBeVisible({ timeout: JOB_TIMEOUT });
    await expect(errorContainer.locator('.pcui-error').first()).toHaveText('This script contains invalid attributes:');
    await expect(errorContainer.locator('.pcui-error').filter({ hasText: /is not a valid attribute type/ })).toHaveCount(1);
    await expect(inspector.locator('.script-asset-inspector-attribute')).toHaveCount(0);

    // a result with errors never reaches the backend, so the stored attributes stand
    expect(await assets.field(id, 'data.scripts')).toEqual(parsed);
});

test('adds and removes a script through the component inspector', async ({ editorPage }) => {
    test.setTimeout(JOB_TEST_TIMEOUT);
    const hierarchy = new HierarchyPanel(editorPage);
    const inspector = new Inspector(editorPage);
    const name = uniqueName('attach');

    await createScript(editorPage, `${name}.mjs`, esm(name));

    const entityName = uniqueName('scripted');
    const entityId = await hierarchy.createEntity({ name: entityName });
    await hierarchy.select(entityName);
    await inspector.addComponent(['Script']);
    await expect(inspector.component('script')).toBeVisible();

    const select = inspector.component('script').locator('> .pcui-panel-content > .pcui-select-input');
    await select.locator('.pcui-select-input-textinput input').click();
    await select.locator(`.pcui-select-input-list > [id="${name}"]`).click();

    await expect.poll(() => hierarchy.get(entityId, 'components.script.order'), { timeout: JOB_TIMEOUT }).toEqual([name]);
    const panel = inspector.component('script').locator(SCRIPTS_CONTAINER).locator(SCRIPT_PANEL);
    await expect(panel.locator('.pcui-panel-header-title').first()).toHaveText(name);
    expect(await hierarchy.get(entityId, `components.script.scripts.${name}.enabled`)).toBe(true);

    await panel.locator('.component-header-btn').click();
    await inspector.shell.menuItem('Remove Script').first().click();
    await expect.poll(() => hierarchy.get(entityId, 'components.script.order')).toEqual([]);
    await expect(panel).toHaveCount(0);

    await inspector.shell.undo();
    await expect.poll(() => hierarchy.get(entityId, 'components.script.order'), { timeout: JOB_TIMEOUT }).toEqual([name]);
    await expect(inspector.component('script').locator(SCRIPTS_CONTAINER).locator(SCRIPT_PANEL)).toHaveCount(1);

    await hierarchy.remove([entityId]);
});

test('reorders two scripts by dragging and keeps the order after a reload', async ({ editorPage }) => {
    test.setTimeout(JOB_TEST_TIMEOUT);
    const hierarchy = new HierarchyPanel(editorPage);
    const inspector = new Inspector(editorPage);
    const first = uniqueName('first');
    const second = uniqueName('second');

    await createScript(editorPage, `${first}.mjs`, esm(first));
    await createScript(editorPage, `${second}.mjs`, esm(second));

    const entityName = uniqueName('ordered');
    const entityId = await hierarchy.createEntity({ name: entityName });
    await addScript(editorPage, entityId, first);
    await addScript(editorPage, entityId, second);
    expect(await hierarchy.get(entityId, 'components.script.order')).toEqual([first, second]);

    await hierarchy.select(entityName);
    const container = inspector.component('script').locator(SCRIPTS_CONTAINER);
    const panels = container.locator(SCRIPT_PANEL);
    await expect(panels).toHaveCount(2);

    // the sortable handle opens the drag on mousedown and pcui then tracks plain mouse
    // events, so the pointer has to travel past the bottom of the second panel
    const handle = panels.first().locator('.pcui-panel-sortable-icon');
    const from = await handle.boundingBox();
    const target = await panels.nth(1).boundingBox();
    const bounds = await container.boundingBox();
    if (!from || !target || !bounds) {
        throw new Error('script panels are not visible');
    }
    await editorPage.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await editorPage.mouse.down();
    await editorPage.mouse.move(from.x + from.width / 2, Math.min(target.y + target.height - 2, bounds.y + bounds.height - 2), { steps: 10 });
    await editorPage.mouse.up();

    await expect.poll(() => hierarchy.get(entityId, 'components.script.order')).toEqual([second, first]);
    expect(await inspector.shell.history()).toMatchObject({ canUndo: true, last: `entity.${entityId}.components.script.order` });

    await editorPage.reload();
    await waitForEditor(editorPage);
    expect(await hierarchy.get(entityId, 'components.script.order')).toEqual([second, first]);

    await hierarchy.remove([entityId]);
});

test('registers the parse method after the script worker starts', async ({ editorPage }) => {
    test.setTimeout(JOB_TEST_TIMEOUT);
    const assets = new AssetsPanel(editorPage);

    // the parse path is registered from the worker init callback, and a Caller.call for
    // an unregistered method is dropped silently, so createScript hangs if it is early.
    // waitForParser throws if the registration never lands
    await waitForParser(editorPage);

    const filename = `${uniqueName('race')}.mjs`;
    const id = await createEsmScript(editorPage, filename);

    expect(await assets.field(id, 'type')).toBe('script');
    await expect.poll(async () => Object.keys((await assets.field(id, 'data.scripts')) ?? {}), { timeout: JOB_TIMEOUT }).not.toEqual([]);
});
