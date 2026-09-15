import { readFileSync } from 'node:fs';

import type { Page } from '@playwright/test';

import { JOB_TEST_TIMEOUT, JOB_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { AssetsPanel } from '../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { Inspector } from '../../lib/pages/inspector';
import { uniqueName } from '../../lib/utils';

const PNG = readFileSync(new URL('../fixtures/files/test.png', import.meta.url));
const EDITOR = '#sprite-editor';

const keys = (data: unknown) => Object.keys((data ?? {}) as Record<string, unknown>);

/**
 * Uploads the fixture png and turns it into a texture atlas. The duplicate keeps the
 * texture's name, so the atlas grid item can only be told apart by its type class.
 */
const createAtlas = async (page: Page) => {
    const assets = new AssetsPanel(page);
    const name = `${uniqueName('atlas')}.png`;

    await assets.armAdd({ name });
    await assets.upload({ name, mimeType: 'image/png', buffer: PNG });
    const texture = await assets.awaitAdd({ name });
    await assets.waitForTask(texture.id, JOB_TIMEOUT);

    await assets.armAdd({ type: 'textureatlas' });
    await assets.contextMenu(name, 'Create Texture Atlas');
    const atlas = await assets.awaitAdd({ type: 'textureatlas' });
    await assets.waitForTask(atlas.id, JOB_TIMEOUT);

    return { texture, atlas, item: page.locator(`.pcui-asset-grid-view-item.type-textureatlas:has(> .pcui-gridview-item-text:text-is("${atlas.name}"))`) };
};

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;

test.describe('sprite-editor', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        await new EditorShell(editorPage).restore(baseline);
    });

    test('create texture atlas', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const assets = new AssetsPanel(editorPage);
        const { texture, atlas, item } = await createAtlas(editorPage);

        expect(await assets.field(atlas.id, 'type')).toBe('textureatlas');
        expect(await assets.field(atlas.id, 'source')).toBe(false);
        expect(atlas.id).not.toBe(texture.id);
        await expect(item).toBeVisible();

        await item.dblclick();
        const editor = editorPage.locator(EDITOR);
        await expect(editor).toBeVisible();
        await expect(editor.locator('.root-panel > .pcui-panel-header > .pcui-panel-header-title')).toHaveText(`SPRITE EDITOR - ${atlas.name.toUpperCase()}`);
        await expect(editor.locator('.left-panel')).toBeVisible();

        await editor.locator('.root-panel > .pcui-panel-header > .close').click();
        await expect(editor).toBeHidden();
    });

    test('generate frames and undo', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const assets = new AssetsPanel(editorPage);
        const inspector = new Inspector(editorPage);
        const { atlas, item } = await createAtlas(editorPage);

        await item.dblclick();
        const editor = editorPage.locator(EDITOR);
        await expect(editor).toBeVisible();

        // the right panel is only built once the atlas image has loaded
        const panel = inspector.panel(editor, 'GENERATE FRAMES');
        await expect(panel).toBeVisible();
        // a fresh atlas carries no frames, so the undo below has to empty it again
        const before = keys(await assets.field(atlas.id, 'data.frames'));
        expect(before).toEqual([]);

        await panel.locator('.pcui-button', { hasText: 'GENERATE FRAMES' }).click();

        await expect.poll(async () => keys(await assets.field(atlas.id, 'data.frames')).length).toBe(before.length + 1);
        const frames = (await assets.field(atlas.id, 'data.frames')) as Record<string, { rect: number[]; pivot: number[] }>;
        const added = Object.keys(frames).filter(key => !before.includes(key));
        expect(added).toHaveLength(1);

        // the fixture png is 2x2 and the default grid is one frame covering all of it
        expect(frames[added[0]].rect).toEqual([0, 0, 2, 2]);
        expect(frames[added[0]].pivot).toEqual([0.5, 0.5]);
        expect(await inspector.shell.history()).toMatchObject({ canUndo: true, last: 'slice' });

        await inspector.shell.undo();
        await expect.poll(async () => keys(await assets.field(atlas.id, 'data.frames'))).toEqual(before);
    });
});
