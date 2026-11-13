import { Gizmo } from 'playcanvas';
import type { MeshInstance } from 'playcanvas';

// gizmos under the pointer and gizmos holding a press, across every engine gizmo
const hovering = new Set<Gizmo>();
const capturing = new Set<Gizmo>();
const hoverMeshes = new WeakMap<Gizmo, MeshInstance | null>();

const track = (set: Set<Gizmo>, gizmo: Gizmo, state: boolean, event: string) => {
    const before = set.size > 0;
    if (state) {
        set.add(gizmo);
    } else {
        set.delete(gizmo);
    }
    if (before !== set.size > 0) {
        editor.emit(event, set.size > 0);
    }
};

/**
 * Clears the hover and press state of a gizmo, for when it stops receiving pointer events.
 *
 * @param gizmo - The gizmo.
 */
export const releaseEngineGizmo = (gizmo: Gizmo) => {
    hoverMeshes.set(gizmo, null);
    track(hovering, gizmo, false, 'gizmo:hover');
    track(capturing, gizmo, false, 'gizmo:capture');
};

/**
 * Wires an engine gizmo into the viewport: left button only, rendered on demand, updated from
 * the editor tick, and reporting `gizmo:hover` and `gizmo:capture` so picking and camera
 * controls stand aside while the pointer is on it.
 *
 * @param gizmo - The gizmo.
 * @param pointer - Whether the gizmo takes pointer input. Defaults to true.
 * @returns The gizmo.
 */
export const initEngineGizmo = <T extends Gizmo>(gizmo: T, pointer = true) => {
    // keep pointer defaults so viewport tap handling still runs
    gizmo.preventDefault = false;

    gizmo.mouseButtons[0] = pointer;
    gizmo.mouseButtons[1] = false;
    gizmo.mouseButtons[2] = false;

    gizmo.on(Gizmo.EVENT_RENDERUPDATE, () => {
        editor.call('viewport:render');
    });

    // the editor tick never fires the app update event; prerender comes from the app render
    editor.on('viewport:update', () => gizmo.update());

    if (!pointer) {
        return gizmo;
    }

    gizmo.on(Gizmo.EVENT_POINTERMOVE, (_x: number, _y: number, meshInstance?: MeshInstance) => {
        const mesh = meshInstance || null;
        if ((hoverMeshes.get(gizmo) ?? null) === mesh) {
            return;
        }
        hoverMeshes.set(gizmo, mesh);
        track(hovering, gizmo, !!mesh, 'gizmo:hover');

        // nothing else renders on plain mouse movement, so repaint the hover highlight
        editor.call('viewport:render');
    });
    gizmo.on(Gizmo.EVENT_POINTERDOWN, (_x: number, _y: number, meshInstance?: MeshInstance) => {
        if (meshInstance) {
            track(capturing, gizmo, true, 'gizmo:capture');
        }
    });
    gizmo.on(Gizmo.EVENT_POINTERUP, () => {
        track(capturing, gizmo, false, 'gizmo:capture');

        // the gizmo asks for a frame from update, which only runs while rendering, so a drag that
        // ends without an edit would keep its highlight
        editor.call('viewport:render');
    });
    gizmo.on(Gizmo.EVENT_NODESDETACH, () => releaseEngineGizmo(gizmo));

    return gizmo;
};
