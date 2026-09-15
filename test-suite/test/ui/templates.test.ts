import { JOB_TEST_TIMEOUT, JOB_TIMEOUT } from '../../lib/constants';
import { expect, test } from '../../lib/fixtures';
import { AssetsPanel } from '../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { Inspector } from '../../lib/pages/inspector';
import { Templates } from '../../lib/pages/templates';
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
        await expect.poll(() => hierarchy.get(id, 'template_id')).toBe(asset.id);
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

        await templates.addInstance(parent, asset.name);

        // instantiation runs as a backend pipeline job, so the child arrives late
        await expect.poll(() => hierarchy.get(parentId, 'children'), { timeout: JOB_TIMEOUT }).toHaveLength(1);
        const [childId] = await hierarchy.get(parentId, 'children');
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

        const asset = await templates.create(name);
        await expect(templates.overrides).toHaveText('No Overrides');

        await inspector.setVector(inspector.entityFields, 'Scale', OVERRIDE_SCALE);

        await expect(templates.overrides).toHaveText('1 Override');
        await expect(templates.root).toHaveClass(/template-entity-inspector-overrides-positive/);
        await expect(templates.button('APPLY ALL')).toBeVisible();

        await templates.button('APPLY ALL').click();

        // apply is a pipeline job; the asset data comes back through realtime
        await expect(templates.overrides).toHaveText('No Overrides', { timeout: JOB_TIMEOUT });
        expect(await hierarchy.get(id, 'scale')).toEqual(OVERRIDE_SCALE);
        expect(JSON.stringify(await assets.field(asset.id, 'data.entities'))).toContain('"scale":[2,2,2]');
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
});
