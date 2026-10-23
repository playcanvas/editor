import {
    BoundingBoxGizmo,
    BoxGizmo,
    CameraGizmo,
    CapsuleGizmo,
    ConeGizmo,
    CylinderGizmo,
    HandleGizmo,
    IconGizmo,
    LightGizmo,
    Quat,
    SphereGizmo
} from 'playcanvas';
import type { DragGizmo, Entity, Gizmo, GraphNode, Layer, ShapeGizmo } from 'playcanvas';

import type { EntityObserver } from '@/editor-api';

import { initEngineGizmo, releaseEngineGizmo } from './gizmo-engine';

// engine helper gizmos, in both presets: camera, light and bounds handles, collision shape
// handles and screen-sized icons

type Edit = {
    observer: EntityObserver;
    path: string;
    read: () => unknown;
};

// components the engine icon gizmo has glyphs for
const ICON_COMPONENTS = ['camera', 'light', 'audiolistener', 'sound', 'particlesystem'];

const GIZMO_ANGLE_MULT = 5;

// the capsule, cone and cylinder gizmos run along y; collision axis 0 and 2 turn them onto x and z
const AXIS_ROTATIONS = [new Quat().setFromEulerAngles(0, 0, -90), new Quat(), new Quat().setFromEulerAngles(90, 0, 0)];

const clone = (value: unknown) => (Array.isArray(value) ? value.slice() : value);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const observerOf = (entity: GraphNode | null): EntityObserver | null =>
    entity ? editor.call('entities:get', (entity as Entity).guid) || null : null;

let camerasGizmo: CameraGizmo | null = null;
let lightsGizmo: LightGizmo | null = null;
let boundsGizmo: BoundingBoxGizmo | null = null;
let iconsGizmo: IconGizmo | null = null;
let shapes: Record<string, ShapeGizmo> | null = null;
let all: (HandleGizmo | IconGizmo)[] = [];

let write = false;
let shapeDragging = false;

const selectedEntities = (): Entity[] => {
    if (editor.call('selector:type') !== 'entity') {
        return [];
    }
    return (editor.call('selector:items') as EntityObserver[]).map((o) => o.entity).filter(Boolean);
};

// attach only when the nodes change, so gizmos don't rebuild every frame
const attached = new WeakMap<Gizmo, GraphNode[]>();
const attach = (gizmo: Gizmo, nodes: GraphNode[]) => {
    const prev = attached.get(gizmo) ?? [];
    if (prev.length === nodes.length && prev.every((node, i) => node === nodes[i])) {
        return;
    }
    attached.set(gizmo, nodes);
    if (nodes.length) {
        gizmo.attach(nodes);
    } else {
        gizmo.detach();
    }
};

/**
 * Routes handle drags through the entity observers: live, history-free updates while dragging
 * and one undoable entry when the drag ends.
 *
 * @param gizmo - The handle gizmo.
 * @param edits - The observer paths a handle changes and how to read their new values.
 */
const trackEdits = (gizmo: HandleGizmo, edits: (node: GraphNode | null, name: string) => Edit[]) => {
    let active: { edits: Edit[]; before: unknown[] } | null = null;

    gizmo.on(HandleGizmo.EVENT_HANDLESTART, (node: GraphNode | null, name: string) => {
        const list = edits(node, name).filter((edit) => edit.observer);
        active = { edits: list, before: list.map((edit) => clone(edit.observer.get(edit.path))) };
        list.forEach((edit) => {
            edit.observer.history.enabled = false;
        });
        editor.call('viewport:pick:state', false);
    });
    gizmo.on(HandleGizmo.EVENT_HANDLEMOVE, () => {
        active?.edits.forEach((edit) => edit.observer.set(edit.path, edit.read()));
    });
    gizmo.on(HandleGizmo.EVENT_HANDLEEND, (_node: GraphNode | null, name: string) => {
        if (!active) {
            return;
        }
        const { edits: list, before } = active;
        active = null;

        const after = list.map((edit) => clone(edit.read()));
        list.forEach((edit, i) => {
            edit.observer.set(edit.path, after[i]);
            edit.observer.history.enabled = true;
        });
        editor.call('viewport:pick:state', true);

        if (list.every((_edit, i) => same(before[i], after[i]))) {
            return;
        }
        const apply = (values: unknown[]) => {
            list.forEach((edit, i) => {
                const observer = edit.observer.latest() as EntityObserver;
                if (!observer) {
                    return;
                }
                const history = observer.history.enabled;
                observer.history.enabled = false;
                observer.set(edit.path, clone(values[i]));
                observer.history.enabled = history;
            });
        };
        editor.api.globals.history.add({
            name: `entity.${name}`,
            combine: false,
            undo: () => apply(before),
            redo: () => apply(after)
        });
    });
};

const scaleEdit = (entity: GraphNode): Edit => ({
    observer: observerOf(entity),
    path: 'scale',
    read: () => entity.getLocalScale().toArray()
});

