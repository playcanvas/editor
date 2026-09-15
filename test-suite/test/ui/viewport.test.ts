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

        await toolbar.clickViewport(await toolbar.screenPointOf(id));

        // the pick is a GPU render plus a readPixels, which is slow under ANGLE
        await expect.poll(async () => (await hierarchy.selection()).ids).toEqual([id]);

        await toolbar.clickViewport(await toolbar.emptyPoint());

        await expect.poll(async () => (await hierarchy.selection()).count).toBe(0);
    });

    test('box select', async ({ editorPage }) => {
        const toolbar = new Toolbar(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const a = await makeBox(editorPage, hierarchy, CLEAR_A);
        const b = await makeBox(editorPage, hierarchy, CLEAR_B);
        await toolbar.render();

        const pointA = await toolbar.screenPointOf(a.id);
        await toolbar.clickViewport(pointA);
        await expect.poll(async () => (await hierarchy.selection()).ids).toEqual([a.id]);

        await toolbar.clickViewport(await toolbar.screenPointOf(b.id), ['ControlOrMeta']);
        await expect.poll(async () => [...(await hierarchy.selection()).ids].sort()).toEqual([a.id, b.id].sort());

        // a box that only covers A; it starts far enough out that the gizmo (on the midpoint of
        // the two boxes) cannot swallow the drag
        await toolbar.dragViewport(
            { x: pointA.x - 60, y: pointA.y - 60 },
            { x: pointA.x + 60, y: pointA.y + 60 },
            ['ControlOrMeta']
        );

        await expect.poll(async () => (await hierarchy.selection()).ids).toEqual([a.id]);
    });

    test('switch gizmo type', async ({ editorPage }) => {
        const toolbar = new Toolbar(editorPage);

        // hotkeys are ignored while an input has focus, so put it back on the page first
        await toolbar.clickViewport(await toolbar.emptyPoint());

        expect(await toolbar.gizmoType()).toBe('translate');
        await expectActiveGizmo(toolbar, 'translate');

        for (const [key, type] of [['2', 'rotate'], ['3', 'scale'], ['1', 'translate']]) {
            await editorPage.keyboard.press(key);
            await expect.poll(() => toolbar.gizmoType()).toBe(type);
            await expectActiveGizmo(toolbar, type);
        }

        await toolbar.button('gizmo-rotate').click();

        await expect.poll(() => toolbar.gizmoType()).toBe('rotate');
        await expectActiveGizmo(toolbar, 'rotate');
    });

    test('toggle gizmo space', async ({ editorPage }) => {
        const toolbar = new Toolbar(editorPage);
        const space = toolbar.button('gizmo-space');
        await toolbar.clickViewport(await toolbar.emptyPoint());

        expect(await toolbar.coordSystem()).toBe('world');
        await expect(space).toHaveClass(ACTIVE);

        await editorPage.keyboard.press('l');

        await expect.poll(() => toolbar.coordSystem()).toBe('local');
        await expect(space).not.toHaveClass(ACTIVE);

        await space.click();

        await expect.poll(() => toolbar.coordSystem()).toBe('world');
        await expect(space).toHaveClass(ACTIVE);
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
        await toolbar.dragViewport(handle, {
            x: handle.x + ((handle.x - centre.x) / length) * 150,
            y: handle.y + ((handle.y - centre.y) / length) * 150
        });

        await expect.poll(async () => (await toolbar.transform(id)).position[0]).not.toBe(0);
        const moved = await toolbar.transform(id);
        const steps = moved.position[0] / increment;
        expect(Math.abs(steps - Math.round(steps))).toBeLessThan(1e-6);
        expect(moved.position[1]).toBe(0);
        expect(moved.position[2]).toBe(0);
        expect((await shell.history()).last).toBe('entities.translate');
        await expect(toolbar.status).toHaveText('entities.translate');

        await shell.undo();

        await expect.poll(async () => (await toolbar.transform(id)).position).toEqual([0, 0, 0]);
    });

    test('focus selection', async ({ editorPage }) => {
        const toolbar = new Toolbar(editorPage);
        const hierarchy = new HierarchyPanel(editorPage);
        const focus = toolbar.button('gizmo-focus');
        const { name } = await makeBox(editorPage, hierarchy, CLEAR_A);
        await toolbar.render();

        await toolbar.clickViewport(await toolbar.emptyPoint());
        await expect.poll(async () => (await hierarchy.selection()).count).toBe(0);
        await expect(focus).toHaveClass(DISABLED);

        await hierarchy.select(name);
        await expect(focus).not.toHaveClass(DISABLED);

        await toolbar.watch('camera:focus:end');
        const before = await toolbar.camera();
        await editorPage.keyboard.press('f');

        // focus is a multi frame fly, so wait for the editor to say it finished
        await expect.poll(() => toolbar.fired('camera:focus:end')).toBeGreaterThan(0);
        const after = await toolbar.camera();
        expect(after.name).toBe('perspective');
        expect(after.position).not.toEqual(before.position);
    });

    test('collapse panels', async ({ editorPage }) => {
        const toolbar = new Toolbar(editorPage);
        await toolbar.clickViewport(await toolbar.emptyPoint());

        await editorPage.keyboard.press(' ');

        await expect.poll(() => toolbar.expandState()).toBe(true);
        await expect(toolbar.panel('hierarchy')).toBeHidden();
        await expect(toolbar.panel('assets')).toBeHidden();
        await expect(toolbar.panel('attributes')).toBeHidden();
        await expect(toolbar.expand).toHaveClass(ACTIVE);

        await editorPage.keyboard.press(' ');

        await expect.poll(() => toolbar.expandState()).toBe(false);
        await expect(toolbar.panel('hierarchy')).toBeVisible();
        await expect(toolbar.expand).not.toHaveClass(ACTIVE);

        await toolbar.expand.click();

        await expect.poll(() => toolbar.expandState()).toBe(true);
        await expect(toolbar.panel('attributes')).toBeHidden();

        await toolbar.expand.click();

        await expect.poll(() => toolbar.expandState()).toBe(false);
        await expect(toolbar.panel('assets')).toBeVisible();
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

        await deleteEntity(editorPage, id);
        await hierarchy.waitForAction('delete entities');

        expect(await hierarchy.exists(id)).toBe(false);
        await expect(undo).not.toHaveClass(DISABLED);

        await undo.click();

        await expect.poll(() => hierarchy.exists(id)).toBe(true);
        expect((await shell.history()).canRedo).toBe(true);
        await expect(redo).not.toHaveClass(DISABLED);

        await redo.click();

        await expect.poll(() => hierarchy.exists(id)).toBe(false);
        expect(await shell.history()).toMatchObject({ canUndo: true, canRedo: false });
        await expect(redo).toHaveClass(DISABLED);
    });
});
