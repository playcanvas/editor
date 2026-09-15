import { JOB_TEST_TIMEOUT, JOB_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { AssetsPanel } from '../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { Inspector } from '../../lib/pages/inspector';
import { Templates } from '../../lib/pages/templates';
import { waitForEditor } from '../../lib/ready';
import { uniqueName } from '../../lib/utils';

// a template instance root ignores position, rotation and name for overrides, so scale is the
// cheapest field that actually counts as one (template-utils.ts IGNORE_ROOT_PATHS_FOR_OVERRIDES)
const OVERRIDE_SCALE = [2, 2, 2];

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;

test.describe('templates', { tag: '@gate' }, () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        await new EditorShell(editorPage).restore(baseline);
    });

    test('create template', async ({ editorPage }) => {
        const templates = new Templates(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const assets = new AssetsPanel(editorPage);
        const name = uniqueName('ent');
        const id = await hierarchy.createEntity({ name, components: { light: {} } });

        const asset = await templates.create(name);

        expect(await assets.field(asset.id, 'type')).toBe('template');
        await expect(assets.gridItem(name)).toHaveClass(/type-template/);

        // the source entity becomes an instance of the asset it just produced
        await (await hierarchy.armField(id, 'template_id', asset.id))();
        await expect(templates.root).toBeVisible();
        await expect(templates.header).toHaveText('TEMPLATE INSTANCE');
        await expect(templates.assetName).toHaveText(name);
        await expect(templates.overrides).toHaveText('No Overrides');
        await expect(hierarchy.row(name)).toHaveClass(/template-instance/);
    });

    test('instantiate template', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const templates = new Templates(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const source = uniqueName('ent');
        const parent = uniqueName('parent');
        await hierarchy.createEntity({ name: source, components: { light: {} } });
        const parentId = await hierarchy.createEntity({ name: parent });

        const asset = await templates.create(source);

        const childId = await templates.addInstance(parent, asset.name);
        expect(await hierarchy.get(parentId, 'children')).toEqual([childId]);
        expect(await hierarchy.get(childId, 'template_id')).toBe(asset.id);
        expect(await hierarchy.get(childId, 'name')).toBe(source);
        expect(await hierarchy.get(childId, 'components.light.enabled')).toBe(true);
        await expect(hierarchy.childRow(parent, source)).toHaveCount(1);
    });

    test('apply override', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const templates = new Templates(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const inspector = new Inspector(editorPage);
        const assets = new AssetsPanel(editorPage);
        const name = uniqueName('ent');
        const id = await hierarchy.createEntity({ name, components: { light: {} } });
        const parent = uniqueName('parent');
        await hierarchy.createEntity({ name: parent });

        const asset = await templates.create(name);
        const other = await templates.addInstance(parent, asset.name);
        await hierarchy.setSelection([other]);
        await inspector.setVector(inspector.entityFields, 'Position', [3, 4, 5]);
        await hierarchy.setSelection([id]);
        await expect(templates.overrides).toHaveText('No Overrides');

        await inspector.setVector(inspector.entityFields, 'Scale', OVERRIDE_SCALE);

        await expect(templates.overrides).toHaveText('1 Override');
        await expect(templates.root).toHaveClass(/template-entity-inspector-overrides-positive/);
        await expect(templates.button('APPLY ALL')).toBeVisible();

        const propagated = await hierarchy.armField(other, 'scale', OVERRIDE_SCALE);
        await templates.button('APPLY ALL').click();
        await propagated();

        // apply is a pipeline job; the asset data comes back through realtime
        await expect(templates.overrides).toHaveText('No Overrides', { timeout: JOB_TIMEOUT });
        expect(await hierarchy.get(id, 'scale')).toEqual(OVERRIDE_SCALE);
        expect(await hierarchy.get(other, 'position')).toEqual([3, 4, 5]);
        expect(JSON.stringify(await assets.field(asset.id, 'data.entities'))).toContain('"scale":[2,2,2]');

        await inspector.shell.flushScene();
        await editorPage.reload();
        await waitForEditor(editorPage);
        expect(await hierarchy.get(id, 'scale')).toEqual(OVERRIDE_SCALE);
        expect(await hierarchy.get(other, 'scale')).toEqual(OVERRIDE_SCALE);
        expect(await hierarchy.get(other, 'position')).toEqual([3, 4, 5]);
        await hierarchy.setSelection([other]);
        await expect(templates.overrides).toHaveText('No Overrides');
    });

    test('revert override', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const templates = new Templates(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const inspector = new Inspector(editorPage);
        const name = uniqueName('ent');
        await hierarchy.createEntity({ name, components: { light: {} } });

        await templates.create(name);
        await expect(templates.overrides).toHaveText('No Overrides');

        await inspector.setVector(inspector.entityFields, 'Scale', OVERRIDE_SCALE);
        await expect(templates.overrides).toHaveText('1 Override');

        await templates.button('REVERT ALL').click();

        // revert deletes and re-instantiates the subtree, so the instance gets a new resource id
        await expect(templates.overrides).toHaveText('No Overrides', { timeout: JOB_TIMEOUT });
        await expect(hierarchy.row(name)).toHaveCount(1);
        const { ids } = await hierarchy.selection();
        expect(await hierarchy.get(ids[0], 'scale')).toEqual([1, 1, 1]);
    });

    test('unlink nested template and restore its link with undo', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const templates = new Templates(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const shell = new EditorShell(editorPage);
        const parent = uniqueName('parent');
        const nested = uniqueName('nested');
        const root = await hierarchy.createEntity({ name: parent });
        const child = await hierarchy.createEntity({ parent: root, name: nested, components: { light: {} } });
        await hierarchy.select(parent);
        await hierarchy.rowContents(parent).press('ArrowRight');
        await expect(hierarchy.rowContents(nested)).toBeVisible();
        const inner = await templates.create(nested);
        const outer = await templates.create(parent);
        const mapping = await hierarchy.get(child, 'template_ent_ids');
        await hierarchy.select(nested);

        const unlinked = await hierarchy.armField(child, 'template_id', null);
        await templates.unlink(nested);
        await unlinked();
        await expect(templates.root).toBeHidden();
        expect(await hierarchy.get(child, 'template_ent_ids')).toBeNull();
        expect(await hierarchy.get(child, 'parent')).toBe(root);
        expect(await hierarchy.get(root, 'template_id')).toBe(outer.id);
        expect(await hierarchy.get(child, 'components.light.enabled')).toBe(true);

        const undone = await hierarchy.armField(child, 'template_id', inner.id);
        await shell.undo();
        await undone();
        expect(await hierarchy.get(child, 'template_ent_ids')).toEqual(mapping);
        await expect(templates.root).toBeVisible();
        await expect(templates.assetName).toHaveText(nested);

        const redone = await hierarchy.armField(child, 'template_id', null);
        await shell.redo();
        await redone();
        await shell.flushScene();
        await editorPage.reload();
        await waitForEditor(editorPage);
        expect(await hierarchy.get(child, 'template_id')).toBeNull();
        expect(await hierarchy.get(root, 'template_id')).toBe(outer.id);
        expect(await hierarchy.get(root, 'children')).toEqual([child]);
        expect(await hierarchy.get(child, 'components.light.enabled')).toBe(true);
    });
});
