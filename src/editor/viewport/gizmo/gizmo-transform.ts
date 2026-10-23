import { Color, Gizmo, RotateGizmo, ScaleGizmo, TransformGizmo, TranslateGizmo } from 'playcanvas';
import type { Entity, Layer } from 'playcanvas';

import { Defer } from '@/common/defer';
import type { EntityObserver } from '@/editor-api';

import { initEngineGizmo, releaseEngineGizmo } from './gizmo-engine';

type GizmoNodeTransform = {
    position: number[];
    rotation: number[];
    scale: number[];
};

type GizmoAxis = Parameters<TransformGizmo['enableShape']>[0];
type GizmoTheme = TransformGizmo['theme'];
type GizmoDragMode = TransformGizmo['dragMode'];

type GizmoPreset = {
    readout: boolean;
    guideThickness: number;
    translate: {
        theme: GizmoTheme;
        dragMode: GizmoDragMode;
        axisArrowThickness: number;
        axisArrowLength: number;
        axisGap: number;
        axisLineLength: number;
        axisLineThickness: number;
        axisPlaneGap: number;
        axisPlaneSize: number;
        axisPlaneOpacity: number;
        axisPlaneOutlineThickness: number;
        axisFadeAngle: number;
        disableShapes: GizmoAxis[];
    };
    rotate: {
        theme: GizmoTheme;
        dragMode: GizmoDragMode;
        faceTubeRadius: number;
        xyzTubeRadius: number;
        angleGuideThickness: number;
        disableShapes: GizmoAxis[];
    };
    scale: {
        theme: GizmoTheme;
        dragMode: GizmoDragMode;
        axisGap: number;
        axisBoxSize: number;
        axisLineLength: number;
        axisLineThickness: number;
        axisCenterSize: number;
        axisPlaneOpacity: number;
        axisPlaneOutlineThickness: number;
        axisFadeAngle: number;
        disableShapes: GizmoAxis[];
    };
};

const GIZMO_AXES = ['x', 'y', 'z', 'xy', 'xz', 'yz', 'xyz', 'f'] as GizmoAxis[];
const GIZMO_ANGLE_MULT = 5;

let translate: TranslateGizmo | null = null;
let rotate: RotateGizmo | null = null;
let scale: ScaleGizmo | null = null;

let write = false;

const cursor = [0, 0];

const loaded = new Defer<void>();

const CLASSIC_THEME: GizmoTheme = {
    shapeBase: {
        x: Color.RED,
        y: Color.GREEN,
        z: Color.BLUE,
        xyz: new Color(1, 1, 1, 0.35),
        f: new Color(1, 1, 1, 0.35)
    },
    shapeHover: {
        x: Color.WHITE,
        y: Color.WHITE,
        z: Color.WHITE,
        xyz: Color.WHITE,
        f: Color.WHITE
    },
    guideBase: {
        x: Color.WHITE,
        y: Color.WHITE,
        z: Color.WHITE
    },
    guideOcclusion: 0.9,
    disabled: new Color(0, 0, 0, 0)
};
// classic pins the 2.24 knobs to how 2.23 drew: opaque planes, no outline, no fade, no readout
const CLASSIC_PRESET: GizmoPreset = {
    readout: false,
    guideThickness: 1,
    translate: {
        theme: CLASSIC_THEME,
        dragMode: 'hide',
        axisArrowThickness: 0.11,
        axisArrowLength: 0.16,
        axisGap: 0.25,
        axisLineLength: 0.27,
        axisLineThickness: 0.005,
        axisPlaneGap: 0,
        axisPlaneSize: 0.21,
        axisPlaneOpacity: 1,
        axisPlaneOutlineThickness: 0,
        axisFadeAngle: 0,
        disableShapes: ['xyz'] // TODO: hide center sphere for now
    },
    rotate: {
        theme: CLASSIC_THEME,
        dragMode: 'selected',
        faceTubeRadius: 0.005,
        xyzTubeRadius: 0.005,
        angleGuideThickness: 0.01,
        disableShapes: ['xyz'] // TODO: hide ball rotation for now
    },
    scale: {
        theme: CLASSIC_THEME,
        dragMode: 'hide',
        axisGap: 0.125,
        axisBoxSize: 0.1,
        axisLineLength: 0.4,
        axisLineThickness: 0.005,
        axisCenterSize: 0.16,
        axisPlaneOpacity: 1,
        axisPlaneOutlineThickness: 0,
        axisFadeAngle: 0,
        disableShapes: ['xy', 'xz', 'yz'] // TODO: disable planes as scaling unintuitive right now
    }
};
const presets = new Map<string, GizmoPreset>();
presets.set('classic', CLASSIC_PRESET);

