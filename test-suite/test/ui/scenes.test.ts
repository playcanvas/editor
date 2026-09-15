import { expect, test } from '../../lib/fixtures';
import { EditorShell } from '../../lib/pages/common';
import { createScene, deleteScenes, sceneId, sceneList, ScenePicker } from '../../lib/pages/scenes';
import { SettingsDialog } from '../../lib/pages/settings';
import { waitForEditor } from '../../lib/ready';
import { uniqueName } from '../../lib/utils';

// scenes we made in a test; dropped over rest afterwards so the worker project keeps
// only the scene the project fixture created
let extra: number[] = [];

test.describe('scenes', { tag: '@gate' }, () => {
    test.beforeEach(() => {
        extra = [];
    });

    test.afterEach(async ({ editorPage, project }) => {
        if (!extra.length) {
            return;
        }

        // deleting the loaded scene sends the editor back to the project url, so step off it first
        if (extra.includes(await sceneId(editorPage))) {
            await new ScenePicker(editorPage).openRow(project.sceneId);
        }
        await deleteScenes(editorPage, extra);
    });

    test('open scene picker', async ({ editorPage, project }) => {
        const picker = new ScenePicker(editorPage);

        await picker.open();

        await expect(picker.root).toBeVisible();
        await expect(picker.current()).toHaveId(`picker-scene-${project.sceneId}`);
        await expect(picker.current().locator('.current-badge')).toHaveText('CURRENT');
        expect(await sceneId(editorPage)).toBe(project.sceneId);
    });

    test('create scene', async ({ editorPage, project }) => {
        const picker = new ScenePicker(editorPage);
        const name = uniqueName('scene');

        const id = await picker.newScene(name);
        extra.push(id);

        expect(id).not.toBe(project.sceneId);
        expect(editorPage.url()).toContain(`/editor/scene/${id}`);
        expect(await sceneList(editorPage)).toContainEqual(expect.objectContaining({ id, name }));

        // the picker closes itself on Enter, so reopen it to see the new row
        await picker.open();
        await expect(picker.row(id).locator('.name')).toHaveText(name);
        await expect(picker.current()).toHaveId(`picker-scene-${id}`);
    });

    test('duplicate scene', async ({ editorPage }) => {
        const picker = new ScenePicker(editorPage);
        const name = uniqueName('scene');
        const source = await createScene(editorPage, name);
        extra.push(source.id);

        await picker.open();
        await picker.rowMenu(source.id, 'Duplicate Scene');

        // the copy lands through the messenger, so wait on the row the refresh renders
        const copy = picker.rowByName(`${name} 2`);
        await expect(copy).toBeVisible();
        const copyId = Number((await copy.getAttribute('id'))?.replace('picker-scene-', ''));
        extra.push(copyId);

        expect(copyId).not.toBe(source.id);
        expect(await sceneList(editorPage)).toContainEqual(expect.objectContaining({ id: copyId, name: `${name} 2` }));
    });

    test('rename scene', async ({ editorPage }) => {
        const picker = new ScenePicker(editorPage);
        const settings = new SettingsDialog(editorPage);
        const created = await createScene(editorPage, uniqueName('scene'));
        extra.push(created.id);

        // rename the scene we made, never the one the project fixture handed us
        expect(await picker.openRow(created.id)).toBe(created.id);
        const renamed = uniqueName('scene');
        await settings.open();
        const named = await picker.armName();
        await settings.setSceneName(renamed);

        expect(await named()).toBe(renamed);
        expect(await picker.stripName()).toBe(renamed);
        await new EditorShell(editorPage).flushScene();
        await picker.open();
        await expect(picker.row(created.id).locator('.name')).toHaveText(renamed);
        const listed = expect.objectContaining({ id: created.id, name: renamed });
        expect(await sceneList(editorPage)).toContainEqual(listed);
    });

    test('delete scene', async ({ editorPage }) => {
        const picker = new ScenePicker(editorPage);
        const shell = new EditorShell(editorPage);
        const name = uniqueName('scene');
        const created = await createScene(editorPage, name);

        // kept in the cleanup list so a mid-test failure still drops it
        extra.push(created.id);

        await picker.open();
        await picker.rowMenu(created.id, 'Delete Scene');

        await expect(shell.confirm.text).toHaveText(`Are you sure you want to permanently delete scene '${name}'?`);
        await shell.confirm.yes.click();

        await expect(picker.row(created.id)).toHaveCount(0);
        expect((await sceneList(editorPage)).map(scene => scene.id)).not.toContain(created.id);
    });
    test('switch scene', async ({ editorPage, project }) => {
        const picker = new ScenePicker(editorPage);
        const name = uniqueName('scene');
        const created = await createScene(editorPage, name);
        extra.push(created.id);

        const named = await picker.armName();
        expect(await picker.openRow(created.id)).toBe(created.id);

        expect(await named()).toBe(name);
        expect(await picker.stripName()).toBe(name);
        await expect(editorPage.locator('#layout-hierarchy .entities-treeview')).toBeVisible();

        // a fresh scene carries its own root, so the switch has to rebuild the hierarchy
        expect(await editorPage.evaluate(() => window.editor.call('entities:loaded'))).toBe(true);

        expect(await picker.openRow(project.sceneId)).toBe(project.sceneId);

        // loading a row closes the picker, so reopen it to read the current badge back
        await picker.open();
        await expect(picker.current()).toHaveId(`picker-scene-${project.sceneId}`);
    });

    test('persist scene settings', async ({ editorPage }) => {
        const settings = new SettingsDialog(editorPage);
        const shell = new EditorShell(editorPage);
        const before = await settings.sceneSetting('physics.gravity');

        await settings.open();
        await settings.expand('PHYSICS');
        const gravity = settings.field('PHYSICS', 'Gravity').locator('.pcui-numeric-input input');
        const changed = await settings.armSetting('scene', 'physics.gravity', [before[0], -5, before[2]]);
        await gravity.nth(1).fill('-5');
        await gravity.nth(1).press('Enter');
        await changed();
        expect((await settings.sceneSetting('physics.gravity'))[1]).toBe(-5);

        // scene settings ride the scene sharedb doc, so flush it before the reload reads back
        await shell.flushScene();
        await editorPage.reload();
        await waitForEditor(editorPage);

        expect(await settings.sceneSetting('physics.gravity')).toEqual([before[0], -5, before[2]]);

        await settings.setSceneSetting('physics.gravity', before);
        await shell.flushScene();
    });
});
