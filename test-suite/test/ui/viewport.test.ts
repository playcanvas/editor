import type { Page } from '@playwright/test';

import { expect, test } from '../../lib/fixtures';
import { EditorShell } from '../../lib/pages/common';
import { HierarchyPanel } from '../../lib/pages/hierarchy';
import { Toolbar } from '../../lib/pages/toolbar';
import { uniqueName } from '../../lib/utils';

const VIEWPORT = { width: 1600, height: 1000 };
const GIZMOS = ['translate', 'rotate', 'scale', 'resize'];

// "inactive" lives on the tooltips, so an exact word match is needed here
const ACTIVE = /(^|\s)active(\s|$)/;
const DISABLED = /pcui-disabled/;

// a new project ships a Box at (0, 0.5, 0) on an 8x8 Plane, so anything that has to be
// picked through the canvas goes above and clear of them
const CLEAR_A = [4, 4, -4];
const CLEAR_B = [-4, 4, 4];

const setPosition = (page: Page, id: string, position: number[]) => {
    return page.evaluate(({ i, p }) => {
        const entity = window.editor.api.globals.entities.get(i);
        if (!entity) {
            return;
        }

        // setup, not the thing under test: keep it off the undo stack
        entity.history.enabled = false;
        entity.set('position', p);
        entity.history.enabled = true;
    }, { i: id, p: position });
};

const deleteEntity = (page: Page, id: string) => {
    return page.evaluate(async (i) => {
        const entities = window.editor.api.globals.entities;
        const entity = entities.get(i);
        if (entity) {
            await entities.delete([entity], { history: true });
        }
    }, id);
};

const makeBox = async (page: Page, hierarchy: HierarchyPanel, position?: number[]) => {
    const name = uniqueName('box');
    const id = await hierarchy.createEntity({ name, components: { render: { type: 'box' } } });
    if (position) {
        await setPosition(page, id, position);
    }
    return { id, name };
};

const expectActiveGizmo = async (toolbar: Toolbar, type: string) => {
    for (const gizmo of GIZMOS) {
        const button = toolbar.button(`gizmo-${gizmo}`);
        if (gizmo === type) {
            await expect(button).toHaveClass(ACTIVE);
        } else {
            await expect(button).not.toHaveClass(ACTIVE);
        }
    }
};

// the worker project is shared by the whole run, so hand back the scene we were given
let baseline: string[] = [];

