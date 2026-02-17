import { Entity, GraphNode, Picker, Vec2 } from 'playcanvas';

import { FORCE_PICK_TAG } from '@/core/constants';

import type { ViewportTap } from './viewport-tap';

editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) {
        return;
    } // webgl not available

    const picker = new Picker(app, 1, 1);
    const pickedData = {
        node: null,
        picked: null
    };
    const mouseCoords = new Vec2();
    let inViewport = false;
    let picking = true;
    let filter = null;
    let mouseDown = false;
    let gizmoHover = false;

    // Rectangle selection state
    let rectSelecting = false;
    let rectStartX = 0;
    let rectStartY = 0;

    // Traverses up the node hierarchy to find the parent Entity
    const findParentEntity = (node: GraphNode | null): Entity | null => {
        while (node && !(node instanceof Entity) && node.parent) {
            node = node.parent;
        }
        return (node instanceof Entity) ? node : null;
    };

    editor.on('gizmo:transform:hover', (state: boolean) => {
        gizmoHover = state;
    });

    editor.method('viewport:pick:filter', (fn: ((node: GraphNode) => boolean) | null) => {
        if (filter === fn) {
            return;
        }

        filter = fn;
    });

    editor.method('viewport:pick:state', (state: boolean) => {
        picking = state;
    });

    editor.on('viewport:update', () => {
        if (!mouseDown && !inViewport && pickedData.node) {
            pickedData.node = null;
            pickedData.picked = null;
            editor.emit('viewport:pick:hover', null, null);
        }

        if (!inViewport || !picking) {
            return;
        }

        // pick
        editor.call('viewport:pick', mouseCoords.x, mouseCoords.y, (node: Entity | null, picked: { node: GraphNode } | null) => {
            if (gizmoHover && !node?.tags.has(FORCE_PICK_TAG)) {
                node = null;
                picked = null;
            }
            if (pickedData.node !== node || pickedData.picked !== picked) {
                pickedData.node = node;
                pickedData.picked = picked;

                editor.emit('viewport:pick:hover', pickedData.node, pickedData.picked);
            }
        });
    });

    editor.on('viewport:hover', (hover: boolean) => {
        inViewport = hover;
    });

    editor.on('viewport:resize', (width: number, height: number) => {
        picker.resize(width, height);
    });

    editor.method('viewport:pick', (x: number, y: number, fn: (node: Entity | null, picked: { node: GraphNode } | null) => void) => {
        const scene = app.scene;

        // if (filter) {
        //     scene = {
        //         drawCalls: app.scene.drawCalls.filter(filter)
        //     };
        // }

        // prepare picker
        picker.prepare(editor.call('camera:current').camera, scene);

        // pick node
        const picked = picker.getSelection(x, y);

        if (!picked.length || !picked[0]) {
            fn(null, null);
        } else {
            const entity = findParentEntity(picked[0].node);
            if (!entity) {
                return;
            }

            fn(entity, picked[0]);
        }
    });

    // Rectangle pick method - returns array of unique entities in the rectangle
    editor.method('viewport:pick:rect', (x: number, y: number, width: number, height: number, fn: (entities: Entity[]) => void) => {
        const scene = app.scene;

        // prepare picker
        picker.prepare(editor.call('camera:current').camera, scene);

        // pick all mesh instances in the rectangle
        const picked = picker.getSelection(x, y, width, height);

        // Convert mesh instances to unique entities
        const entities: Entity[] = [];
        const seenGuids = new Set<string>();

        for (const meshInstance of picked) {
            if (!meshInstance || !(meshInstance as { node?: GraphNode }).node) {
                continue;
            }

            const entity = findParentEntity((meshInstance as { node: GraphNode }).node);
            if (!entity) {
                continue;
            }

            const guid = entity.getGuid();
            if (!seenGuids.has(guid)) {
                seenGuids.add(guid);
                entities.push(entity);
            }
        }

        fn(entities);
    });

    editor.on('viewport:tap:start', (tap: ViewportTap, evt: MouseEvent) => {
        if (!tap.mouse) {
            return;
        }

        mouseDown = true;

        // Start rect selection on Ctrl + LMB (but not if hovering over gizmo)
        if (tap.button === 0 && (evt.ctrlKey || evt.metaKey) && !gizmoHover) {
            rectSelecting = true;
            rectStartX = tap.x;
            rectStartY = tap.y;
            editor.emit('viewport:pick:rect:start', rectStartX, rectStartY);
        }
    });

    editor.on('viewport:tap:move', (tap: ViewportTap) => {
        // Update rect selection visual
        if (rectSelecting && tap.button === 0) {
            editor.emit('viewport:pick:rect:move', rectStartX, rectStartY, tap.x, tap.y);
        }
    });

    editor.on('viewport:tap:end', (tap: ViewportTap) => {
        if (!tap.mouse) {
            return;
        }

        mouseDown = false;

        // Handle rect selection end
        if (rectSelecting && tap.button === 0) {
            rectSelecting = false;
            editor.emit('viewport:pick:rect:end');

            // Only perform rect pick if there was actual movement (drag)
            if (tap.move) {
                const minX = Math.min(rectStartX, tap.x);
                const minY = Math.min(rectStartY, tap.y);
                const width = Math.abs(tap.x - rectStartX);
                const height = Math.abs(tap.y - rectStartY);

                // Only pick if rectangle has some size
                if (width > 1 && height > 1) {
                    editor.call('viewport:pick:rect', minX, minY, width, height, (entities: Entity[]) => {
                        editor.emit('viewport:pick:rect:nodes', entities);
                    });
                }
            }
        }

        if (!inViewport && pickedData.node) {
            pickedData.node = null;
            pickedData.picked = null;
            editor.emit('viewport:pick:hover', null, null);
        }
    });

    editor.on('viewport:mouse:move', (tap: ViewportTap) => {
        mouseCoords.x = tap.x;
        mouseCoords.y = tap.y;
    });

    editor.on('viewport:tap:click', (tap: ViewportTap) => {
        if (!inViewport || (tap.mouse && tap.button !== 0)) {
            return;
        }

        if (pickedData.node) {
            editor.emit('viewport:pick:node', pickedData.node, pickedData.picked);
        } else {
            editor.call('viewport:pick', tap.x, tap.y, (node: Entity | null, picked: { node: GraphNode } | null) => {
                if (gizmoHover && !node?.tags.has(FORCE_PICK_TAG)) {
                    node = null;
                    picked = null;
                }
                if (pickedData.node !== node || pickedData.picked !== picked) {
                    pickedData.node = node;
                    pickedData.picked = picked;
                }

                if (pickedData.node) {
                    editor.emit('viewport:pick:node', pickedData.node, pickedData.picked);
                } else {
                    editor.emit('viewport:pick:clear');
                }
            });
        }
    });

    editor.on('scene:unload', () => {
        // this is needed to clear the picker layer composition
        // from any mesh instances that are no longer there...
        if (picker?.layer) {
            picker.layer._dirty = true;
        }
    });
});
