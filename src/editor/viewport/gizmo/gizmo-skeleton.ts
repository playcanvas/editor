import { Color, Entity } from 'playcanvas';

import type { EntityObserver } from '@/editor-api';

editor.once('load', () => {
    let app = null;
    let entities = [];
    let visible = true;

    const color = new Color(1, 1, 1);
    const colorBehind = new Color(1, 1, 1, 0.5);

    const renderBones = function (entities: Entity[]) {
        const immediateLayer = editor.call('gizmo:layers', 'Axis Gizmo Immediate');
        const brightLayer = editor.call('gizmo:layers', 'Bright Gizmo');

        const renderBone = function (parent: import('playcanvas').GraphNode, child: import('playcanvas').GraphNode) {
            const start = parent.getPosition();
            const end = child.getPosition();
            app.drawLine(start, end, colorBehind, true, immediateLayer);
            app.drawLine(start, end, color, true, brightLayer);
        };

        const renderBoneHierarchy = function (node: import('playcanvas').GraphNode) {
            // render node join
            if (!node.enabled) {
                return;
            }

            // render child links
            for (const child of node.children) {
                renderBone(node, child);
                renderBoneHierarchy(child);
            }
        };

        for (let i = 0; i < entities.length; ++i) {
            const entity = entities[i];
            if (entity) {
                const model = entity.model;
                if (model) {
                    if (model.model) {
                        renderBoneHierarchy(model.model.graph);
                    }
                }

                // render skeleton if entity with render component that has rootBone set is selected
                const render = entity.render;
                if (render && render._rootBone && render._rootBone.entity) {
                    renderBoneHierarchy(render._rootBone.entity);
                }
            }
        }
    };

    editor.method('viewport:show:bones', () => {
        return visible;
    });

    editor.on('selector:change', (type: string, items: EntityObserver[]) => {
        if (type === 'entity') {
            entities = items.map((item: EntityObserver) => item.entity);
        } else {
            entities = [];
        }
    });

    editor.once('viewport:load', (application: import('playcanvas').AppBase) => {
        app = application;

        // hook up changes to editor.showSkeleton
        const settings = editor.call('settings:user');
        settings.on('editor.showSkeleton:set', (enabled: boolean) => {
            visible = enabled;
        });
        visible = settings.get('editor.showSkeleton');

        editor.on('viewport:postUpdate', () => {
            if (app && visible && entities.length) {
                renderBones(entities);
            }
        });
    });
});
