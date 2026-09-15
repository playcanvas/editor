import { readFileSync } from 'node:fs';

import { JOB_TEST_TIMEOUT, JOB_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { AssetsPanel, VIEW_DETAILS } from '../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { Inspector } from '../../lib/pages/inspector';
import { uniqueName } from '../../lib/utils';

const PNG = readFileSync(new URL('../fixtures/files/test.png', import.meta.url));
const PNG_SIZE = `${PNG.length.toPrecision(3)} B`;
const HIGHLIGHTED = /pcui-asset-panel-highlighted-asset/;
const SELECTED = /pcui-gridview-item-selected/;
// selection is the only asset action that reaches the history stack
const SELECTION_ACTION = /^(select|deselect)$/;

// New Asset menu label -> the asset type the entry creates
const NEW_ASSETS = [
    { type: 'material', item: 'Material' },
    { type: 'cubemap', item: 'CubeMap' },
    { type: 'css', item: 'CSS' },
    { type: 'html', item: 'HTML' },
    { type: 'json', item: 'JSON' },
    { type: 'text', item: 'Text' },
    { type: 'shader', item: 'Shader' }
];

// a material and a cubemap are created from data alone; the rest carry a file, and their
// create request only answers once that file has landed on the asset
const FILELESS_ASSETS = ['material', 'cubemap'];

const txt = () => `${uniqueName('txt')}.txt`;

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;

test.describe('assets', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        await new EditorShell(editorPage).restore(baseline);
    });

    test('create folder', async ({ editorPage }) => {
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
        await expect(assets.visibleGridItems).toHaveCount(before + 1);
        expect((await assets.visibleNames()).length).toBe(before + 1);
    });

    test('navigate folders', async ({ editorPage }) => {
        const assets = new AssetsPanel(editorPage);
        const folder = await assets.create('createFolder', { name: uniqueName('folder') });
        const json = await assets.create('createJson', { name: `${uniqueName('data')}.json`, json: { e2e: true } }, folder.id);

        await expect(assets.gridItem(folder.name)).toBeVisible();
        await expect(assets.gridItem(json.name)).toBeHidden();

        await assets.gridItem(folder.name).dblclick();
        await expect(assets.gridItem(json.name)).toBeVisible();
        await expect(assets.folderTreeItem(folder.name)).toHaveClass(/pcui-asset-panel-current-folder/);
        expect(await assets.currentFolderId()).toBe(folder.id);
        expect(await assets.visibleNames()).toEqual([json.name]);

        await assets.backButton.click();
        await expect(assets.gridItem(folder.name)).toBeVisible();
        await expect(assets.gridItem(json.name)).toBeHidden();
        expect(await assets.currentFolderId()).toBe(null);
    });

    test('delete asset', async ({ editorPage }) => {
        const assets = new AssetsPanel(editorPage);
        const doomed = await assets.create('createText', { name: txt(), text: 'delete me' });
        const kept = await assets.create('createText', { name: txt(), text: 'keep me' });

        await assets.select(doomed.name);
        await expect(assets.gridItem(doomed.name)).toHaveClass(SELECTED);
        expect(await assets.selectedIds()).toEqual([doomed.id]);
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

    test('delete multiple assets', async ({ editorPage }) => {
        const assets = new AssetsPanel(editorPage);
        const first = await assets.create('createText', { name: txt(), text: 'one' });
        const second = await assets.create('createText', { name: txt(), text: 'two' });

        await assets.select(first.name);
        await assets.addToSelection(second.name);
        await expect(assets.gridItem(first.name)).toHaveClass(SELECTED);
        await expect(assets.gridItem(second.name)).toHaveClass(SELECTED);
        expect((await assets.selectedIds()).sort()).toEqual([first.id, second.id].sort());

        await assets.contextMenu(second.name, 'Delete');
        await expect(assets.shell.confirm.text).toHaveText('Permanently delete 2 assets?');
        await assets.shell.confirm.yes.click();

        await assets.waitForRemove(first.id);
        await assets.waitForRemove(second.id);
        await expect(assets.gridItem(first.name)).toHaveCount(0);
        await expect(assets.gridItem(second.name)).toHaveCount(0);
    });

    test('move asset to folder', async ({ editorPage }) => {
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
        expect(await assets.visibleNames()).not.toContain(moved.name);
    });

    test('rename asset', async ({ editorPage }) => {
        const assets = new AssetsPanel(editorPage);
        const asset = await assets.create('createText', { name: txt(), text: 'rename me' });
        const sibling = await assets.create('createText', { name: txt(), text: 'sibling' });

        await assets.select(asset.name);
        await expect(assets.nameField).toHaveValue(asset.name);

        const renamed = txt();
        const named = await assets.armField(asset.id, 'name', renamed);
        await assets.rename(renamed);
        await named();
        expect(await assets.field(asset.id, 'name')).toBe(renamed);
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
        const restored = await assets.armField(asset.id, 'name', asset.name);
        await assets.shell.undo();
        await restored();
        expect(await assets.field(asset.id, 'name')).toBe(asset.name);
        await expect(assets.gridItem(asset.name)).toBeVisible();
    });

    test('filter by tag and type', async ({ editorPage }) => {
        const assets = new AssetsPanel(editorPage);
        const tagged = await assets.create('createText', { name: txt(), text: 'tagged' });
        const material = await assets.create('createMaterial', { name: uniqueName('mat') });
        const tag = uniqueName('tag');

        await assets.addTag(tagged.id, tag);
        expect(await assets.field(tagged.id, 'tags')).toEqual([tag]);
        const baseline = (await assets.visibleNames()).length;

        await assets.typeSearch(`[${tag}]`);
        await expect(assets.visibleGridItems).toHaveCount(1);
        await expect(assets.gridItem(tagged.name)).toBeVisible();
        expect(await assets.visibleNames()).toEqual([tagged.name]);

        await assets.clearSearch.click();
        await expect(assets.visibleGridItems).toHaveCount(baseline);
        expect((await assets.visibleNames()).length).toBe(baseline);

        await assets.filterType('material');
        await expect(assets.gridItem(material.name)).toBeVisible();
        await expect(assets.visibleGridItems).toHaveCount(await assets.countOfType('material'));
        expect(await assets.visibleNames()).toContain(material.name);
        expect((await assets.visibleNames()).length).toBe(await assets.countOfType('material'));
        expect(await assets.visibleNames()).not.toContain(tagged.name);

        await assets.filterType('all');
        await expect(assets.visibleGridItems).toHaveCount(baseline);
        expect((await assets.visibleNames()).length).toBe(baseline);
    });

    test('upload png', async ({ editorPage }) => {
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

    test('copy and paste asset', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const assets = new AssetsPanel(editorPage);
        const folder = await assets.create('createFolder', { name: uniqueName('folder') });
        const material = await assets.create('createMaterial', { name: uniqueName('mat') });

        await assets.select(material.name);
        await editorPage.keyboard.press('ControlOrMeta+C');
        expect(await assets.clipboardAssetIds()).toEqual([material.id]);

        await assets.gridItem(folder.name).dblclick();
        await expect(assets.folderTreeItem(folder.name)).toHaveClass(/pcui-asset-panel-current-folder/);
        expect(await assets.currentFolderId()).toBe(folder.id);
        expect(await assets.childrenOf(folder.id)).toEqual([]);

        await assets.armAdd({ type: 'material' });
        await editorPage.keyboard.press('ControlOrMeta+V');
        const added = await assets.awaitAdd({ type: 'material' });
        await assets.waitForParent(added.id, folder.id);
        expect(await assets.childrenOf(folder.id)).toHaveLength(1);

        const [pasted] = await assets.childrenOf(folder.id);
        expect(pasted.id).not.toBe(material.id);
        expect(pasted.type).toBe('material');
        // a paste into another folder has no name to dodge, so the copy keeps it
        expect(pasted.name).toBe(material.name);
        expect(await assets.field(pasted.id, 'path')).toEqual([folder.id]);
        await expect(assets.visibleGridItems).toHaveCount(1);
        expect(await assets.visibleNames()).toEqual([material.name]);
    });

    test('duplicate material', async ({ editorPage }) => {
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
        await expect(assets.gridItem(copyName)).toHaveClass(SELECTED);
        expect(await assets.selectedIds()).toEqual([copy.id]);
        await editorPage.keyboard.press('Delete');
        await expect(assets.shell.confirm.text).toHaveText(`Permanently delete asset '${copyName}'?`);
        await assets.shell.confirm.yes.click();

        await assets.waitForRemove(copy.id);
        await expect(assets.gridItem(copyName)).toHaveCount(0);
        expect(await assets.exists(material.id)).toBe(true);

        // deleting an asset records no history action, so undo cannot restore it
        expect((await assets.shell.history()).last).toMatch(SELECTION_ACTION);
    });
    for (const { type, item } of NEW_ASSETS) {
        test(`create asset (type: ${type})`, async ({ editorPage, errors }) => {
            // a new cubemap opens with six empty faces, each falling back to
            // <home>/editor/scene/img/asset-placeholder-texture.png, which the local frontend
            // dev server does not serve, and the 404 carries no url
            if (type === 'cubemap') {
                errors.allow(/Failed to load resource: the server responded with a status of 404/);
            }

            const assets = new AssetsPanel(editorPage);
            const before = (await assets.visibleNames()).length;

            await assets.armAdd({ type });
            await assets.newAsset(item);
            const asset = await assets.awaitAdd({ type });

            expect(await assets.field(asset.id, 'type')).toBe(type);
            expect(await assets.field(asset.id, 'path')).toEqual([]);
            await expect(assets.gridItem(asset.name)).toHaveClass(new RegExp(`type-${type}`));
            await expect(assets.visibleGridItems).toHaveCount(before + 1);
            expect((await assets.visibleNames()).length).toBe(before + 1);

            // the panel creates through a fire-and-forget api call, so the asset is in the
            // registry before its create request has answered; deleting it in the cleanup
            // before then answers 400 "Document does not exist" to the request still in flight
            if (!FILELESS_ASSETS.includes(type)) {
                await assets.waitForTask(asset.id, JOB_TIMEOUT);
                expect(await assets.field(asset.id, 'file.hash')).toBeTruthy();
            }
        });
    }

    test('edit json asset', async ({ editorPage }) => {
        const assets = new AssetsPanel(editorPage);
        const inspector = new Inspector(editorPage);
        const token = uniqueName('value');
        const asset = await assets.create('createJson', { name: `${uniqueName('data')}.json`, json: { e2e: 'before' } });

        await assets.select(asset.name);
        const panel = inspector.panel(inspector.asset, 'JSON');
        await expect(panel.locator('.pcui-code-inner')).toContainText('before');

        // the json inspector is a read-only code block, so the only edit path is the file itself
        await editorPage.evaluate(async ([id, value]) => {
            const globals = window.editor.api.globals;
            const json = globals.assets.get(id as number)!;
            await globals.assets.upload({
                id: json.get('id'),
                type: 'json',
                filename: json.get('file.filename'),
                file: new Blob([JSON.stringify({ e2e: value })], { type: 'application/json' })
            });
        }, [asset.id, token] as const);
        expect(await assets.field(asset.id, 'file.filename')).toBeTruthy();

        // the code block only fetches on link, so reselect the asset to make it refetch
        await assets.gridItem(asset.name).click();
        await assets.select(asset.name);

        await expect(panel.locator('.pcui-code-inner')).toContainText(token);
    });

    test('delete folder with contents', async ({ editorPage }) => {
        const assets = new AssetsPanel(editorPage);
        const folder = await assets.create('createFolder', { name: uniqueName('folder') });
        const first = await assets.create('createText', { name: txt(), text: 'one' }, folder.id);
        const second = await assets.create('createText', { name: txt(), text: 'two' }, folder.id);

        expect(await assets.childrenOf(folder.id)).toHaveLength(2);

        await assets.select(folder.name);
        await assets.deleteButton.click();
        await expect(assets.shell.confirm.text).toHaveText(`Permanently delete folder '${folder.name}'?`);
        await assets.shell.confirm.yes.click();

        await assets.waitForRemove(folder.id);
        await assets.waitForRemove(first.id);
        await assets.waitForRemove(second.id);
        await expect(assets.gridItem(folder.name)).toHaveCount(0);
        await expect(assets.folderTreeItem(folder.name)).toHaveCount(0);
    });

    test('tag asset', async ({ editorPage }) => {
        const assets = new AssetsPanel(editorPage);
        const inspector = new Inspector(editorPage);
        const asset = await assets.create('createText', { name: txt(), text: 'tag me' });
        const tag = uniqueName('tag');

        await assets.select(asset.name);
        const tags = inspector.field(inspector.asset, 'Tags');
        await expect(tags).toBeVisible();

        // the tags field is a multi-select that creates the typed value on Enter
        const input = tags.locator('.pcui-select-input-textinput input');
        await input.click();
        await input.pressSequentially(tag);
        const tagged = await assets.armField(asset.id, 'tags', [tag]);
        await input.press('Enter');
        await tagged();
        expect(await assets.field(asset.id, 'tags')).toEqual([tag]);

        await assets.typeSearch(`[${tag}]`);
        await expect(assets.visibleGridItems).toHaveCount(1);
        await expect(assets.gridItem(asset.name)).toBeVisible();
        expect(await assets.visibleNames()).toEqual([asset.name]);
    });
});
