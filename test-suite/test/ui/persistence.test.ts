import type { Page } from '@playwright/test';

import { expect, test } from '../../lib/fixtures';
import { AssetsPanel } from '../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { ScenePicker, deleteScenes, sceneId, sceneList } from '../../lib/pages/scenes';
import { SettingsDialog } from '../../lib/pages/settings';
import { waitForEditor } from '../../lib/ready';
import { uniqueName } from '../../lib/utils';

const reload = async (page: Page) => {
    await page.reload();
    await waitForEditor(page);
};

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;
let extra: number[] = [];

test.describe('persistence', () => {
    test.beforeEach(async ({ editorPage }) => {
        extra = [];
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage, project }) => {
        if (extra.length) {
            // deleting the loaded scene sends the editor back to the project url, so step off it
            if (extra.includes(await sceneId(editorPage))) {
                await new ScenePicker(editorPage).openRow(project.sceneId);
            }
            await deleteScenes(editorPage, extra);
        }
        await new EditorShell(editorPage).restore(baseline);
    });

    test('persist entity create', async ({ editorPage }) => {
        const hierarchy = new HierarchyPanel(editorPage);
        const shell = new EditorShell(editorPage);
        const parent = uniqueName('ent');
        await hierarchy.createEntity({ name: parent });

        await hierarchy.select(parent);
        await hierarchy.add('3D', 'Box');
        await expect(hierarchy.childRow(parent, 'Box')).toHaveCount(1);
        const { ids } = await hierarchy.selection();
        await shell.flushScene();

        await reload(editorPage);

        expect(await hierarchy.exists(ids[0])).toBe(true);
        expect(await hierarchy.get(ids[0], 'components.render.type')).toBe('box');
        await expect(hierarchy.childRow(parent, 'Box')).toHaveCount(1);
    });

    test('persist asset delete', async ({ editorPage }) => {
        const assets = new AssetsPanel(editorPage);
        const asset = await assets.create('createText', { name: `${uniqueName('txt')}.txt`, text: 'doomed' });

        await assets.select(asset.name);
        await assets.deleteButton.click();
        await assets.shell.confirm.yes.click();
        await assets.waitForRemove(asset.id);

        await reload(editorPage);

        expect(await assets.exists(asset.id)).toBe(false);
        await expect(assets.gridItem(asset.name)).toHaveCount(0);
    });

    test('persist scene rename', async ({ editorPage }) => {
        const picker = new ScenePicker(editorPage);
        const settings = new SettingsDialog(editorPage);
        const id = await picker.newScene(uniqueName('scene'));
        extra.push(id);

        const renamed = uniqueName('scene');
        await settings.open();
        const named = await picker.armName();
        await settings.setSceneName(renamed);
        expect(await named()).toBe(renamed);
        expect(await picker.stripName()).toBe(renamed);

        await reload(editorPage);

        expect(await sceneId(editorPage)).toBe(id);
        expect(await picker.stripName()).toBe(renamed);
        expect(await sceneList(editorPage)).toContainEqual(expect.objectContaining({ id, name: renamed }));
    });

    test('persist asset move', async ({ editorPage }) => {
        const assets = new AssetsPanel(editorPage);
        const folder = await assets.create('createFolder', { name: uniqueName('folder') });
        const moved = await assets.create('createText', { name: `${uniqueName('txt')}.txt`, text: 'move me' });

        await expect(assets.gridItem(moved.name)).toBeVisible();
        await assets.dragToFolder(moved.name, folder.name);
        await assets.waitForParent(moved.id, folder.id);
        await editorPage.evaluate(id => new Promise<void>((resolve) => {
            const globals = window.editor.api.globals;
            globals.realtime.assets.get(globals.assets.get(id)!.get('uniqueId')).whenNothingPending(resolve);
        }), moved.id);

        await reload(editorPage);

        expect(await assets.field(moved.id, 'path')).toEqual([folder.id]);
        expect(await assets.childrenOf(folder.id)).toEqual([
            expect.objectContaining({ id: moved.id, name: moved.name })
        ]);
    });
});
