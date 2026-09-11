import { expect, test } from '../../lib/fixtures';
import { EditorShell } from '../../lib/pages/common';
import { createScene, deleteScenes, sceneId, sceneList, ScenePicker } from '../../lib/pages/scenes';
import { SettingsDialog } from '../../lib/pages/settings';
import { uniqueName } from '../../lib/utils';

// scenes we made in a test; dropped over rest afterwards so the worker project keeps
// only the scene the project fixture created
let extra: number[] = [];

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

test('logo menu Scenes opens the picker on the loaded scene', async ({ editorPage, project }) => {
    const picker = new ScenePicker(editorPage);

    await picker.open();

    await expect(picker.root).toBeVisible();
    await expect(picker.current()).toHaveId(`picker-scene-${project.sceneId}`);
    await expect(picker.current().locator('.current-badge')).toHaveText('CURRENT');
    expect(await sceneId(editorPage)).toBe(project.sceneId);
});

test('New Scene creates a scene and switches the editor to it', async ({ editorPage, project }) => {
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

test('row menu Duplicate Scene adds a numbered copy', async ({ editorPage }) => {
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

test('Scene Name in settings renames the loaded scene everywhere', async ({ editorPage }) => {
    const picker = new ScenePicker(editorPage);
    const settings = new SettingsDialog(editorPage);
    const created = await createScene(editorPage, uniqueName('scene'));
    extra.push(created.id);

    // rename the scene we made, never the one the project fixture handed us
    expect(await picker.openRow(created.id)).toBe(created.id);
    const renamed = uniqueName('scene');
    await settings.open();
    await settings.setSceneName(renamed);

    await expect(picker.stripButton).toHaveText(renamed);
    await picker.open();
    await expect(picker.row(created.id).locator('.name')).toHaveText(renamed);
    const listed = expect.objectContaining({ id: created.id, name: renamed });
    await expect.poll(() => sceneList(editorPage)).toContainEqual(listed);
});

test('row menu Delete Scene confirms by name and drops the row', async ({ editorPage }) => {
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
    await expect.poll(() => sceneList(editorPage).then(list => list.map(s => s.id))).not.toContain(created.id);
});