const cloneTheme = (theme: GizmoTheme): GizmoTheme => ({
    shapeBase: {
        x: theme.shapeBase.x.clone(),
        y: theme.shapeBase.y.clone(),
        z: theme.shapeBase.z.clone(),
        xyz: theme.shapeBase.xyz.clone(),
        f: theme.shapeBase.f.clone()
    },
    shapeHover: {
        x: theme.shapeHover.x.clone(),
        y: theme.shapeHover.y.clone(),
        z: theme.shapeHover.z.clone(),
        xyz: theme.shapeHover.xyz.clone(),
        f: theme.shapeHover.f.clone()
    },
    guideBase: {
        x: theme.guideBase.x.clone(),
        y: theme.guideBase.y.clone(),
        z: theme.guideBase.z.clone()
    },
    guideOcclusion: theme.guideOcclusion,
    disabled: theme.disabled.clone()
});

const selection = (): EntityObserver[] => {
    const type = editor.call('selector:type');
    if (type !== 'entity') {
        return [];
    }
    return editor.call('selector:items');
};

const getTRS = (observer: EntityObserver): GizmoNodeTransform => {
    const position: number[] = observer.entity.getLocalPosition().toArray();
    const rotation: number[] = observer.entity.getLocalEulerAngles().toArray();
    const scale: number[] = observer.entity.getLocalScale().toArray();
    observer.set('position', position);
    observer.set('rotation', rotation);
    observer.set('scale', scale);
    return { position, rotation, scale };
};
const setTRS = (observer: EntityObserver, trs: GizmoNodeTransform, history = true) => {
    const historyEnabled = observer.history.enabled;
    observer.history.enabled = history;
    observer.set('position', trs.position);
    observer.set('rotation', trs.rotation);
    observer.set('scale', trs.scale);
    observer.history.enabled = historyEnabled;
};

const HISTORY_NAMES = new Map<TransformGizmo, string>();

const initGizmo = <T extends TransformGizmo>(gizmo: T, historyName: string) => {
    initEngineGizmo(gizmo);
    HISTORY_NAMES.set(gizmo, historyName);

    // enable orbit rotation for rotate gizmo
    if (gizmo instanceof RotateGizmo) {
        gizmo.rotationMode = 'orbit';
    }

    // enable uniform scaling for scale gizmo
    if (gizmo instanceof ScaleGizmo) {
        gizmo.uniform = true;
    }

    // track cursor position for carrying the gizmo while flying
    gizmo.on(Gizmo.EVENT_POINTERMOVE, (x: number, y: number) => {
        cursor[0] = x;
        cursor[1] = y;
    });

    // track history
    const cache: GizmoNodeTransform[] = [];
    gizmo.on(TransformGizmo.EVENT_TRANSFORMSTART, () => {
        const observers = selection();
        if (!observers.length) {
            return;
        }
        for (let i = 0; i < observers.length; i++) {
            cache[i] = getTRS(observers[i]);
            observers[i].history.enabled = false;
        }

        editor.call('viewport:pick:state', false);

        editor.emit('gizmo:transform:drag', true);
    });
    gizmo.on(TransformGizmo.EVENT_TRANSFORMMOVE, () => {
        const observers = selection();
        if (!observers.length) {
            return;
        }
        for (let i = 0; i < observers.length; i++) {
            const observer = observers[i];
            getTRS(observer);
        }
    });
    gizmo.on(TransformGizmo.EVENT_TRANSFORMEND, () => {
        const observers = selection();
        if (!observers.length) {
            return;
        }

        // record discrete action
        const action: [GizmoNodeTransform, GizmoNodeTransform][] = [];
        for (let i = 0; i < observers.length; i++) {
            action.push([cache[i], getTRS(observers[i])]);
            observers[i].history.enabled = true;
        }
        cache.length = 0;

        // add discrete action to history
        editor.api.globals.history.add({
            name: HISTORY_NAMES.get(gizmo),
            combine: false,
            undo: () => {
                for (let i = 0; i < observers.length; i++) {
                    setTRS(observers[i].latest() as EntityObserver, action[i][0], false);
                }
            },
            redo: () => {
                for (let i = 0; i < observers.length; i++) {
                    setTRS(observers[i].latest() as EntityObserver, action[i][1], false);
                }
            }
        });

        editor.call('viewport:pick:state', true);

        editor.emit('gizmo:transform:drag', false);
    });

    return gizmo;
};

