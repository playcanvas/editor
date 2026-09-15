import { readFileSync } from 'node:fs';

import { expect, test } from '../../lib/fixtures';
import { AssetsPanel } from '../../lib/pages/assets';
import { EditorShell, type ProjectState } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { Inspector } from '../../lib/pages/inspector';
import { uniqueName } from '../../lib/utils';

const PNG = readFileSync(new URL('../fixtures/files/test.png', import.meta.url));

// the worker project is shared by the whole run, so hand back what we were given
let baseline: ProjectState;

test.describe('components-ui', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        await new EditorShell(editorPage).restore(baseline);
    });

    test('toggle screen space', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { screen: {} } });

        await hierarchy.setSelection([id]);
        const screen = inspector.component('screen');
        await expect(screen).toBeVisible();
        expect(await inspector.read(id, 'components.screen.screenSpace')).toBe(true);
        expect(await inspector.fieldVisible(screen, 'Resolution')).toBe(false);

        const changed = await hierarchy.armField(id, 'components.screen.screenSpace', false);
        await inspector.toggle(screen, 'Screen Space');
        await changed();

        // a world screen sizes itself, so it swaps the scale controls for a resolution
        expect(await inspector.read(id, 'components.screen.screenSpace')).toBe(false);
        await expect(inspector.field(screen, 'Resolution')).toBeVisible();
        await expect(inspector.field(screen, 'Scale Mode')).toBeHidden();
    });

    test('edit resolution', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({
            name: uniqueName('ent'),
            components: { screen: { screenSpace: false } }
        });

        await hierarchy.setSelection([id]);
        const screen = inspector.component('screen');
        await expect(inspector.field(screen, 'Resolution')).toBeVisible();

        const changed = await hierarchy.armField(id, 'components.screen.resolution', [640, 480]);
        await inspector.setVector(screen, 'Resolution', [640, 480]);
        await changed();
        expect(await inspector.read(id, 'components.screen.resolution')).toEqual([640, 480]);
    });

    test('switch scale mode', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { screen: {} } });

        await hierarchy.setSelection([id]);
        const screen = inspector.component('screen');
        await expect(screen).toBeVisible();
        expect(await inspector.read(id, 'components.screen.scaleMode')).toBe('blend');

        const changed = await hierarchy.armField(id, 'components.screen.scaleMode', 'none');
        await inspector.setSelect(screen, 'Scale Mode', 'None');
        await changed();
        expect(await inspector.read(id, 'components.screen.scaleMode')).toBe('none');
        await expect(inspector.field(screen, 'Scale Blend')).toBeHidden();
        await expect(inspector.field(screen, 'Ref Resolution')).toBeHidden();
    });

    test('switch element type', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { element: {} } });

        await hierarchy.setSelection([id]);
        const element = inspector.component('element');
        await expect(element).toBeVisible();
        expect(await inspector.read(id, 'components.element.type')).toBe('text');

        const changed = await hierarchy.armField(id, 'components.element.type', 'image');
        await inspector.setSelect(element, 'Type', 'Image');
        await changed();
        expect(await inspector.read(id, 'components.element.type')).toBe('image');
        await expect(inspector.assetSlot(element, 'Texture')).toBeVisible();
        await expect(inspector.field(element, 'Text')).toBeHidden();
    });

    test('edit text', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { element: {} } });
        const text = uniqueName('label');

        await hierarchy.setSelection([id]);
        const element = inspector.component('element');
        await expect(inspector.field(element, 'Text')).toBeVisible();

        const changed = await hierarchy.armField(id, 'components.element.text', text);
        await inspector.setText(element, 'Text', text);
        await changed();
        expect(await inspector.read(id, 'components.element.text')).toBe(text);
    });

    test('edit font size', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { element: {} } });

        await hierarchy.setSelection([id]);
        const element = inspector.component('element');
        await expect(inspector.field(element, 'Font Size')).toBeVisible();

        const changed = await hierarchy.armField(id, 'components.element.fontSize', 18);
        await inspector.setNumber(element, 'Font Size', 18);
        await changed();
        expect(await inspector.read(id, 'components.element.fontSize')).toBe(18);

        const undone = await hierarchy.armField(id, 'components.element.fontSize', 32);
        await inspector.shell.undo();
        await undone();
        expect(await inspector.read(id, 'components.element.fontSize')).toBe(32);
    });

    test('assign texture', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const assets = new AssetsPanel(editorPage);
        const texture = await assets.uploadFile({
            name: `${uniqueName('tex')}.png`,
            type: 'texture',
            mimeType: 'image/png',
            buffer: PNG
        });
        const id = await hierarchy.createEntity({
            name: uniqueName('ent'),
            components: { element: { type: 'image' } }
        });

        await hierarchy.setSelection([id]);
        const element = inspector.component('element');
        await expect(inspector.assetSlot(element, 'Texture')).toBeVisible();

        const changed = await hierarchy.armField(id, 'components.element.textureAsset', texture.id);
        await inspector.assignAsset(element, 'Texture', texture.name);
        await changed();
        expect(await inspector.read(id, 'components.element.textureAsset')).toBe(texture.id);
    });

    test('set anchor preset', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { element: {} } });

        await hierarchy.setSelection([id]);
        const element = inspector.component('element');
        await expect(element).toBeVisible();
        expect(await inspector.read(id, 'components.element.anchor')).toEqual([0.5, 0.5, 0.5, 0.5]);

        const changed = await hierarchy.armField(id, 'components.element.anchor', [0, 1, 0, 1]);
        await inspector.setSelect(element, 'Preset', 'Top Left Anchor');
        await changed();
        expect(await inspector.read(id, 'components.element.anchor')).toEqual([0, 1, 0, 1]);
        expect((await inspector.shell.history()).last).toBe('entities.components.element.preset');
    });

    test('toggle button active', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { button: {} } });

        await hierarchy.setSelection([id]);
        const button = inspector.component('button');
        await expect(button).toBeVisible();
        expect(await inspector.read(id, 'components.button.active')).toBe(true);

        const changed = await hierarchy.armField(id, 'components.button.active', false);
        await inspector.toggle(button, 'Active');
        await changed();
        expect(await inspector.read(id, 'components.button.active')).toBe(false);

        const undone = await hierarchy.armField(id, 'components.button.active', true);
        await inspector.shell.undo();
        await undone();
        expect(await inspector.read(id, 'components.button.active')).toBe(true);
    });

    test('switch transition mode swaps tint fields', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { button: {} } });

        await hierarchy.setSelection([id]);
        const button = inspector.component('button');
        await expect(button).toBeVisible();
        expect(await inspector.fieldVisible(button, 'Hover Tint')).toBe(true);
        expect(await inspector.fieldVisible(button, 'Hover Sprite')).toBe(false);

        const changed = await hierarchy.armField(id, 'components.button.transitionMode', 1);
        await inspector.setSelect(button, 'Transition Mode', 'Sprite Change');
        await changed();
        expect(await inspector.read(id, 'components.button.transitionMode')).toBe(1);
        await expect(inspector.assetSlot(button, 'Hover Sprite')).toBeVisible();
        await expect(inspector.field(button, 'Hover Tint')).toBeHidden();
        await expect(inspector.field(button, 'Fade Duration')).toBeHidden();
    });

    test('pick image entity', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const image = uniqueName('img');
        const imageId = await hierarchy.createEntity({ name: image, components: { element: { type: 'image' } } });
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { button: {} } });

        await hierarchy.setSelection([id]);
        const button = inspector.component('button');
        await expect(button).toBeVisible();

        const changed = await hierarchy.armField(id, 'components.button.imageEntity', imageId);
        await inspector.pickEntity(button, 'Image', image);
        await changed();
        expect(await inspector.read(id, 'components.button.imageEntity')).toBe(imageId);
    });

    test('switch orientation', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { layoutgroup: {} } });

        await hierarchy.setSelection([id]);
        const group = inspector.component('layoutgroup');
        await expect(group).toBeVisible();
        expect(await inspector.read(id, 'components.layoutgroup.orientation')).toBe(0);

        const changed = await hierarchy.armField(id, 'components.layoutgroup.orientation', 1);
        await inspector.setSelect(group, 'Orientation', 'Vertical');
        await changed();
        expect(await inspector.read(id, 'components.layoutgroup.orientation')).toBe(1);
    });

    test('edit spacing', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { layoutgroup: {} } });

        await hierarchy.setSelection([id]);
        const group = inspector.component('layoutgroup');
        await expect(group).toBeVisible();

        // spacing is a vec2, horizontal then vertical
        const changed = await hierarchy.armField(id, 'components.layoutgroup.spacing', [4, 6]);
        await inspector.setVector(group, 'Spacing', [4, 6]);
        await changed();
        expect(await inspector.read(id, 'components.layoutgroup.spacing')).toEqual([4, 6]);
    });

    test('edit min width', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { layoutchild: {} } });

        await hierarchy.setSelection([id]);
        const child = inspector.component('layoutchild');
        await expect(child).toBeVisible();

        const changed = await hierarchy.armField(id, 'components.layoutchild.minWidth', 24);
        await inspector.setNumber(child, 'Min Width', 24);
        await changed();
        expect(await inspector.read(id, 'components.layoutchild.minWidth')).toBe(24);

        const undone = await hierarchy.armField(id, 'components.layoutchild.minWidth', 0);
        await inspector.shell.undo();
        await undone();
        expect(await inspector.read(id, 'components.layoutchild.minWidth')).toBe(0);
    });

    test('toggle exclude from layout', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { layoutchild: {} } });

        await hierarchy.setSelection([id]);
        const child = inspector.component('layoutchild');
        await expect(child).toBeVisible();

        const changed = await hierarchy.armField(id, 'components.layoutchild.excludeFromLayout', true);
        await inspector.toggle(child, 'Exclude from Layout');
        await changed();
        expect(await inspector.read(id, 'components.layoutchild.excludeFromLayout')).toBe(true);
    });

    test('toggle scroll axes', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { scrollview: {} } });

        await hierarchy.setSelection([id]);
        const scroll = inspector.component('scrollview');
        await expect(scroll).toBeVisible();

        // the horizontal and vertical blocks each repeat the Scrollbar and Visibility labels,
        // in that order, so the horizontal pair is the first of each
        const horizontal = await hierarchy.armField(id, 'components.scrollview.horizontal', false);
        await inspector.toggle(scroll, 'Horizontal');
        await horizontal();
        expect(await inspector.read(id, 'components.scrollview.horizontal')).toBe(false);
        await expect(inspector.field(scroll, 'Scrollbar').first()).toBeHidden();
        await expect(inspector.field(scroll, 'Visibility').first()).toBeHidden();

        const vertical = await hierarchy.armField(id, 'components.scrollview.vertical', false);
        await inspector.toggle(scroll, 'Vertical');
        await vertical();
        expect(await inspector.read(id, 'components.scrollview.vertical')).toBe(false);
        await expect(inspector.field(scroll, 'Scrollbar').last()).toBeHidden();
    });

    test('pick viewport and content entities', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const viewport = uniqueName('viewport');
        const content = uniqueName('content');
        const viewportId = await hierarchy.createEntity({ name: viewport });
        const contentId = await hierarchy.createEntity({ name: content });
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { scrollview: {} } });

        await hierarchy.setSelection([id]);
        const scroll = inspector.component('scrollview');
        await expect(scroll).toBeVisible();

        const picked = await Promise.all([
            hierarchy.armField(id, 'components.scrollview.viewportEntity', viewportId),
            hierarchy.armField(id, 'components.scrollview.contentEntity', contentId)
        ]);
        await inspector.pickEntity(scroll, 'Viewport', viewport);
        await inspector.pickEntity(scroll, 'Content', content);
        await Promise.all(picked.map(done => done()));
        expect(await inspector.read(id, 'components.scrollview.viewportEntity')).toBe(viewportId);
        expect(await inspector.read(id, 'components.scrollview.contentEntity')).toBe(contentId);
    });

    test('switch scrollbar orientation', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { scrollbar: {} } });

        await hierarchy.setSelection([id]);
        const scrollbar = inspector.component('scrollbar');
        await expect(scrollbar).toBeVisible();
        expect(await inspector.read(id, 'components.scrollbar.orientation')).toBe(0);

        const changed = await hierarchy.armField(id, 'components.scrollbar.orientation', 1);
        await inspector.setSelect(scrollbar, 'Orientation', 'Vertical');
        await changed();
        expect(await inspector.read(id, 'components.scrollbar.orientation')).toBe(1);
    });

    test('edit handle size', async ({ editorPage }) => {
        const inspector = new Inspector(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const id = await hierarchy.createEntity({ name: uniqueName('ent'), components: { scrollbar: {} } });

        await hierarchy.setSelection([id]);
        const scrollbar = inspector.component('scrollbar');
        await expect(scrollbar).toBeVisible();

        const changed = await hierarchy.armField(id, 'components.scrollbar.handleSize', 0.25);
        await inspector.setNumber(scrollbar, 'Handle Size', 0.25);
        await changed();
        expect(await inspector.read(id, 'components.scrollbar.handleSize')).toBe(0.25);
    });
});
