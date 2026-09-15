import { expect, test } from '../../lib/fixtures';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { Inspector } from '../../lib/pages/inspector';
import { uniqueName } from '../../lib/utils';

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;

test.describe('inspector', { tag: '@gate' }, () => {
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

        await inspector.setText(inspector.entityFields, 'Name', renamed);

        await expect.poll(() => inspector.read(id, 'name')).toBe(renamed);
        await expect(hierarchy.row(renamed)).toHaveCount(1);

        // the inspector writes the observer path, unlike the hierarchy rename action
        expect((await inspector.shell.history()).last).toBe('name');

        await inspector.shell.undo();
        await expect.poll(() => inspector.read(id, 'name')).toBe(name);
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
        await input.press('Enter');

        await expect.poll(() => inspector.read(id, 'tags')).toEqual([tag]);
        await expect(tags.locator('.pcui-select-input-tag')).toHaveCount(1);
    });

    test('edit position', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('entity') });

        await hierarchy.setSelection([id]);
        await expect(inspector.entity).toBeVisible();
        await inspector.recordHistory();
        await inspector.setVector(inspector.entityFields, 'Position', [1, 2, 3]);

        await expect.poll(() => inspector.read(id, 'position')).toEqual([1, 2, 3]);
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

        await inspector.toggle(inspector.entityFields, 'Enabled');

        await expect.poll(() => inspector.read(id, 'enabled')).toBe(false);
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

        await inspector.setVector(inspector.entityFields, 'Position', [2, 2, 2]);

        await expect.poll(() => inspector.read(first, 'position')).toEqual([2, 2, 2]);
        await expect.poll(() => inspector.read(second, 'position')).toEqual([2, 2, 2]);
    });
});
