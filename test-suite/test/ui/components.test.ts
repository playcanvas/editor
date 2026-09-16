import { expect, test } from '../../lib/fixtures';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { Inspector } from '../../lib/pages/inspector';
import { uniqueName } from '../../lib/utils';

// every visible entry of the Add Component menu; camera, light and screen have no plain leaf
// because entity.ts treats them as abstract and replaces them with their variants. joint and
// audiosource are left out: audiosource is in hiddenComponents, joint needs a second body to
// mean anything
const COMPONENTS = [
    { name: 'sprite', path: ['2D', 'Sprite'] },
    { name: 'model', path: ['3D', 'Model (legacy)'] },
    { name: 'render', path: ['3D', 'Render'] },
    { name: 'audiolistener', path: ['Audio', 'Audio Listener'] },
    { name: 'sound', path: ['Audio', 'Sound'] },
    { name: 'anim', path: ['Animation', 'Anim'] },
    { name: 'animation', path: ['Animation', 'Animation (legacy)'] },
    { name: 'camera', path: ['Camera', 'Perspective'] },
    { name: 'light', path: ['Light', 'Omni Light'] },
    { name: 'collision', path: ['Physics', 'Collision'] },
    { name: 'rigidbody', path: ['Physics', 'Rigid Body'] },
    { name: 'screen', path: ['UI', '2D Screen'] },
    { name: 'element', path: ['UI', 'Element'] },
    { name: 'button', path: ['UI', 'Button'] },
    { name: 'layoutgroup', path: ['UI', 'Layout Group'] },
    { name: 'layoutchild', path: ['UI', 'Layout Child'] },
    { name: 'scrollview', path: ['UI', 'Scroll View'] },
    { name: 'scrollbar', path: ['UI', 'Scrollbar'] },
    { name: 'gsplat', path: ['Gaussian Splat'] },
    { name: 'particlesystem', path: ['Particle System'] },
    { name: 'script', path: ['Script'] },
    { name: 'zone', path: ['Zone'], flag: 'hasZoneComponent' }
];

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;

test.describe('components', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        await new EditorShell(editorPage).restore(baseline);
    });

    for (const { name, path, flag } of COMPONENTS) {
        test(`add and remove component (component: ${name})`, async ({ editorPage }) => {
            if (flag) {
                const allowed = await editorPage.evaluate(f => !!window.editor.call('users:hasFlag', f), flag);
                test.skip(!allowed, `needs the ${flag} account flag`);
            }

            const inspector = new Inspector(editorPage);
            const hierarchy = new HierarchyPanel(editorPage);
            const id = await hierarchy.createEntity({ name: uniqueName('ent') });

            await hierarchy.setSelection([id]);
            await expect(inspector.entity).toBeVisible();
            await inspector.recordHistory();
            const added = await hierarchy.armField(id, `components.${name}.enabled`, true);
            await inspector.addComponent(path);
            await added();

            const panel = inspector.component(name);
            await expect(panel).toBeVisible();
            await expect(inspector.componentEnabled(name).locator('.pcui-label')).toHaveText('ON');
            expect(await inspector.read(id, `components.${name}.enabled`)).toBe(true);
            expect(await inspector.historyActions()).toEqual([`entities.${name}`]);

            const removed = await hierarchy.armField(id, `components.${name}`, null);
            await inspector.componentMenu(name, 'Remove Component');
            await removed();

            await expect(panel).toBeHidden();
            expect(await inspector.has(id, `components.${name}`)).toBe(false);

            const restored = await hierarchy.armField(id, `components.${name}.enabled`, true);
            await inspector.shell.undo();
            await restored();

            await expect(panel).toBeVisible();
            expect(await inspector.read(id, `components.${name}.enabled`)).toBe(true);
        });
    }

    test('copy and paste component', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const source = await hierarchy.createEntity({
            name: uniqueName('ent'),
            components: { light: { intensity: 3 } }
        });
        const target = await hierarchy.createEntity({ name: uniqueName('ent') });

        await hierarchy.setSelection([source]);
        await expect(inspector.component('light')).toBeVisible();
        await inspector.componentMenu('light', 'Copy Component');

        await hierarchy.setSelection([target]);
        await expect(inspector.component('light')).toBeHidden();
        const pasted = await hierarchy.armField(target, 'components.light.intensity', 3);
        await inspector.entityMenu('Paste Component');
        await pasted();

        await expect(inspector.component('light')).toBeVisible();
        expect(await inspector.read(target, 'components.light.intensity')).toBe(3);
        expect((await inspector.shell.history()).last).toBe('entities.paste[components.light]');
    });

    test('toggle component enabled', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { light: {} } });

        await hierarchy.setSelection([id]);
        const enabled = inspector.componentEnabled('light');
        await expect(enabled.locator('.pcui-label')).toHaveText('ON');

        const disabled = await hierarchy.armField(id, 'components.light.enabled', false);
        await inspector.toggleComponent('light');
        await disabled();
        await expect(enabled.locator('.pcui-label')).toHaveText('OFF');

        const restored = await hierarchy.armField(id, 'components.light.enabled', true);
        await inspector.toggleComponent('light');
        await restored();
        await expect(enabled.locator('.pcui-label')).toHaveText('ON');
    });

    test('undo component edit', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { light: {} } });

        await hierarchy.setSelection([id]);
        const light = inspector.component('light');
        await expect(light).toBeVisible();

        const before = await inspector.read(id, 'components.light.intensity');
        expect(before).not.toBe(5);

        const changed = await hierarchy.armField(id, 'components.light.intensity', 5);
        await inspector.setSlider(light, 'Intensity', 5);
        await changed();

        const undone = await hierarchy.armField(id, 'components.light.intensity', before);
        await inspector.shell.undo();
        await undone();

        const redone = await hierarchy.armField(id, 'components.light.intensity', 5);
        await inspector.shell.redo();
        await redone();
    });

    test('edit component on multi select', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const first = await hierarchy.createEntity({
            name: uniqueName('ent'),
            components: { render: { type: 'box' } }
        });
        const second = await hierarchy.createEntity({
            name: uniqueName('ent'),
            components: { render: { type: 'sphere' } }
        });

        await hierarchy.setSelection([first, second]);
        await expect(inspector.header).toHaveText('2 Entities');

        const render = inspector.component('render');
        await expect(inspector.field(render, 'Type').locator('.pcui-select-input')).toHaveClass(/pcui-multiple-values/);

        const changed = await Promise.all([first, second].map(id => hierarchy.armField(id, 'components.render.type', 'capsule')));
        await inspector.setSelect(render, 'Type', 'Capsule');
        await Promise.all(changed.map(done => done()));

        const undone = await Promise.all([
            hierarchy.armField(first, 'components.render.type', 'box'),
            hierarchy.armField(second, 'components.render.type', 'sphere')
        ]);
        await inspector.shell.undo();
        await Promise.all(undone.map(done => done()));
    });
});
