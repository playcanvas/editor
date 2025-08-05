import { type Entity, type Gizmo, type Layer } from 'playcanvas';

import { GIZMO_SIZE } from '../../../core/constants.ts';

editor.once('load', () => {
    let gizmo: Gizmo | null = null;

    editor.on('scene:load', () => {
        const camera: Entity = editor.call('camera:current');
        const layer: Layer = editor.call('gizmo:layers', 'Axis Gizmo Immediate');
        gizmo = new pc.TranslateGizmo(camera.camera, layer);
        gizmo.size = GIZMO_SIZE;

        // call viewport render while moving gizmo
        gizmo.on(pc.Gizmo.EVENT_POINTERMOVE, () => {
            editor.call('viewport:render');
        });

        // manually call prerender and update methods
        editor.on('viewport:preRender', gizmo.prerender.bind(gizmo));
        editor.on('viewport:update', gizmo.update.bind(gizmo));
    });

    editor.on('gizmo:coordSystem', (system) => {
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
});
