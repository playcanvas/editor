import { expect, test } from '../../lib/fixtures';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { Inspector } from '../../lib/pages/inspector';
import { waitForEditor } from '../../lib/ready';
import { uniqueName } from '../../lib/utils';

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;

test.describe('inspector', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        await new EditorShell(editorPage).restore(baseline);
    });

    test('inspect entity', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const name = uniqueName('entity');
        const id = await hierarchy.createEntity({ name });

        await hierarchy.setSelection([id]);

        await expect(inspector.entity).toBeVisible();
        await expect(inspector.header).toHaveText('Entity');
        await expect(inspector.field(inspector.entityFields, 'Name').locator('input')).toHaveValue(name);
    });

    test('edit entity name', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const name = uniqueName('entity');
        const id = await hierarchy.createEntity({ name });
        const renamed = uniqueName('entity');

        await hierarchy.setSelection([id]);
        await expect(inspector.entity).toBeVisible();

        const changed = await hierarchy.armField(id, 'name', renamed);
        await inspector.setText(inspector.entityFields, 'Name', renamed);
        await changed();
        await expect(hierarchy.row(renamed)).toHaveCount(1);

        // the inspector writes the observer path, unlike the hierarchy rename action
        expect((await inspector.shell.history()).last).toBe('name');

        const undone = await hierarchy.armField(id, 'name', name);
        await inspector.shell.undo();
        await undone();
        await expect(inspector.field(inspector.entityFields, 'Name').locator('input')).toHaveValue(name);

        const redone = await hierarchy.armField(id, 'name', renamed);
        await inspector.shell.redo();
        await redone();
        await inspector.shell.flushScene();
        await editorPage.reload();
        await waitForEditor(editorPage);
        await hierarchy.select(renamed);
        await expect(inspector.field(inspector.entityFields, 'Name').locator('input')).toHaveValue(renamed);
    });

    test('tag entity', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('entity') });
        const tag = uniqueName('tag');

        await hierarchy.setSelection([id]);
        const tags = inspector.field(inspector.entityFields, 'Tags');
        await expect(tags).toBeVisible();

        // the tags field is a multi-select that creates the typed value on Enter
        const input = tags.locator('.pcui-select-input-textinput input');
        await input.click();
        await input.pressSequentially(tag);
        const changed = await hierarchy.armField(id, 'tags', [tag]);
        await input.press('Enter');
        await changed();
        await expect(tags.locator('.pcui-select-input-tag')).toHaveCount(1);
    });

    test('edit position', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('entity') });

        await hierarchy.setSelection([id]);
        await expect(inspector.entity).toBeVisible();
        await inspector.recordHistory();
        const changed = await hierarchy.armField(id, 'position', [1, 2, 3]);
        await inspector.setVector(inspector.entityFields, 'Position', [1, 2, 3]);
        await changed();
        expect(await inspector.historyActions()).toEqual(['position.0', 'position.1', 'position.2']);
    });

    test('toggle entity enabled', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const name = uniqueName('entity');
        const id = await hierarchy.createEntity({ name });

        await hierarchy.setSelection([id]);
        await expect(inspector.entity).toBeVisible();
        await expect(hierarchy.row(name)).not.toHaveClass(/pcui-disabled/);

        const changed = await hierarchy.armField(id, 'enabled', false);
        await inspector.toggle(inspector.entityFields, 'Enabled');
        await changed();
        await expect(hierarchy.row(name)).toHaveClass(/pcui-disabled/);
    });

    test('edit multiple entities', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const first = await hierarchy.createEntity({ name: uniqueName('entity') });
        const second = await hierarchy.createEntity({ name: uniqueName('entity') });
        await editorPage.evaluate((id) => {
            window.editor.api.globals.entities.get(id)?.set('position', [5, 5, 5]);
        }, second);

        await hierarchy.setSelection([first, second]);
        await expect(inspector.header).toHaveText('2 Entities');

        const position = inspector.field(inspector.entityFields, 'Position');
        await expect(position.locator('.pcui-numeric-input').first()).toHaveClass(/pcui-multiple-values/);

        const changed = await hierarchy.armField(second, 'position', [2, 2, 2]);
        await inspector.setVector(inspector.entityFields, 'Position', [2, 2, 2]);
        await changed();
        expect(await inspector.read(first, 'position')).toEqual([2, 2, 2]);
        await expect(position.locator('.pcui-multiple-values')).toHaveCount(0);

        for (const values of [[2, 2, 5], [2, 5, 5], [5, 5, 5]]) {
            const undone = await hierarchy.armField(second, 'position', values);
            await inspector.shell.undo();
            await undone();
        }
        expect(await inspector.read(first, 'position')).toEqual([0, 0, 0]);
        await expect(position.locator('.pcui-numeric-input.pcui-multiple-values')).toHaveCount(3);

        for (const values of [[2, 5, 5], [2, 2, 5], [2, 2, 2]]) {
            const redone = await hierarchy.armField(second, 'position', values);
            await inspector.shell.redo();
            await redone();
        }
        expect(await inspector.read(first, 'position')).toEqual([2, 2, 2]);
        expect(await inspector.read(first, 'rotation')).toEqual([0, 0, 0]);
        expect(await inspector.read(second, 'scale')).toEqual([1, 1, 1]);

        await inspector.shell.flushScene();
        await editorPage.reload();
        await waitForEditor(editorPage);
        expect(await inspector.read(first, 'position')).toEqual([2, 2, 2]);
        expect(await inspector.read(second, 'position')).toEqual([2, 2, 2]);
        await hierarchy.setSelection([first, second]);
        await expect(inspector.header).toHaveText('2 Entities');
        await expect(position.locator('.pcui-multiple-values')).toHaveCount(0);
    });
});
