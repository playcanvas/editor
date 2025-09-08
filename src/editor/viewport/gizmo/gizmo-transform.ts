import { type EntityObserver } from '@playcanvas/editor-api';
import {
    type Entity,
    type MeshInstance,
    type TransformGizmo,
    type TranslateGizmo,
    type RotateGizmo,
    type ScaleGizmo,
    type Layer
} from 'playcanvas';

const GIZMO_SIZE = 1.2;
const GIZMO_ANGLE_MULT = 5;

let translate: TranslateGizmo | null = null;
let rotate: RotateGizmo | null = null;
let scale: ScaleGizmo | null = null;

let write: boolean = false;

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
const setTRS = (item: EntityObserver, trs: GizmoNodeTransform, history: boolean = true) => {
    const historyEnabled = item.history.enabled;
    item.history.enabled = history;
    item.set('position', trs.position);
    item.set('rotation', trs.rotation);
    item.set('scale', trs.scale);
    item.history.enabled = historyEnabled;
};

const initGizmo = <T extends TransformGizmo>(gizmo: T) => {
    // general settings
    gizmo.size = GIZMO_SIZE;
    gizmo.setTheme({
        shapeBase: {
            x: pc.Color.RED,
            y: pc.Color.GREEN,
            z: pc.Color.BLUE,
            xyz: pc.Color.WHITE,
            f: pc.Color.YELLOW
        },
        shapeHover: {
            x: pc.Color.WHITE,
            y: pc.Color.WHITE,
            z: pc.Color.WHITE,
            xyz: pc.Color.WHITE,
            f: pc.Color.WHITE
        },
        guideBase: {
            x: pc.Color.WHITE,
            y: pc.Color.WHITE,
            z: pc.Color.WHITE,
            f: pc.Color.WHITE
        },
        guideOcclusion: 0.9,
        disabled: new pc.Color(0, 0, 0, 0)
    });

    // gizmo specific settings
    if (gizmo instanceof pc.TranslateGizmo) {
        gizmo.flipAxes = false;
        gizmo.dragMode = 'hide';
        gizmo.axisLineThickness = 0.01;
        gizmo.axisPlaneGap = 0;

        gizmo.enableShape('xyz', false); // TODO: hide center sphere for now
    }
    if (gizmo instanceof pc.RotateGizmo) {
        gizmo.dragMode = 'selected';
        gizmo.orbitRotation = true;
        gizmo.faceTubeRadius = 0.0075;
        gizmo.xyzTubeRadius = 0.0075;
        gizmo.angleGuideThickness = 0.015;

        gizmo.enableShape('xyz', false); // TODO: hide ball rotation for now
    }
    if (gizmo instanceof pc.ScaleGizmo) {
        gizmo.flipAxes = false;
        gizmo.dragMode = 'hide';
        gizmo.axisLineThickness = 0.01;

        gizmo.enableShape('xy', false); // TODO: disable planes as scaling unintuitive right now
        gizmo.enableShape('xz', false); // TODO: disable planes as scaling unintuitive right now
        gizmo.enableShape('yz', false); // TODO: disable planes as scaling unintuitive right now
    }

    // call viewport render while moving gizmo
    gizmo.on(pc.Gizmo.EVENT_POINTERMOVE, (_x, _y, meshInstance: MeshInstance) => {
        editor.call('viewport:render');
        editor.emit('viewport:gizmo:hover', !!meshInstance);
    });

    // track history
    const cache: GizmoNodeTransform[] = [];
    gizmo.on(pc.TransformGizmo.EVENT_TRANSFORMSTART, () => {
        const items = selection();
        if (!items.length) {
            return;
        }
        for (let i = 0; i < items.length; i++) {
            cache[i] = getTRS(items[i]);
            items[i].history.enabled = false;
        }

        editor.call('camera:toggle', false);
        editor.call('viewport:pick:state', false);
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

        // record discrete action
        const action: [GizmoNodeTransform, GizmoNodeTransform][] = [];
        for (let i = 0; i < items.length; i++) {
            action.push([cache[i], getTRS(items[i])]);
            items[i].history.enabled = true;
        }
        cache.length = 0;

        // add discrete action to history
        editor.api.globals.history.add({
            name: 'entities.translate',
            combine: false,
            undo: () => {
                for (let i = 0; i < items.length; i++) {
                    setTRS(items[i].latest() as EntityObserver, action[i][0], false);
                }
            },
            redo: () => {
                for (let i = 0; i < items.length; i++) {
                    setTRS(items[i].latest() as EntityObserver, action[i][1], false);
                }
            }
        });

        editor.call('camera:toggle', true);
        editor.call('viewport:pick:state', true);
    });

    // manually call prerender and update methods
    editor.on('viewport:preRender', gizmo.prerender.bind(gizmo));
    editor.on('viewport:update', gizmo.update.bind(gizmo));

    return gizmo;
};

editor.on('scene:load', () => {
    const camera: Entity = editor.call('camera:current');
    const layer: Layer = editor.call('gizmo:layers', 'Axis Gizmo Immediate');

    translate = initGizmo(new pc.TranslateGizmo(camera.camera, layer));
    rotate = initGizmo(new pc.RotateGizmo(camera.camera, layer));
    scale = initGizmo(new pc.ScaleGizmo(camera.camera, layer));
});

editor.on('permissions:writeState', (state) => {
    write = state;
});

editor.on('camera:change', (camera: Entity) => {
    if (!translate || !rotate || !scale) {
        return;
    }
    translate.camera = camera.camera;
    rotate.camera = camera.camera;
    scale.camera = camera.camera;
});

editor.on('gizmo:coordSystem', (space: 'local' | 'world') => {
    if (!translate || !rotate || !scale) {
        return;
    }
    translate.coordSpace = space;
    rotate.coordSpace = space;
    scale.coordSpace = space;
});

editor.on('gizmo:snap', (state: boolean, increment: number) => {
    translate.snap = state;
    translate.snapIncrement = increment;
    rotate.snap = state;
    rotate.snapIncrement = increment * GIZMO_ANGLE_MULT;
    scale.snap = state;
    scale.snapIncrement = increment;
});

const reflow = () => {
    if (!translate || !rotate || !scale) {
        return;
    }

    // skip if no write permissions
    if (!write) {
        return;
    }

    // skip if not selecting entities (can be assets)
    const selectorType: string = editor.call('selector:type');
    if (selectorType !== 'entity') {
        translate.detach();
        rotate.detach();
        scale.detach();
        return;
    }

    const gizmoType: string = editor.call('gizmo:type');
    const items = editor.call('selector:items').map(item => item.entity);
    switch (gizmoType) {
        case 'translate': {
            translate.attach(items);
            rotate.detach();
            scale.detach();
            break;
        }
        case 'rotate': {
            translate.detach();
            rotate.attach(items);
            scale.detach();
            break;
        }
        case 'scale': {
            translate.detach();
            rotate.detach();
            scale.attach(items);
            break;
        }
        default: {
            translate.detach();
            rotate.detach();
            scale.detach();
            break;
        }
    }
};
editor.on('selector:change', reflow);
editor.on('gizmo:type', reflow);
editor.on('gizmo:translate:sync', reflow);
editor.on('gizmo:rotate:sync', reflow);
editor.on('gizmo:scale:sync', reflow);

const enable = (state: boolean = true) => {
    if (!translate || !rotate || !scale) {
        return;
    }
    translate.enabled = state;
    rotate.enabled = state;
    scale.enabled = state;
};
editor.on('gizmo:transform:visible', enable);
