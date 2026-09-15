import { expect, test } from '../../lib/fixtures';
import { EditorShell } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { uniqueName } from '../../lib/utils';

const RENDER_ICON = '.pcui-treeview-item-icon.component-icon-postfix.type-render';

// the worker project is shared by the whole run, so hand back the scene we were given
let baseline: string[] = [];

test.describe('hierarchy', { tag: '@gate' }, () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new HierarchyPanel(editorPage).ids();
    });

    test.afterEach(async ({ editorPage }) => {
        const hierarchy = new HierarchyPanel(editorPage);
        const ids = await hierarchy.ids();
        await hierarchy.remove(ids.filter(id => !baseline.includes(id)));
    });

    test('create child entity', async ({ editorPage }) => {
        const hierarchy = new HierarchyPanel(editorPage);
        const shell = new EditorShell(editorPage);
        const rootId = await hierarchy.rootId();
        const before = await hierarchy.row('New Entity').count();

        await hierarchy.select(await hierarchy.rootName());
        await editorPage.keyboard.press('ControlOrMeta+E');

        await expect(hierarchy.row('New Entity')).toHaveCount(before + 1);
        await expect.poll(async () => (await hierarchy.selection()).names).toEqual(['New Entity']);
        const { ids } = await hierarchy.selection();
        expect(await hierarchy.get(ids[0], 'parent')).toBe(rootId);
        expect((await shell.history()).last).toMatch(/^new entity /);
    });

    test('add box entity', async ({ editorPage }) => {
        const hierarchy = new HierarchyPanel(editorPage);
        const parent = uniqueName('ent');
        const parentId = await hierarchy.createEntity({ name: parent });
        await hierarchy.select(parent);

        await hierarchy.add('3D', 'Box');

        const box = hierarchy.childRow(parent, 'Box');
        await expect(box).toHaveCount(1);
        await expect(box.locator(RENDER_ICON)).toHaveCount(1);
        await expect.poll(async () => (await hierarchy.selection()).names).toEqual(['Box']);
        const { ids } = await hierarchy.selection();
        expect(await hierarchy.get(ids[0], 'parent')).toBe(parentId);
        expect(await hierarchy.get(ids[0], 'components.render.type')).toBe('box');
    });

    test('delete entity and undo', async ({ editorPage }) => {
        const hierarchy = new HierarchyPanel(editorPage);
        const shell = new EditorShell(editorPage);
        const name = uniqueName('ent');
        const id = await hierarchy.createEntity({ name });

        await hierarchy.contextMenu(name, 'Delete');

        await expect(hierarchy.row(name)).toHaveCount(0);
        expect(await hierarchy.exists(id)).toBe(false);
        await hierarchy.waitForAction('delete entities');

        await shell.undo();
        await expect(hierarchy.row(name)).toHaveCount(1);
        expect(await hierarchy.get(id, 'resource_id')).toBe(id);
    });

    test('block root delete', async ({ editorPage }) => {
        const hierarchy = new HierarchyPanel(editorPage);
        const rootName = await hierarchy.rootName();
        const rootId = await hierarchy.rootId();

        await hierarchy.select(rootName);
        await hierarchy.openContextMenu(rootName);
        await expect(hierarchy.menuItem('Delete')).toHaveClass(/pcui-disabled/);

        await editorPage.keyboard.press('Escape');
        await expect(hierarchy.menuItem('Delete')).toHaveCount(0);

        // the context menu leaves the selection alone, so the root is still the delete target
        await expect(hierarchy.rowContents(rootName)).toHaveClass(/pcui-treeview-item-selected/);
        const before = await hierarchy.ids();
        await editorPage.keyboard.press('Delete');

        expect(await hierarchy.ids()).toEqual(before);
        expect(await hierarchy.exists(rootId)).toBe(true);
    });

    test('duplicate entity and undo', async ({ editorPage }) => {
        const hierarchy = new HierarchyPanel(editorPage);
        const shell = new EditorShell(editorPage);
        const name = uniqueName('ent');
        const id = await hierarchy.createEntity({ name, components: { render: { type: 'box' } } });
        const rootId = await hierarchy.rootId();
        const before = (await hierarchy.get(rootId, 'children')).length;

        await hierarchy.select(name);
        await editorPage.keyboard.press('ControlOrMeta+D');
        await hierarchy.waitForAction('duplicate entities');

        expect((await hierarchy.get(rootId, 'children')).length).toBe(before + 1);
        const selection = await hierarchy.selection();
        expect(selection.count).toBe(1);
        expect(selection.ids[0]).not.toBe(id);
        expect(await hierarchy.get(selection.ids[0], 'parent')).toBe(rootId);

        await shell.undo();
        await expect.poll(() => hierarchy.exists(selection.ids[0])).toBe(false);
        expect((await hierarchy.get(rootId, 'children')).length).toBe(before);
    });

    test('reparent entity and undo', async ({ editorPage }) => {
        const hierarchy = new HierarchyPanel(editorPage);
        const shell = new EditorShell(editorPage);
        const a = uniqueName('ent');
        const b = uniqueName('ent');
        const rootId = await hierarchy.rootId();
        const aId = await hierarchy.createEntity({ name: a });
        const bId = await hierarchy.createEntity({ name: b });

        await hierarchy.dragInto(a, b);
        await hierarchy.waitForAction('reparent entities');

        expect(await hierarchy.get(aId, 'parent')).toBe(bId);
        expect(await hierarchy.get(bId, 'children')).toEqual([aId]);
        await expect(hierarchy.childRow(b, a)).toHaveCount(1);
        await expect(hierarchy.row(b)).not.toHaveClass(/pcui-treeview-item-empty/);

        await shell.undo();
        await expect.poll(() => hierarchy.get(aId, 'parent')).toBe(rootId);
        expect(await hierarchy.get(bId, 'children')).toEqual([]);
    });

    test('rename entity', async ({ editorPage }) => {
        const hierarchy = new HierarchyPanel(editorPage);
        const shell = new EditorShell(editorPage);
        const name = uniqueName('ent');
        const renamed = uniqueName('ent');
        const id = await hierarchy.createEntity({ name });

        await hierarchy.rename(name, renamed);

        await expect(hierarchy.row(renamed)).toHaveCount(1);
        await expect(hierarchy.row(name)).toHaveCount(0);
        expect(await hierarchy.get(id, 'name')).toBe(renamed);
        expect((await shell.history()).last).toBe(`entity.${id}.name`);

        await hierarchy.startRename(renamed);
        await hierarchy.renameInput().fill(uniqueName('discarded'));
        await hierarchy.renameInput().press('Escape');

        await expect(hierarchy.renameInput()).toHaveCount(0);
        await expect(hierarchy.row(renamed)).toHaveCount(1);
        expect(await hierarchy.get(id, 'name')).toBe(renamed);
    });

    test('disable and enable entity', async ({ editorPage }) => {
        const hierarchy = new HierarchyPanel(editorPage);
        const shell = new EditorShell(editorPage);
        const parent = uniqueName('ent');
        const child = uniqueName('ent');
        const parentId = await hierarchy.createEntity({ name: parent });
        const childId = await hierarchy.createEntity({ name: child, parent: parentId });

        await hierarchy.contextMenu(parent, 'Disable');

        await expect(hierarchy.row(parent)).toHaveClass(/pcui-disabled/);
        await expect(hierarchy.childRow(parent, child)).toHaveClass(/pcui-disabled/);
        expect(await hierarchy.get(parentId, 'enabled')).toBe(false);
        expect(await hierarchy.get(childId, 'enabled')).toBe(true);
        expect((await shell.history()).last).toBe('entities.set[enabled]');

        await hierarchy.contextMenu(parent, 'Enable');

        await expect(hierarchy.row(parent)).not.toHaveClass(/pcui-disabled/);
        await expect(hierarchy.childRow(parent, child)).not.toHaveClass(/pcui-disabled/);
        expect(await hierarchy.get(parentId, 'enabled')).toBe(true);
    });

    test('copy and paste entity', async ({ editorPage }) => {
        const hierarchy = new HierarchyPanel(editorPage);
        const a = uniqueName('ent');
        const b = uniqueName('ent');
        const aId = await hierarchy.createEntity({ name: a, components: { render: { type: 'box' } } });
        const bId = await hierarchy.createEntity({ name: b });

        await hierarchy.select(a);
        await editorPage.keyboard.press('ControlOrMeta+C');
        const type = await editorPage.evaluate(() => (window.editor.call('clipboard:get') as { type: string }).type);
        expect(type).toBe('entity');

        await hierarchy.select(b);
        await editorPage.keyboard.press('ControlOrMeta+V');
        await hierarchy.waitForAction('paste entities');

        const children = await hierarchy.get(bId, 'children');
        expect(children).toHaveLength(1);
        expect(children[0]).not.toBe(aId);
        expect(await hierarchy.get(children[0], 'name')).toBe(a);
        expect(await hierarchy.get(children[0], 'components.render.type')).toBe('box');
        await expect(hierarchy.childRow(b, a)).toHaveCount(1);
    });

    test('select range and all', async ({ editorPage }) => {
        const hierarchy = new HierarchyPanel(editorPage);
        const a = uniqueName('ent');
        const b = uniqueName('ent');
        const c = uniqueName('ent');
        await hierarchy.createEntity({ name: a });
        await hierarchy.createEntity({ name: b });
        await hierarchy.createEntity({ name: c });

        await hierarchy.select(a);
        await hierarchy.shiftSelect(c);

        await expect(hierarchy.selectedRows()).toHaveCount(3);
        const { names } = await hierarchy.selection();
        expect([...names].sort()).toEqual([a, b, c].sort());

        await editorPage.keyboard.press('ControlOrMeta+A');

        const total = (await hierarchy.ids()).length;
        await expect.poll(async () => (await hierarchy.selection()).count).toBe(total);
        await expect(hierarchy.selectedRows()).toHaveCount(total);
    });
    test('delete parent and undo', async ({ editorPage }) => {
        const hierarchy = new HierarchyPanel(editorPage);
        const shell = new EditorShell(editorPage);
        const parent = uniqueName('ent');
        const child = uniqueName('ent');
        const parentId = await hierarchy.createEntity({ name: parent });
        const childId = await hierarchy.createEntity({ name: child, parent: parentId });

        await hierarchy.contextMenu(parent, 'Delete');
        await hierarchy.waitForAction('delete entities');

        // deleting a parent takes its whole subtree with it
        expect(await hierarchy.exists(parentId)).toBe(false);
        expect(await hierarchy.exists(childId)).toBe(false);
        await expect(hierarchy.row(parent)).toHaveCount(0);
        await expect(hierarchy.row(child)).toHaveCount(0);

        await shell.undo();

        await expect(hierarchy.childRow(parent, child)).toHaveCount(1);
        expect(await hierarchy.get(childId, 'parent')).toBe(parentId);
        expect(await hierarchy.get(parentId, 'children')).toEqual([childId]);
    });
});
