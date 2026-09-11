import type { Locator, Page } from '@playwright/test';

type Point = { x: number; y: number };
type Modifier = 'Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift';

// the perspective editor camera's authored default (viewport/camera/camera.ts)
const CAMERA_POSITION = [9.2, 6, 9];
const CAMERA_EULER = [-25, 45, 0];

export class Toolbar {
    readonly canvas: Locator;

    readonly expand: Locator;

    readonly status: Locator;

    constructor(readonly page: Page) {
        this.canvas = page.locator('#canvas-3d');
        this.expand = page.locator('.control-strip.top-right .control-strip-btn.expand');
        this.status = page.locator('#layout-console .status');
    }

    button(id: string) {
        return this.page.locator(`[data-toolbar-id="${id}"]`);
    }

    panel(name: string) {
        return this.page.locator(`#layout-${name}`);
    }

    gizmoType() {
        return this.page.evaluate(() => window.editor.call('gizmo:type') as string);
    }

    coordSystem() {
        return this.page.evaluate(() => window.editor.call('gizmo:coordSystem') as string);
    }

    expandState() {
        return this.page.evaluate(() => window.editor.call('viewport:expand:state') as boolean);
    }

    /** The gizmo snap step, which falls back to 1 when the project user setting is unset. */
    snapIncrement() {
        return this.page.evaluate(() => {
            const settings = window.editor.call('settings:projectUser') as { get(path: string): number };
            return settings.get('editor.snapIncrement') || 1;
        });
    }

    camera() {
        return this.page.evaluate(() => {
            const camera = window.editor.call('camera:current') as any;
            const pos = camera.getPosition();
            return { name: camera.__editorName as string, position: [pos.x, pos.y, pos.z] as number[] };
        });
    }

    /** Puts the perspective camera back on its authored default so projected points are stable. */
    async resetCamera() {
        // the window resize has to have reached the canvas before a frame is drawn: the engine
        // caches the canvas rect per rendered frame and picking projects through it
        await this.canvasBox();
        await this.page.evaluate(([position, euler]) => {
            window.editor.call('camera:set', window.editor.call('camera:get', 'perspective'));
            const camera = window.editor.call('camera:current') as any;
            camera.setPosition(position[0], position[1], position[2]);
            camera.setEulerAngles(euler[0], euler[1], euler[2]);
        }, [CAMERA_POSITION, CAMERA_EULER]);
        await this.render();
    }

    /**
     * Requests a frame from the render-on-demand viewport and waits for it to be drawn: the
     * app's tick is itself driven by requestAnimationFrame, so the redraw lands on the next one.
     */
    async render() {
        await this.page.evaluate(() => {
            window.editor.call('viewport:render');
            return new Promise<void>((resolve) => {
                requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            });
        });
    }

    /**
     * Page coordinates of an entity's world position, optionally offset in world space. Device
     * pixel ratio is 1 under Playwright and both the projection and the bounding rect are in
     * CSS pixels, so no scaling is needed.
     */
    async screenPointOf(entityId: string, offset: number[] = [0, 0, 0]): Promise<Point> {
        const box = await this.canvasBox();
        const point = await this.page.evaluate(({ id, off, w, h }) => {
            const node = window.editor.api.globals.entities.get(id)?.viewportEntity;
            if (!node) {
                return null;
            }
            const pos = node.getPosition().clone();
            pos.x += off[0];
            pos.y += off[1];
            pos.z += off[2];
            const camera = window.editor.call('camera:current') as any;
            const out = camera.camera.camera.worldToScreen(pos, w, h);
            return { x: out.x as number, y: out.y as number };
        }, { id: entityId, off: offset, w: box.width, h: box.height });
        if (!point) {
            throw new Error(`entity ${entityId} has no viewport entity`);
        }
        return { x: box.x + point.x, y: box.y + point.y };
    }