const setSize = (value: number) => {
    for (const gizmo of all) {
        gizmo.size = value ?? 1;
    }
    editor.call('viewport:render');
};

// the editor keeps every scene camera component disabled and renders through its own cameras,
// while the engine camera and icon gizmos skip disabled cameras
// TODO: drop these overrides once the engine gizmos can draw disabled cameras
const drawDisabledCameras = (gizmo: CameraGizmo) => {
    const internal = gizmo as unknown as { _draw: (entity: Entity) => void; _drawShapes: () => void };
    const draw = internal._draw.bind(gizmo);
    internal._drawShapes = () => {
        for (const node of gizmo.nodes) {
            const entity = node as Entity;
            if (entity.enabled && entity.camera && entity.camera !== gizmo.camera) {
                draw(entity);
            }
        }
    };
};
const iconDisabledCameras = (gizmo: IconGizmo) => {
    const internal = gizmo as unknown as { _iconOf: (entity: Entity) => string | null };
    const iconOf = internal._iconOf.bind(gizmo);
    internal._iconOf = (entity: Entity) => {
        const icon = iconOf(entity);
        if (icon || !entity.enabled || !entity.camera || entity.camera === gizmo.camera) {
            return icon;
        }
        const { render, model, sprite, element } = entity;
        const drawn = render?.meshInstances.length || model?.meshInstances?.length || sprite || element;
        return drawn ? null : 'camera';
    };
};

const createGizmos = (camera: Entity, layer: Layer, iconLayer: Layer) => {
    // a press goes to the first gizmo it hits, so these come after the transform gizmos
    camerasGizmo = initEngineGizmo(new CameraGizmo(camera.camera, layer));
    drawDisabledCameras(camerasGizmo);

    // the icon gizmo draws every icon, selected or not, so icons stay at their entity
    camerasGizmo.icon = false;
    trackEdits(camerasGizmo, (node, name) => [
        {
            observer: observerOf(node),
            path: `components.camera.${name}`,
            read: () => ((node as Entity).camera as unknown as Record<string, number>)[name]
        }
    ]);

    lightsGizmo = initEngineGizmo(new LightGizmo(camera.camera, layer));
    lightsGizmo.icon = false;
    trackEdits(lightsGizmo, (node, name) => {
        const light = (node as Entity).light as unknown as Record<string, number>;
        const prop = (path: string): Edit => ({
            observer: observerOf(node),
            path: `components.light.${path}`,
            read: () => light[path]
        });
        switch (name) {
            case 'range': {
                return [prop('range')];
            }
            case 'innerConeAngle': {
                return [prop('innerConeAngle')];
            }
            case 'outerConeAngle': {
                // the outer angle also caps the inner one
                return [prop('outerConeAngle'), prop('innerConeAngle')];
            }
            default: {
                // area light width, depth and radius are the entity scale
                return [scaleEdit(node)];
            }
        }
    });

    const box = new BoxGizmo(camera.camera, layer);
    box.centered = true;
    shapes = {
        box,
        sphere: new SphereGizmo(camera.camera, layer),
        capsule: new CapsuleGizmo(camera.camera, layer),
        cone: new ConeGizmo(camera.camera, layer),
        cylinder: new CylinderGizmo(camera.camera, layer)
    };
    for (const [type, gizmo] of Object.entries(shapes)) {
        initEngineGizmo(gizmo);
        gizmo.enabled = false;
        const shape = gizmo as unknown as { halfExtents?: { toArray: () => number[] }; radius: number; height: number };
        trackEdits(gizmo, () => {
            const entity = selectedEntities()[0];
            const observer = observerOf(entity);
            const prop = (path: string, read: () => unknown): Edit => ({
                observer,
                path: `components.collision.${path}`,
                read
            });
            if (type === 'box') {
                return [prop('halfExtents', () => shape.halfExtents.toArray())];
            }
            if (type === 'sphere') {
                return [prop('radius', () => shape.radius)];
            }
            return [prop('radius', () => shape.radius), prop('height', () => shape.height)];
        });
        gizmo.on(HandleGizmo.EVENT_HANDLESTART, () => {
            shapeDragging = true;
        });
        gizmo.on(HandleGizmo.EVENT_HANDLEEND, () => {
            shapeDragging = false;
        });
    }

    // after the collision shapes, whose handles sit on the same spots and are the specific edit
    boundsGizmo = initEngineGizmo(new BoundingBoxGizmo(camera.camera, layer));
    trackEdits(boundsGizmo, () =>
        boundsGizmo.nodes.flatMap((node) => [
            { observer: observerOf(node), path: 'position', read: () => node.getLocalPosition().toArray() },
            scaleEdit(node)
        ])
    );

    // lights and cameras that aren't selected show only their icons
    iconsGizmo = initEngineGizmo(new IconGizmo(camera.camera, iconLayer));
    iconDisabledCameras(iconsGizmo);

    all = [camerasGizmo, lightsGizmo, boundsGizmo, ...Object.values(shapes), iconsGizmo];

    // clicking an icon selects its entity, with ctrl adding to or removing from the selection
    for (const gizmo of all) {
        gizmo.on(IconGizmo.EVENT_ICONSELECT, (entity: GraphNode) => {
            const observer = observerOf(entity);
            if (!observer) {
                return;
            }
            if (editor.call('selector:type') === 'entity' && editor.call('hotkey:ctrl')) {
                if (editor.call('selector:has', observer)) {
                    editor.call('selector:remove', observer);
                } else {
                    editor.call('selector:add', 'entity', observer);
                }
            } else {
                editor.call('selector:set', 'entity', [observer]);
            }
        });
    }

    for (const gizmo of [camerasGizmo, lightsGizmo, boundsGizmo, ...Object.values(shapes)]) {
        gizmo.handles = write;
    }
    setSize(editor.call('settings:user').get('editor.gizmoSize'));
};

