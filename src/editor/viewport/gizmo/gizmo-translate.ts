import { type EntityObserver } from '@playcanvas/editor-api';
import { type GraphNode, type AppBase, type Entity, type Gizmo } from 'playcanvas';

import { GIZMO_SIZE } from '../../../core/constants.ts';

editor.once('load', () => {
    let gizmo: Gizmo | null = null;

    editor.on('scene:load', () => {
        const camera: Entity = editor.call('camera:current');
        const app: AppBase = editor.call('viewport:app');
        const layer = pc.Gizmo.createLayer(app);
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
            const observers: EntityObserver[] = editor.call('selector:items');
            const nodes: GraphNode[] = observers.map(observer => observer.entity);
            gizmo.attach(nodes);
        } else {
            gizmo.detach();
        }
    };
    editor.on('selector:change', update);
    editor.on('gizmo:type', update);
    editor.on('gizmo:translate:sync', update);
});
