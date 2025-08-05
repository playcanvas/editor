import { type EntityObserver } from '@playcanvas/editor-api';
import { type Entity, type Gizmo, type Layer } from 'playcanvas';

import { GIZMO_SIZE } from '../../../core/constants.ts';

let gizmo: Gizmo | null = null;

type GizmoNodeTransform = {
    position: number[];
    rotation: number[];
    scale: number[];
};

const selection = (): EntityObserver[] => {
    const type = editor.call('selector:type');
    if (type !== 'entity') {
        return [];
    }
    return editor.call('selector:items');
};

const getTRS = (item: EntityObserver): GizmoNodeTransform => {
    const position: number[] = item.entity.getLocalPosition().toArray();
    const rotation: number[] = item.entity.getLocalEulerAngles().toArray();
    const scale: number[] = item.entity.getLocalScale().toArray();
    item.set('position', position);
    item.set('rotation', rotation);
    item.set('scale', scale);
    return { position, rotation, scale };
};
const setTRS = (item: EntityObserver, trs: GizmoNodeTransform) => {
    item.set('position', trs.position);
    item.set('rotation', trs.rotation);
    item.set('scale', trs.scale);
};

editor.on('scene:load', () => {
    const camera: Entity = editor.call('camera:current');
    const layer: Layer = editor.call('gizmo:layers', 'Axis Gizmo Immediate');
    gizmo = new pc.TranslateGizmo(camera.camera, layer);
    gizmo.size = GIZMO_SIZE;

    // call viewport render while moving gizmo
    gizmo.on(pc.Gizmo.EVENT_POINTERMOVE, () => {
        editor.call('viewport:render');
    });

    const store: GizmoNodeTransform[] = [];
    gizmo.on(pc.TransformGizmo.EVENT_TRANSFORMSTART, () => {
        const items = selection();
        if (!items.length) {
            return;
        }
        for (let i = 0; i < items.length; i++) {
            store[i] = getTRS(items[i]);
            items[i].history.enabled = false;
        }
    });
    gizmo.on(pc.TransformGizmo.EVENT_TRANSFORMMOVE, () => {
        const items = selection();
        if (!items.length) {
            return;
        }
        for (let i = 0; i < items.length; i++) {
            getTRS(items[i]);
        }
    });
    gizmo.on(pc.TransformGizmo.EVENT_TRANSFORMEND, () => {
        const items = selection();
        if (!items.length) {
            return;
        }
        const state: { from: GizmoNodeTransform, to: GizmoNodeTransform }[] = [];
        for (let i = 0; i < items.length; i++) {
            state.push({
                from: store[i],
                to: getTRS(items[i])
            });
            items[i].history.enabled = true;
        }
        store.length = 0;

        editor.api.globals.history.add({
            name: 'entities.translate',
            combine: false,
            undo: () => {
                for (let i = 0; i < items.length; i++) {
                    setTRS(items[i].latest() as EntityObserver, state[i].from);
                }
            },
            redo: () => {
                for (let i = 0; i < items.length; i++) {
                    setTRS(items[i].latest() as EntityObserver, state[i].to);
                }
            }
        });
    });

    // manually call prerender and update methods
    editor.on('viewport:preRender', gizmo.prerender.bind(gizmo));
    editor.on('viewport:update', gizmo.update.bind(gizmo));
});

editor.on('gizmo:coordSystem', (system) => {
    if (!gizmo) {
        return;
    }
    gizmo.coordSpace = system === 'local' ? pc.GIZMOSPACE_LOCAL : pc.GIZMOSPACE_WORLD;
});

const update = () => {
    if (!gizmo) {
        return;
    }
    const gizmoType: string = editor.call('gizmo:type');
    const selectorType: string = editor.call('selector:type');
    if (gizmoType === 'translate' && selectorType === 'entity') {
        gizmo.attach(editor.call('selector:items').map(item => item.entity));
    } else {
        gizmo.detach();
    }
};
editor.on('selector:change', update);
editor.on('gizmo:type', update);
editor.on('gizmo:translate:sync', update);