editor.on('scene:load', () => {
    const camera: Entity = editor.call('camera:current');
    const layer: Layer = editor.call('gizmo:layers', 'Axis Gizmo Immediate');

    if (!translate) {
        translate = initGizmo(new TranslateGizmo(camera.camera, layer), 'entities.translate');
    }
    if (!rotate) {
        rotate = initGizmo(new RotateGizmo(camera.camera, layer), 'entities.rotate');
    }
    if (!scale) {
        scale = initGizmo(new ScaleGizmo(camera.camera, layer), 'entities.scale');
    }

    // save default preset if not already set
    if (!presets.has('default')) {
        presets.set('default', {
            readout: translate.readout,
            guideThickness: translate.guideThickness,
            translate: {
                theme: cloneTheme(translate.theme),
                dragMode: translate.dragMode,
                axisArrowThickness: translate.axisArrowThickness,
                axisArrowLength: translate.axisArrowLength,
                axisGap: translate.axisGap,
                axisLineLength: translate.axisLineLength,
                axisLineThickness: translate.axisLineThickness,
                axisPlaneGap: translate.axisPlaneGap,
                axisPlaneSize: translate.axisPlaneSize,
                axisPlaneOpacity: translate.axisPlaneOpacity,
                axisPlaneOutlineThickness: translate.axisPlaneOutlineThickness,
                axisFadeAngle: translate.axisFadeAngle,
                disableShapes: GIZMO_AXES.filter((axis) => !translate.isShapeEnabled(axis))
            },
            rotate: {
                theme: cloneTheme(rotate.theme),
                dragMode: rotate.dragMode,
                faceTubeRadius: rotate.faceTubeRadius,
                xyzTubeRadius: rotate.xyzTubeRadius,
                angleGuideThickness: rotate.angleGuideThickness,
                disableShapes: GIZMO_AXES.filter((axis) => !rotate.isShapeEnabled(axis))
            },
            scale: {
                theme: cloneTheme(scale.theme),
                dragMode: scale.dragMode,
                axisGap: scale.axisGap,
                axisBoxSize: scale.axisBoxSize,
                axisLineLength: scale.axisLineLength,
                axisLineThickness: scale.axisLineThickness,
                axisCenterSize: scale.axisCenterSize,
                axisPlaneOpacity: scale.axisPlaneOpacity,
                axisPlaneOutlineThickness: scale.axisPlaneOutlineThickness,
                axisFadeAngle: scale.axisFadeAngle,
                disableShapes: GIZMO_AXES.filter((axis) => !scale.isShapeEnabled(axis))
            }
        });
    }

    loaded.resolve();
});
editor.on('scene:unload', () => {
    translate.detach();
    rotate.detach();
    scale.detach();
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

editor.on('gizmo:carry', () => {
    if (!translate || !rotate || !scale) {
        return;
    }

    // manual fire pointer move to update gizmo position
    // TODO: add carry functionality to engine
    translate.fire(Gizmo.EVENT_POINTERMOVE, cursor[0], cursor[1], null);
    rotate.fire(Gizmo.EVENT_POINTERMOVE, cursor[0], cursor[1], null);
    scale.fire(Gizmo.EVENT_POINTERMOVE, cursor[0], cursor[1], null);
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
    const observers = selection();
    if (!observers.length) {
        translate.detach();
        rotate.detach();
        scale.detach();
        return;
    }

    // set gizmo based on type
    const gizmoType: string = editor.call('gizmo:type');
    const nodes = observers.map((observer) => observer.entity);
    switch (gizmoType) {
        case 'translate': {
            translate.attach(nodes);
            rotate.detach();
            scale.detach();
            break;
        }
        case 'rotate': {
            translate.detach();
            rotate.attach(nodes);
            scale.detach();
            break;
        }
        case 'scale': {
            translate.detach();
            rotate.detach();
            scale.attach(nodes);
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

const enable = (state = true) => {
    if (!translate || !rotate || !scale) {
        return;
    }
    const enabled = write && state;
    for (const gizmo of [translate, rotate, scale]) {
        gizmo.enabled = enabled;
        if (!enabled) {
            releaseEngineGizmo(gizmo);
        }
    }
};
editor.on('gizmo:transform:visible', enable);

editor.once('settings:user:load', async () => {
    // ensure gizmos loaded
    await loaded.promise;

    const settings = editor.call('settings:user');
    const bind = (path: string, callback: (value: any) => void) => {
        settings.on(`${path}:set`, callback);
        settings.emit(`${path}:set`, settings.get(path));
    };

    // gizmo size
    bind('editor.gizmoSize', (value: number) => {
        translate.size = value;
        rotate.size = value;
        scale.size = value;

        editor.call('viewport:render');
    });

    // gizmo preset
    bind('editor.gizmoPreset', (value: 'classic' | 'default') => {
        const preset = presets.get(value);
        if (!preset) {
            return;
        }

        const setShapes = (gizmo: TransformGizmo, disabled: GizmoAxis[]) => {
            GIZMO_AXES.forEach((axis) => {
                gizmo.enableShape(axis, !disabled.includes(axis));
            });
        };

        for (const gizmo of [translate, rotate, scale]) {
            gizmo.readout = preset.readout;
            gizmo.guideThickness = preset.guideThickness;
        }

        // translate
        translate.setTheme(preset.translate.theme);
        translate.dragMode = preset.translate.dragMode;
        translate.axisArrowThickness = preset.translate.axisArrowThickness;
        translate.axisArrowLength = preset.translate.axisArrowLength;
        translate.axisGap = preset.translate.axisGap;
        translate.axisPlaneGap = preset.translate.axisPlaneGap;
        translate.axisPlaneSize = preset.translate.axisPlaneSize;
        translate.axisLineLength = preset.translate.axisLineLength;
        translate.axisLineThickness = preset.translate.axisLineThickness;
        translate.axisPlaneOpacity = preset.translate.axisPlaneOpacity;
        translate.axisPlaneOutlineThickness = preset.translate.axisPlaneOutlineThickness;
        translate.axisFadeAngle = preset.translate.axisFadeAngle;
        setShapes(translate, preset.translate.disableShapes);

        // rotate
        rotate.setTheme(preset.rotate.theme);
        rotate.dragMode = preset.rotate.dragMode;
        rotate.faceTubeRadius = preset.rotate.faceTubeRadius;
        rotate.xyzTubeRadius = preset.rotate.xyzTubeRadius;
        rotate.angleGuideThickness = preset.rotate.angleGuideThickness;
        setShapes(rotate, preset.rotate.disableShapes);

        // scale
        scale.setTheme(preset.scale.theme);
        scale.dragMode = preset.scale.dragMode;
        scale.axisGap = preset.scale.axisGap;
        scale.axisBoxSize = preset.scale.axisBoxSize;
        scale.axisLineLength = preset.scale.axisLineLength;
        scale.axisLineThickness = preset.scale.axisLineThickness;
        scale.axisCenterSize = preset.scale.axisCenterSize;
        scale.axisPlaneOpacity = preset.scale.axisPlaneOpacity;
        scale.axisPlaneOutlineThickness = preset.scale.axisPlaneOutlineThickness;
        scale.axisFadeAngle = preset.scale.axisFadeAngle;
        setShapes(scale, preset.scale.disableShapes);

        editor.call('viewport:render');
    });
});