    /**
     * Page coordinates of a transform gizmo axis handle, read off the live gizmo entity
     * (`gizmo:<type>` > `arrow:<axis>` > `head:<axis>`), so the preset's arrow length and the
     * camera-distance scaling of the gizmo are both accounted for. Render a frame before
     * calling it: the gizmo hit-tests through the canvas rect the engine caches per frame.
     */
    async gizmoHandlePoint(axis: 'x' | 'y' | 'z'): Promise<Point> {
        const box = await this.canvasBox();
        const point = await this.page.evaluate(({ a, w, h }) => {
            const app = window.editor.call('viewport:app') as any;
            const root = app?.root.findByName(`gizmo:${window.editor.call('gizmo:type')}`);
            const head = root?.findByName(`head:${a}`);
            if (!head) {
                return null;
            }
            const camera = window.editor.call('camera:current') as any;
            const out = camera.camera.camera.worldToScreen(head.getPosition(), w, h);
            return { x: out.x as number, y: out.y as number };
        }, { a: axis, w: box.width, h: box.height });
        if (!point) {
            throw new Error(`no ${axis} handle on the current gizmo`);
        }
        return { x: box.x + point.x, y: box.y + point.y };
    }

    /** Waits for the gizmo of the current type to be attached to the selection. */
    async waitForGizmo() {
        await this.page.waitForFunction(() => {
            const app = window.editor.call('viewport:app') as any;
            return !!app?.root.findByName(`gizmo:${window.editor.call('gizmo:type')}`)?.enabled;
        });
    }

    // the bottom right canvas corner: with the camera reset, nothing in a new project's scene
    // (an 8x8 plane and a unit box at the origin) reaches it, so a click there clears selection
    /** A canvas point the GPU picker resolves to nothing. */
    async emptyPoint(): Promise<Point> {
        const box = await this.canvasBox();
        return { x: box.x + box.width - 20, y: box.y + box.height - 20 };
    }

    /** A viewport pick: the editor treats a mousedown/up that moved under 8px as a click. */
    async clickViewport(point: Point, modifiers: Modifier[] = []) {
        await this.page.mouse.move(point.x, point.y);
        for (const key of modifiers) {
            await this.page.keyboard.down(key);
        }
        await this.page.mouse.down();
        await this.page.mouse.up();
        for (const key of modifiers) {
            await this.page.keyboard.up(key);
        }
    }

    /** Drags inside the viewport, crossing the editor's 8px move threshold before the real move. */
    async dragViewport(from: Point, to: Point, modifiers: Modifier[] = []) {
        await this.page.mouse.move(from.x, from.y);
        for (const key of modifiers) {
            await this.page.keyboard.down(key);
        }
        await this.page.mouse.down();
        await this.page.mouse.move(from.x + 10, from.y + 10, { steps: 4 });
        await this.page.mouse.move(to.x, to.y, { steps: 10 });
        await this.page.mouse.move(to.x, to.y);
        await this.page.mouse.up();
        for (const key of modifiers) {
            await this.page.keyboard.up(key);
        }
    }

    /** Starts counting the named editor events, replacing any previous watch. */
    async watch(...names: string[]) {
        await this.page.evaluate((list) => {
            const store = window as unknown as { pcEvt?: Record<string, number>; pcEvtBinds?: { unbind(): void }[] };
            store.pcEvtBinds?.forEach(bind => bind.unbind());
            const counts: Record<string, number> = {};
            store.pcEvt = counts;
            store.pcEvtBinds = list.map((name) => {
                counts[name] = 0;
                return window.editor.on(name, () => {
                    counts[name]++;
                });
            });
        }, names);
    }

    fired(name: string) {
        return this.page.evaluate(n => (window as unknown as { pcEvt?: Record<string, number> }).pcEvt?.[n] ?? 0, name);
    }

    /** Reads an entity's local transform straight off the observer. */
    transform(entityId: string) {
        return this.page.evaluate((id) => {
            const entity = window.editor.api.globals.entities.get(id);
            return {
                position: entity?.get('position') as number[],
                rotation: entity?.get('rotation') as number[],
                scale: entity?.get('scale') as number[]
            };
        }, entityId);
    }

    clearHistory() {
        return this.page.evaluate(() => window.editor.api.globals.history.clear());
    }

    // the editor resizes the canvas from a 60fps timer, so after a window resize the element
    // lags the layout; every coordinate here has to come from the size it settles on
    private async canvasBox() {
        await this.page.waitForFunction(() => {
            const canvas = document.getElementById('canvas-3d');
            const container = document.getElementById('layout-viewport');
            if (!canvas || !container) {
                return false;
            }
            const rect = container.getBoundingClientRect();
            return canvas.style.width === `${Math.floor(rect.width)}px` &&
                canvas.style.height === `${Math.floor(rect.height)}px`;
        });
        const box = await this.canvas.boundingBox();
        if (!box) {
            throw new Error('the viewport canvas is not visible');
        }
        return box;
    }
}