const updateShapes = (entity: Entity | null) => {
    const collision = entity?.collision;
    const type = entity?.enabled && collision?.enabled ? collision.type : null;

    for (const [key, gizmo] of Object.entries(shapes)) {
        const active = key === type;
        if (gizmo.enabled !== active) {
            gizmo.enabled = active;
            if (!active) {
                releaseEngineGizmo(gizmo);
            }
        }
        if (!active || shapeDragging) {
            continue;
        }

        // follow the component while not dragging, so inspector edits and undo show up
        gizmo.position.copy(collision.getShapePosition());
        gizmo.rotation.copy(collision.getShapeRotation());
        const shape = gizmo as unknown as {
            halfExtents?: { copy: (v: unknown) => void };
            radius: number;
            height: number;
        };
        if (key === 'box') {
            shape.halfExtents.copy(collision.halfExtents);
        } else {
            shape.radius = collision.radius;
            if (key !== 'sphere') {
                shape.height = collision.height;
                gizmo.rotation.mul(AXIS_ROTATIONS[collision.axis] ?? AXIS_ROTATIONS[1]);
            }
        }
    }
};

// entities the icon gizmo shows an icon for: an icon component and nothing drawn
const hasIcon = (entity: Entity) => {
    if (!ICON_COMPONENTS.some((c) => entity.c[c])) {
        return false;
    }
    const { render, model, sprite, element } = entity;
    return !(render?.meshInstances.length || model?.meshInstances?.length || sprite || element);
};

const iconEntities = () => {
    const result: Entity[] = [];
    for (const observer of editor.call('entities:list') as EntityObserver[]) {
        const entity = observer.entity;
        if (entity && !entity.__noIcon && hasIcon(entity)) {
            result.push(entity);
        }
    }
    return result;
};

editor.on('scene:load', () => {
    if (!camerasGizmo) {
        createGizmos(
            editor.call('camera:current'),
            editor.call('gizmo:layers', 'Handle Gizmo'),
            editor.call('gizmo:layers', 'Icon Gizmo')
        );
    }
});

editor.on('scene:unload', () => {
    for (const gizmo of all) {
        attach(gizmo, []);
    }
});

editor.on('viewport:gizmoUpdate', () => {
    if (!shapes) {
        return;
    }
    const nodes = selectedEntities();

    attach(
        lightsGizmo,
        nodes.filter((entity) => entity.light)
    );
    attach(
        camerasGizmo,
        nodes.filter((entity) => entity.camera)
    );
    // icon-only entities have no bounds, and the origin marker would sit on their icon
    attach(boundsGizmo, editor.call('gizmo:boundingbox:visible') ? nodes.filter((entity) => !hasIcon(entity)) : []);
    attach(iconsGizmo, iconEntities());
    updateShapes(nodes.length === 1 ? nodes[0] : null);
});

editor.on('selector:change', () => editor.call('viewport:render'));
editor.on('gizmo:boundingbox:visible', () => editor.call('viewport:render'));

editor.on('permissions:writeState', (state: boolean) => {
    write = state;
    for (const gizmo of all) {
        if (gizmo instanceof HandleGizmo) {
            gizmo.handles = state;
        }
    }
});

editor.on('camera:change', (camera: Entity) => {
    for (const gizmo of all) {
        gizmo.camera = camera.camera;
    }
});

editor.on('gizmo:snap', (state: boolean, increment: number) => {
    for (const gizmo of all) {
        if (gizmo instanceof HandleGizmo) {
            const drag = gizmo as DragGizmo;
            drag.snap = state;
            drag.snapIncrement = increment;
            drag.snapAngleIncrement = increment * GIZMO_ANGLE_MULT;
        }
    }
});

editor.once('settings:user:load', () => {
    const settings = editor.call('settings:user');
    settings.on('editor.gizmoSize:set', setSize);
    setSize(settings.get('editor.gizmoSize'));
});
