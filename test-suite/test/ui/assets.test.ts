import { readFileSync } from 'node:fs';

import { JOB_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { AssetsPanel, VIEW_DETAILS } from '../../lib/pages/assets';
import { uniqueName } from '../../lib/utils';

const PNG = readFileSync(new URL('../fixtures/files/test.png', import.meta.url));
const PNG_SIZE = `${PNG.length.toPrecision(3)} B`;
// job-backed tests wait up to JOB_TIMEOUT, so their own budget has to be larger
const JOB_TEST_TIMEOUT = 4 * 60 * 1000;
const HIGHLIGHTED = /pcui-asset-panel-highlighted-asset/;
const SELECTED = /pcui-gridview-item-selected/;
// selection is the only asset action that reaches the history stack
const SELECTION_ACTION = /^(select|deselect)$/;

const txt = () => `${uniqueName('txt')}.txt`;

test('creates a folder from the new asset menu', async ({ editorPage }) => {
    const assets = new AssetsPanel(editorPage);
    const before = (await assets.visibleNames()).length;

    await assets.armAdd({ type: 'folder' });
    await assets.newAsset('Folder');
    const folder = await assets.awaitAdd({ type: 'folder' });

    // createFolder defaults to "folder" and suffixes on collision
    expect(folder.name).toMatch(/^folder( \(\d+\))?$/);
    expect(await assets.field(folder.id, 'type')).toBe('folder');
    expect(await assets.idByName(folder.name)).toBe(folder.id);

    await expect(assets.gridItem(folder.name)).toHaveClass(/type-folder/);
    await expect(assets.folderTreeItem(folder.name)).toBeVisible();
    await expect.poll(async () => (await assets.visibleNames()).length).toBe(before + 1);
});

test('navigates into a folder and back', async ({ editorPage }) => {
    const assets = new AssetsPanel(editorPage);
    const folder = await assets.create('createFolder', { name: uniqueName('folder') });
    const json = await assets.create('createJson', { name: `${uniqueName('data')}.json`, json: { e2e: true } }, folder.id);

    await expect(assets.gridItem(folder.name)).toBeVisible();
    await expect(assets.gridItem(json.name)).toBeHidden();

    await assets.gridItem(folder.name).dblclick();
    await expect.poll(() => assets.currentFolderId()).toBe(folder.id);
    await expect.poll(() => assets.visibleNames()).toEqual([json.name]);
    await expect(assets.gridItem(json.name)).toBeVisible();
    await expect(assets.folderTreeItem(folder.name)).toHaveClass(/pcui-asset-panel-current-folder/);

    await assets.backButton.click();
    await expect.poll(() => assets.currentFolderId()).toBe(null);
    await expect(assets.gridItem(folder.name)).toBeVisible();
    await expect(assets.gridItem(json.name)).toBeHidden();
});

test('deletes an asset from the panel and keeps it on cancel', async ({ editorPage }) => {
    const assets = new AssetsPanel(editorPage);
    const doomed = await assets.create('createText', { name: txt(), text: 'delete me' });
    const kept = await assets.create('createText', { name: txt(), text: 'keep me' });

    await assets.select(doomed.name);
    await expect.poll(() => assets.selectedIds()).toEqual([doomed.id]);
    await assets.deleteButton.click();
    await expect(assets.shell.confirm.text).toHaveText(`Permanently delete asset '${doomed.name}'?`);
    await assets.shell.confirm.yes.click();

    await assets.waitForRemove(doomed.id);
    await expect(assets.gridItem(doomed.name)).toHaveCount(0);

    await assets.select(kept.name);
    await assets.deleteButton.click();
    await expect(assets.shell.confirm.text).toHaveText(`Permanently delete asset '${kept.name}'?`);
    await assets.shell.confirm.no.click();

    await expect(assets.shell.confirm.root).toBeHidden();
    expect(await assets.exists(kept.id)).toBe(true);
    await expect(assets.gridItem(kept.name)).toBeVisible();
});

test('deletes a multi-selection from the context menu', async ({ editorPage }) => {
    const assets = new AssetsPanel(editorPage);
    const first = await assets.create('createText', { name: txt(), text: 'one' });
    const second = await assets.create('createText', { name: txt(), text: 'two' });

    await assets.select(first.name);
    await assets.addToSelection(second.name);
    await expect(assets.gridItem(first.name)).toHaveClass(SELECTED);
    await expect(assets.gridItem(second.name)).toHaveClass(SELECTED);
    await expect.poll(async () => (await assets.selectedIds()).sort()).toEqual([first.id, second.id].sort());

    await assets.contextMenu(second.name, 'Delete');
    await expect(assets.shell.confirm.text).toHaveText('Permanently delete 2 assets?');
    await assets.shell.confirm.yes.click();

    await assets.waitForRemove(first.id);
    await assets.waitForRemove(second.id);
    await expect(assets.gridItem(first.name)).toHaveCount(0);
    await expect(assets.gridItem(second.name)).toHaveCount(0);
});

test('moves an asset by dragging it onto a folder', async ({ editorPage }) => {
    const assets = new AssetsPanel(editorPage);
    const folder = await assets.create('createFolder', { name: uniqueName('folder') });
    const moved = await assets.create('createText', { name: txt(), text: 'move me' });

    await expect(assets.gridItem(moved.name)).toBeVisible();
    expect(await assets.field(moved.id, 'path')).toEqual([]);

    await assets.dragToFolder(moved.name, folder.name);

    await assets.waitForParent(moved.id, folder.id);
    expect(await assets.field(moved.id, 'path')).toEqual([folder.id]);
    await expect(assets.gridItem(moved.name)).toBeHidden();
    await expect(assets.folderTreeItem(folder.name)).not.toHaveClass(HIGHLIGHTED);
    await expect.poll(() => assets.visibleNames()).not.toContain(moved.name);
});

test('renames from the inspector and rejects a duplicate name', async ({ editorPage }) => {
    const assets = new AssetsPanel(editorPage);
    const asset = await assets.create('createText', { name: txt(), text: 'rename me' });
    const sibling = await assets.create('createText', { name: txt(), text: 'sibling' });

    await assets.select(asset.name);
    await expect(assets.nameField).toHaveValue(asset.name);

    const renamed = txt();
    await assets.rename(renamed);
    await expect.poll(() => assets.field(asset.id, 'name')).toBe(renamed);
    await expect(assets.gridItem(renamed)).toBeVisible();
    await expect(assets.gridItem(asset.name)).toHaveCount(0);
    expect(await assets.shell.history()).toMatchObject({ canUndo: true, last: 'asset rename' });

    // a sibling text asset with the same name is refused and nothing changes
    await assets.rename(sibling.name);
    await expect(assets.renameError).toHaveText(`An asset named "${sibling.name}" already exists in this folder. Please choose a different name.`);
    expect(await assets.field(asset.id, 'name')).toBe(renamed);
    expect(await assets.field(sibling.id, 'name')).toBe(sibling.name);

    // escape leaves the name field so the undo hotkey reaches the editor
    await assets.nameField.press('Escape');
    expect(await assets.shell.history()).toMatchObject({ last: 'asset rename' });
    await assets.shell.undo();
    await expect.poll(() => assets.field(asset.id, 'name')).toBe(asset.name);
    await expect(assets.gridItem(asset.name)).toBeVisible();
});

test('filters by tag and by type', async ({ editorPage }) => {
    const assets = new AssetsPanel(editorPage);
    const tagged = await assets.create('createText', { name: txt(), text: 'tagged' });
    const material = await assets.create('createMaterial', { name: uniqueName('mat') });
    const tag = uniqueName('tag');

    await assets.addTag(tagged.id, tag);
    expect(await assets.field(tagged.id, 'tags')).toEqual([tag]);
    const baseline = (await assets.visibleNames()).length;

    await assets.typeSearch(`[${tag}]`);
    await expect.poll(() => assets.visibleNames()).toEqual([tagged.name]);
    await expect.poll(() => assets.visibleGridItems.count()).toBe(1);

    await assets.clearSearch.click();
    await expect.poll(async () => (await assets.visibleNames()).length).toBe(baseline);

    await assets.filterType('material');
    await expect.poll(() => assets.visibleNames()).toContain(material.name);
    await expect.poll(async () => (await assets.visibleNames()).length).toBe(await assets.countOfType('material'));
    await expect.poll(() => assets.visibleGridItems.count()).toBe(await assets.countOfType('material'));
    expect(await assets.visibleNames()).not.toContain(tagged.name);

    await assets.filterType('all');
    await expect.poll(async () => (await assets.visibleNames()).length).toBe(baseline);
    await expect.poll(() => assets.visibleGridItems.count()).toBe(baseline);
});

test('uploads a png and lists it in the details view', async ({ editorPage }) => {
    test.setTimeout(JOB_TEST_TIMEOUT);
    const assets = new AssetsPanel(editorPage);
    const name = `${uniqueName('tex')}.png`;

    await assets.armAdd({ name });
    await assets.upload({ name, mimeType: 'image/png', buffer: PNG });
    const uploaded = await assets.awaitAdd({ name });

    expect(await assets.field(uploaded.id, 'type')).toBe('texture');
    expect(await assets.field(uploaded.id, 'source')).toBe(false);
    await assets.waitForTask(uploaded.id, JOB_TIMEOUT);
    expect(await assets.field(uploaded.id, 'file.size')).toBe(PNG.length);
    await expect(assets.gridItem(name)).toHaveClass(/type-texture/);

    await assets.setViewMode(VIEW_DETAILS);
    expect(await assets.viewMode()).toBe(VIEW_DETAILS);
    const row = assets.detailsRow(name);
    await expect(row).toBeVisible();
    await expect(row).toContainText('Texture');
    await expect(row).toContainText(PNG_SIZE);
});

test('copies an asset and pastes it into a folder', async ({ editorPage }) => {
    test.setTimeout(JOB_TEST_TIMEOUT);
    const assets = new AssetsPanel(editorPage);
    const folder = await assets.create('createFolder', { name: uniqueName('folder') });
    const material = await assets.create('createMaterial', { name: uniqueName('mat') });

    await assets.select(material.name);
    await editorPage.keyboard.press('ControlOrMeta+C');
    await expect.poll(() => assets.clipboardAssetIds()).toEqual([material.id]);

    await assets.gridItem(folder.name).dblclick();
    await expect.poll(() => assets.currentFolderId()).toBe(folder.id);
    expect(await assets.childrenOf(folder.id)).toEqual([]);

    await editorPage.keyboard.press('ControlOrMeta+V');
    await expect.poll(() => assets.childrenOf(folder.id), { timeout: JOB_TIMEOUT }).toHaveLength(1);

    const [pasted] = await assets.childrenOf(folder.id);
    expect(pasted.id).not.toBe(material.id);
    expect(pasted.type).toBe('material');
    // a paste into another folder has no name to dodge, so the copy keeps it
    expect(pasted.name).toBe(material.name);
    expect(await assets.field(pasted.id, 'path')).toEqual([folder.id]);
    await expect.poll(() => assets.visibleNames()).toEqual([material.name]);
});

test('duplicates a material and deletes the copy', async ({ editorPage }) => {
    const assets = new AssetsPanel(editorPage);
    const material = await assets.create('createMaterial', { name: uniqueName('mat') });
    const copyName = `${material.name} (1)`;

    await assets.select(material.name);
    await assets.armAdd({ name: copyName });
    await assets.contextMenu(material.name, 'Duplicate');
    const copy = await assets.awaitAdd({ name: copyName });

    expect(await assets.field(copy.id, 'type')).toBe('material');
    expect(await assets.field(copy.id, 'data')).toEqual(await assets.field(material.id, 'data'));
    await expect(assets.gridItem(copyName)).toBeVisible();

    await assets.select(copyName);
    await expect.poll(() => assets.selectedIds()).toEqual([copy.id]);
    await editorPage.keyboard.press('Delete');
    await expect(assets.shell.confirm.text).toHaveText(`Permanently delete asset '${copyName}'?`);
    await assets.shell.confirm.yes.click();

    await assets.waitForRemove(copy.id);
    await expect(assets.gridItem(copyName)).toHaveCount(0);
    expect(await assets.exists(material.id)).toBe(true);

    // deleting an asset records no history action, so undo cannot restore it
    expect((await assets.shell.history()).last).toMatch(SELECTION_ACTION);
});
