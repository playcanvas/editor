import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../../lib/fixtures';
import { AssetsPanel } from '../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { Inspector } from '../../lib/pages/inspector';
import { uniqueName } from '../../lib/utils';

const INSPECTOR = '.asset-animstategraph-inspector:not(.pcui-hidden)';
const OPEN_BUTTON = '.asset-animstategraph-inspector-open-button';
const CLOSE_BUTTON = '.asset-animstategraph-inspector-close-button';
const GRAPH = '#layout-viewport .joint-paper';

const keys = (data: unknown) => Object.keys((data ?? {}) as Record<string, unknown>);

/** Opens the graph editor of the selected anim state graph and waits for the paper. */
const openGraph = async (page: Page, root: Locator) => {
    await root.locator(OPEN_BUTTON).click();
    await expect(page.locator(CLOSE_BUTTON)).toBeVisible();
    await expect(page.locator(GRAPH)).toBeVisible();
};

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;

test.beforeEach(async ({ editorPage }) => {
    baseline = await new EditorShell(editorPage).snapshot();
});

test.afterEach(async ({ editorPage }) => {
    await new EditorShell(editorPage).restore(baseline);
});

test('creates an anim state graph and opens and closes the graph editor', async ({ editorPage }) => {
    const assets = new AssetsPanel(editorPage);

    await assets.armAdd({ type: 'animstategraph' });
    await assets.newAsset('Anim State Graph');
    const asset = await assets.awaitAdd({ type: 'animstategraph' });

    expect(await assets.field(asset.id, 'type')).toBe('animstategraph');
    expect(asset.name).toMatch(/^New Anim State Graph( \(\d+\))?$/);
    await expect(assets.gridItem(asset.name)).toHaveClass(/type-animstategraph/);

    await assets.select(asset.name);
    const root = editorPage.locator(INSPECTOR);
    await expect(root.locator(OPEN_BUTTON)).toBeVisible();

    await openGraph(editorPage, root);
    await expect(root.locator(OPEN_BUTTON)).toBeHidden();

    // with nothing selected in the graph, escape closes the editor and clears the selection
    await editorPage.keyboard.press('Escape');
    await expect(editorPage.locator(CLOSE_BUTTON)).toHaveCount(0);
    await expect(editorPage.locator(GRAPH)).toBeHidden();
    await expect.poll(() => assets.selectedIds()).toEqual([]);
});

test('adds a state from the graph context menu', async ({ editorPage }) => {
    const assets = new AssetsPanel(editorPage);
    const asset = await assets.create('createAnimStateGraph', { name: uniqueName('graph') });

    await assets.select(asset.name);
    const root = editorPage.locator(INSPECTOR);
    await openGraph(editorPage, root);

    // opening the editor backfills the ANY and END states, so the baseline has to be
    // read after the graph has been generated
    const before = await assets.field(asset.id, 'data.states');
    const layer = (await assets.field(asset.id, 'data.layers')) as { states: number[] }[];
    expect(layer[0].states.length).toBeGreaterThan(0);

    const box = await editorPage.locator(GRAPH).boundingBox();
    if (!box) {
        throw new Error('graph paper is not visible');
    }

    // the start, any and end nodes sit in the top left corner, so pick blank space
    await editorPage.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.6, { button: 'right' });
    await new EditorShell(editorPage).menuItem('Add new state').first().click();

    await expect.poll(async () => keys(await assets.field(asset.id, 'data.states')).length).toBe(keys(before).length + 1);

    const states = (await assets.field(asset.id, 'data.states')) as Record<string, { name: string }>;
    const added = Object.keys(states).filter(key => !(key in (before as Record<string, unknown>)));
    expect(added).toHaveLength(1);
    expect(states[added[0]].name).toMatch(/^New state/);
    expect(await assets.field(asset.id, 'data.layers.0.states')).toContain(Number(added[0]));
});

test('adds a parameter from the parameters panel', async ({ editorPage }) => {
    const assets = new AssetsPanel(editorPage);
    const inspector = new Inspector(editorPage);
    const asset = await assets.create('createAnimStateGraph', { name: uniqueName('graph') });

    await assets.select(asset.name);
    const root = editorPage.locator(INSPECTOR);
    await openGraph(editorPage, root);

    const before = keys(await assets.field(asset.id, 'data.parameters'));
    const panel = inspector.panel(root, 'PARAMETERS');
    await expect(panel).toBeVisible();
    await panel.locator('.pcui-panel-header .pcui-button', { hasText: 'PARAMETER' }).click();

    await expect.poll(async () => keys(await assets.field(asset.id, 'data.parameters')).length).toBe(before.length + 1);

    const params = (await assets.field(asset.id, 'data.parameters')) as Record<string, { name: string; type: string }>;
    const added = Object.keys(params).filter(key => !before.includes(key));
    expect(added).toHaveLength(1);
    expect(params[added[0]].name).toBe(`New Parameter ${added[0]}`);
    await expect(inspector.field(panel, 'Name').locator('input')).toHaveValue(params[added[0]].name);
});