test.describe('viewport', () => {
    test.beforeEach(async ({ editorPage }) => {
        await editorPage.setViewportSize(VIEWPORT);
        await new Toolbar(editorPage).resetCamera();
        baseline = await new HierarchyPanel(editorPage).ids();
    });

    test.afterEach(async ({ editorPage }) => {
        const hierarchy = new HierarchyPanel(editorPage);
        const ids = await hierarchy.ids();
        await hierarchy.remove(ids.filter(id => !baseline.includes(id)));
    });

    test('click select', async ({ editorPage }) => {
        const toolbar = new Toolbar(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const { id } = await makeBox(editorPage, hierarchy, CLEAR_A);
        await toolbar.render();

        const selected = await hierarchy.armSelection([id]);
        await toolbar.clickViewport(await toolbar.screenPointOf(id));
        await selected();

        const cleared = await hierarchy.armSelection([]);
        await toolbar.clickViewport(await toolbar.emptyPoint());
        await cleared();
    });

    test('box select', async ({ editorPage }) => {
        const toolbar = new Toolbar(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const a = await makeBox(editorPage, hierarchy, CLEAR_A);
        const b = await makeBox(editorPage, hierarchy, CLEAR_B);
        await toolbar.render();

        const pointA = await toolbar.screenPointOf(a.id);
        const selected = await hierarchy.armSelection([a.id]);
        await toolbar.clickViewport(pointA);
        await selected();

        const multiple = await hierarchy.armSelection([a.id, b.id]);
        await toolbar.clickViewport(await toolbar.screenPointOf(b.id), ['ControlOrMeta']);
        await multiple();

        // a box that only covers A; it starts far enough out that the gizmo (on the midpoint of
        // the two boxes) cannot swallow the drag
        const boxed = await hierarchy.armSelection([a.id]);
        await toolbar.dragViewport(
            { x: pointA.x - 60, y: pointA.y - 60 },
            { x: pointA.x + 60, y: pointA.y + 60 },
            ['ControlOrMeta']
        );

        await boxed();
    });

    test('switch gizmo type', async ({ editorPage }) => {
        const toolbar = new Toolbar(editorPage);

        // hotkeys are ignored while an input has focus, so put it back on the page first
        await toolbar.clickViewport(await toolbar.emptyPoint());

        expect(await toolbar.gizmoType()).toBe('translate');
        await expectActiveGizmo(toolbar, 'translate');

        for (const [key, type] of [['2', 'rotate'], ['3', 'scale'], ['1', 'translate']]) {
            await editorPage.keyboard.press(key);
            await expectActiveGizmo(toolbar, type);
            expect(await toolbar.gizmoType()).toBe(type);
        }

        await toolbar.button('gizmo-rotate').click();

        await expectActiveGizmo(toolbar, 'rotate');
        expect(await toolbar.gizmoType()).toBe('rotate');
    });

    test('toggle gizmo space', async ({ editorPage }) => {
        const toolbar = new Toolbar(editorPage);
        const space = toolbar.button('gizmo-space');
        await toolbar.clickViewport(await toolbar.emptyPoint());

        expect(await toolbar.coordSystem()).toBe('world');
        await expect(space).toHaveClass(ACTIVE);

        await editorPage.keyboard.press('l');

        await expect(space).not.toHaveClass(ACTIVE);
        expect(await toolbar.coordSystem()).toBe('local');

        await space.click();

        await expect(space).toHaveClass(ACTIVE);
        expect(await toolbar.coordSystem()).toBe('world');
    });

    test('translate with snap', async ({ editorPage }) => {
        const toolbar = new Toolbar(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const shell = new EditorShell(editorPage);
        const { id, name } = await makeBox(editorPage, hierarchy);

        await hierarchy.select(name);
        await toolbar.waitForGizmo();
        await toolbar.render();

        await toolbar.button('gizmo-snap').click();
        await expect(toolbar.button('gizmo-snap')).toHaveClass(ACTIVE);
        const increment = await toolbar.snapIncrement();

        // drag straight out along the screen projection of the arrow, past its tip
        const centre = await toolbar.screenPointOf(id);
        const handle = await toolbar.gizmoHandlePoint('x');
        const length = Math.hypot(handle.x - centre.x, handle.y - centre.y);
        const translated = await hierarchy.armAction('entities.translate');
        await toolbar.dragViewport(handle, {
            x: handle.x + ((handle.x - centre.x) / length) * 150,
            y: handle.y + ((handle.y - centre.y) / length) * 150
        });

        await translated();
        const moved = await toolbar.transform(id);
        expect(moved.position[0]).not.toBe(0);
        const steps = moved.position[0] / increment;
        expect(Math.abs(steps - Math.round(steps))).toBeLessThan(1e-6);
        expect(moved.position[1]).toBe(0);
        expect(moved.position[2]).toBe(0);
        expect((await shell.history()).last).toBe('entities.translate');
        await expect(toolbar.status).toHaveText('entities.translate');

        const undone = await hierarchy.armField(id, 'position', [0, 0, 0]);
        await shell.undo();
        await undone();
        expect((await toolbar.transform(id)).position).toEqual([0, 0, 0]);
    });

    test('focus selection', async ({ editorPage }) => {
        const toolbar = new Toolbar(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const focus = toolbar.button('gizmo-focus');
        const { name } = await makeBox(editorPage, hierarchy, CLEAR_A);
        await toolbar.render();

        const cleared = await hierarchy.armSelection([]);
        await toolbar.clickViewport(await toolbar.emptyPoint());
        await cleared();
        await expect(focus).toHaveClass(DISABLED);

        await hierarchy.select(name);
        await expect(focus).not.toHaveClass(DISABLED);

        const focused = await hierarchy.shell.arm(() => ({ done: new Promise<void>((resolve) => {
            window.editor.once('camera:focus:end', () => resolve());
        }) }));
        const before = await toolbar.camera();
        await editorPage.keyboard.press('f');

        // focus is a multi frame fly, so wait for the editor to say it finished
        await focused();
        const after = await toolbar.camera();
        expect(after.name).toBe('perspective');
        expect(after.position).not.toEqual(before.position);
    });

    test('collapse panels', async ({ editorPage }) => {
        const toolbar = new Toolbar(editorPage);
        await toolbar.clickViewport(await toolbar.emptyPoint());

        await editorPage.keyboard.press(' ');

        await expect(toolbar.panel('hierarchy')).toBeHidden();
        expect(await toolbar.expandState()).toBe(true);
        await expect(toolbar.panel('assets')).toBeHidden();
        await expect(toolbar.panel('attributes')).toBeHidden();
        await expect(toolbar.expand).toHaveClass(ACTIVE);

        await editorPage.keyboard.press(' ');

        await expect(toolbar.panel('hierarchy')).toBeVisible();
        expect(await toolbar.expandState()).toBe(false);
        await expect(toolbar.expand).not.toHaveClass(ACTIVE);

        await toolbar.expand.click();

        await expect(toolbar.panel('attributes')).toBeHidden();
        expect(await toolbar.expandState()).toBe(true);

        await toolbar.expand.click();

        await expect(toolbar.panel('assets')).toBeVisible();
        expect(await toolbar.expandState()).toBe(false);
    });

    test('undo and redo buttons', async ({ editorPage }) => {
        const toolbar = new Toolbar(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const shell = new EditorShell(editorPage);
        const undo = toolbar.button('undo');
        const redo = toolbar.button('redo');

        await toolbar.clearHistory();

        expect(await shell.history()).toMatchObject({ canUndo: false, canRedo: false });
        await expect(undo).toHaveClass(DISABLED);
        await expect(redo).toHaveClass(DISABLED);

        const { id } = await makeBox(editorPage, hierarchy);

        expect((await shell.history()).canUndo).toBe(true);
        await expect(undo).not.toHaveClass(DISABLED);
        await expect(redo).toHaveClass(DISABLED);

        const deleted = await hierarchy.armAction('delete entities');
        await deleteEntity(editorPage, id);
        await deleted();

        expect(await hierarchy.exists(id)).toBe(false);
        await expect(undo).not.toHaveClass(DISABLED);

        const undone = await hierarchy.armField(id, 'resource_id', id);
        await undo.click();
        await undone();
        expect((await shell.history()).canRedo).toBe(true);
        await expect(redo).not.toHaveClass(DISABLED);

        const redone = await hierarchy.armField(id, 'resource_id', undefined);
        await redo.click();
        await redone();
        expect(await shell.history()).toMatchObject({ canUndo: true, canRedo: false });
        await expect(redo).toHaveClass(DISABLED);
    });
});
