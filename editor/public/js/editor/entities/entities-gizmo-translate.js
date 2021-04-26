editor.once('load', function () {
    'use strict';

    let events = [];
    let items = [];
    const quat = new pc.Quat();
    const vecA = new pc.Vec3();
    const vecB = new pc.Vec3();
    const vecC = new pc.Vec3();
    let timeoutUpdatePosition, timeoutUpdateRotation;
    let coordSystem = 'world';
    let app;
    let gizmoMoving = false;
    let gizmoAxis, gizmoPlane;
    const movingStart = new pc.Vec3();
    const linesColorActive = new pc.Color(1, 1, 1, 1);
    const linesColor = new pc.Color(1, 1, 1, 0.2);
    const linesColorBehind = new pc.Color(1, 1, 1, 0.05);
    let immediateRenderOptions;
    let brightImmediateRenderOptions;

    // get position of gizmo based on selected entities
    const getGizmoPosition = function () {
        if (! items.length)
            return;

        if (items.length === 1) {
            if (items[0].obj.entity) {
                vecA.copy(items[0].obj.entity.getPosition());
            } else {
                return null;
            }
        } else if (coordSystem === 'local') {
            let reference = items[items.length - 1];
            let parent = reference.parent;
            while (parent) {
                reference = parent;
                parent = parent.parent;
            }
            vecA.copy(reference.obj.entity.getPosition());
        } else {
            const selection = editor.call('selection:aabb');
            if (! selection) return;
            vecA.copy(selection.center);
        }

        return vecA;
    };

    const getGizmoRotation = function () {
        if (! items.length)
            return;

        if (coordSystem === 'local') {
            let reference = items[items.length - 1];
            let parent = reference.parent;
            while (parent) {
                reference = parent;
                parent = parent.parent;
            }
            const rot = reference.obj.entity.getEulerAngles();
            return [rot.x, rot.y, rot.z];
        }
        return [0, 0, 0];

    };

    editor.on('gizmo:coordSystem', function (system) {
        if (coordSystem === system)
            return;

        coordSystem = system;

        const pos = getGizmoPosition();
        if (pos)
            editor.call('gizmo:translate:position', pos.x, pos.y, pos.z);

        const rot = getGizmoRotation();
        if (rot)
            editor.call('gizmo:translate:rotation', rot[0], rot[1], rot[2]);

        editor.call('viewport:render');
    });

    // update gizmo position
    const updateGizmoPosition = function () {
        if (! items.length || timeoutUpdatePosition || gizmoMoving)
            return;

        timeoutUpdatePosition = true;

        setTimeout(function () {
            timeoutUpdatePosition = false;

            const vec = getGizmoPosition();
            if (vec)
                editor.call('gizmo:translate:position', vec.x, vec.y, vec.z);
        });
    };

    // update gizmo position
    const updateGizmoRotation = function () {
        if (! items.length || timeoutUpdateRotation)
            return;

        timeoutUpdateRotation = true;

        setTimeout(function () {
            timeoutUpdateRotation = false;

            const vec = getGizmoRotation();
            if (vec)
                editor.call('gizmo:translate:rotation', vec[0], vec[1], vec[2]);
        });
    };

    // start translating
    const onGizmoStart = function (axis, plane) {
        gizmoAxis = axis;
        gizmoPlane = plane;
        gizmoMoving = true;

        movingStart.copy(getGizmoPosition());

        for (let i = 0; i < items.length; i++) {
            let pos = items[i].obj.entity.getPosition();
            items[i].start[0] = pos.x;
            items[i].start[1] = pos.y;
            items[i].start[2] = pos.z;
            items[i].pos = items[i].start.slice(0);

            pos = items[i].obj.get('position');
            items[i].startLocal[0] = pos[0];
            items[i].startLocal[1] = pos[1];
            items[i].startLocal[2] = pos[2];

            items[i].obj.history.enabled = false;
        }
    };

    // end translating
    const onGizmoEnd = function () {
        gizmoMoving = false;
        const records = [];

        for (let i = 0; i < items.length; i++) {
            items[i].obj.history.enabled = true;

            const data = {
                item: items[i].obj,
                valueOld: items[i].startLocal.slice(0),
                value: items[i].obj.get('position')
            };

            records.push(data);
        }

        editor.call('history:add', {
            name: 'entities.translate',
            undo: function () {
                for (let i = 0; i < records.length; i++) {
                    const item = records[i].item.latest();
                    if (! item) continue;

                    item.history.enabled = false;
                    item.set('position', records[i].valueOld);
                    item.history.enabled = true;
                }
            },
            redo: function () {
                for (let i = 0; i < records.length; i++) {
                    const item = records[i].item.latest();
                    if (! item) continue;

                    item.history.enabled = false;
                    item.set('position', records[i].value);
                    item.history.enabled = true;
                }
            }
        });
    };

    // translated
    const onGizmoOffset = function (x, y, z) {
        timeoutUpdateRotation = true;

        for (let i = 0; i < items.length; i++) {
            if (items[i].child)
                continue;

            const entity = items[i].obj.entity;

            if (coordSystem === 'local') {
                vecA.set(x, y, z);

                // scale by inverse world scale to ensure correct movement
                entity.parent.getWorldTransform().getScale(vecB);
                vecB.x = 1 / vecB.x;
                vecB.y = 1 / vecB.y;
                vecB.z = 1 / vecB.z;

                quat.copy(entity.getLocalRotation()).transformVector(vecA, vecA);
                vecA.mul(vecB);
                entity.setLocalPosition(items[i].startLocal[0] + vecA.x, items[i].startLocal[1] + vecA.y, items[i].startLocal[2] + vecA.z);
            } else {
                entity.setPosition(items[i].start[0] + x, items[i].start[1] + y, items[i].start[2] + z);
            }

            // if (entity.collision) {
            //     app.systems.collision.onTransformChanged(entity.collision, entity.getPosition(), entity.getRotation(), entity.getLocalScale());
            // }

            const pos = entity.getLocalPosition();
            items[i].obj.set('position', [pos.x, pos.y, pos.z]);
        }

        timeoutUpdateRotation = false;

        const pos = getGizmoPosition();
        editor.call('gizmo:translate:position', pos.x, pos.y, pos.z);
    };

    const onRender = function () {
        if (! app) return; // webgl not available

        if (! gizmoMoving && items.length) {
            let dirty = false;
            for (let i = 0; i < items.length; i++) {
                if (! items[i].obj.entity)
                    continue;

                const pos = items[i].obj.entity.getPosition();
                if (pos.x !== items[i].pos[0] || pos.y !== items[i].pos[1] || pos.z !== items[i].pos[2]) {
                    dirty = true;
                    items[i].pos[0] = pos.x;
                    items[i].pos[1] = pos.y;
                    items[i].pos[2] = pos.z;
                }
            }

            if (dirty) {
                const pos = getGizmoPosition();
                if (pos) {
                    editor.call('gizmo:translate:position', pos.x, pos.y, pos.z);
                }
            }
        }

        if (gizmoMoving && items.length) {
            const camera = editor.call('camera:current');
            let pos;

            const len = coordSystem === 'local' ? items.length : 1;
            for (let i = 0; i < len; i++) {
                if (items[i].child)
                    continue;

                if (coordSystem === 'local') {
                    pos = items[i].obj.entity.getPosition();
                    quat.copy(items[i].obj.entity.getRotation());
                } else {
                    pos = editor.call('gizmo:translate:position');
                    quat.setFromEulerAngles(0, 0, 0);
                }

                // x
                vecB.set(camera.camera.farClip * 2, 0, 0);
                quat.transformVector(vecB, vecB).add(pos);
                vecC.set(camera.camera.farClip * -2, 0, 0);
                quat.transformVector(vecC, vecC).add(pos);
                app.renderLine(vecB, vecC, linesColorBehind, immediateRenderOptions);
                if ((gizmoAxis === 'x' && ! gizmoPlane) || (gizmoPlane && (gizmoAxis === 'y' || gizmoAxis === 'z'))) {
                    app.renderLine(vecB, vecC, linesColorActive, brightImmediateRenderOptions);
                } else {
                    app.renderLine(vecB, vecC, linesColor, brightImmediateRenderOptions);
                }

                // y
                vecB.set(0, camera.camera.farClip * 2, 0);
                quat.transformVector(vecB, vecB).add(pos);
                vecC.set(0, camera.camera.farClip * -2, 0);
                quat.transformVector(vecC, vecC).add(pos);
                app.renderLine(vecB, vecC, linesColorBehind, immediateRenderOptions);
                if ((gizmoAxis === 'y' && ! gizmoPlane) || (gizmoPlane && (gizmoAxis === 'x' || gizmoAxis === 'z'))) {
                    app.renderLine(vecB, vecC, linesColorActive, brightImmediateRenderOptions);
                } else {
                    app.renderLine(vecB, vecC, linesColor, brightImmediateRenderOptions);
                }

                // z
                vecB.set(0, 0, camera.camera.farClip * 2);
                quat.transformVector(vecB, vecB).add(pos);
                vecC.set(0, 0, camera.camera.farClip * -2);
                quat.transformVector(vecC, vecC).add(pos);
                app.renderLine(vecB, vecC, linesColorBehind, immediateRenderOptions);
                if ((gizmoAxis === 'z' && ! gizmoPlane) || (gizmoPlane && (gizmoAxis === 'x' || gizmoAxis === 'y'))) {
                    app.renderLine(vecB, vecC, linesColorActive, brightImmediateRenderOptions);
                } else {
                    app.renderLine(vecB, vecC, linesColor, brightImmediateRenderOptions);
                }
            }
        }
    };

    editor.once('viewport:load', function () {
        app = editor.call('viewport:app');

        immediateRenderOptions = {
            layer: editor.call("gizmo:layers", 'Axis Gizmo Immediate')
        };

        brightImmediateRenderOptions = {
            layer: editor.call("gizmo:layers", 'Bright Gizmo')
        };
    });

    const updateChildRelation = function () {
        const itemIds = { };
        for (let i = 0; i < items.length; i++) {
            itemIds[items[i].obj.get('resource_id')] = items[i];
        }

        for (let i = 0; i < items.length; i++) {
            let child = false;
            let parent = items[i].obj.entity._parent;
            let id = '';
            while (! child && parent) {
                id = parent.getGuid();
                if (itemIds[id]) {
                    parent = itemIds[id];
                    child = true;
                    break;
                }
                parent = parent._parent;
            }
            items[i].child = child;
            items[i].parent = child ? parent : null;
        }
    };

    const updateGizmo = function () {
        if (! editor.call('permissions:write'))
            return;

        const objects = editor.call('selector:items');

        for (let i = 0; i < events.length; i++)
            events[i].unbind();
        events = [];
        items = [];

        if (editor.call('selector:type') === 'entity' && editor.call('gizmo:type') === 'translate') {
            for (let i = 0; i < objects.length; i++) {
                if (! objects[i].entity)
                    continue;

                const pos = objects[i].entity.getPosition();

                items.push({
                    obj: objects[i],
                    pos: [pos.x, pos.y, pos.z],
                    start: [0, 0, 0],
                    startLocal: [0, 0, 0]
                });

                // position
                events.push(objects[i].on('position:set', updateGizmoPosition));
                // position.*
                for (let n = 0; n < 3; n++)
                    events.push(objects[i].on('position.' + n + ':set', updateGizmoPosition));

                // rotation
                events.push(objects[i].on('rotation:set', updateGizmoRotation));
                // rotation.*
                for (let n = 0; n < 3; n++)
                    events.push(objects[i].on('rotation.' + n + ':set', updateGizmoRotation));

                events.push(objects[i].on('parent:set', updateChildRelation));
            }

            if (! items.length)
                return;

            updateChildRelation();

            const rot = getGizmoRotation();
            editor.call('gizmo:translate:rotation', rot[0], rot[1], rot[2]);

            // gizmo start
            events.push(editor.on('gizmo:translate:start', onGizmoStart));
            // gizmo end
            events.push(editor.on('gizmo:translate:end', onGizmoEnd));
            // gizmo offset
            events.push(editor.on('gizmo:translate:offset', onGizmoOffset));

            // position gizmo
            const pos = getGizmoPosition();
            editor.call('gizmo:translate:position', pos.x, pos.y, pos.z);
            // show gizmo
            editor.call('gizmo:translate:toggle', true);
            // on render
            events.push(editor.on('gizmo:translate:render', onRender));
            // render
            editor.call('viewport:render');
        } else {
            // hide gizmo
            editor.call('gizmo:translate:toggle', false);
            // render
            editor.call('viewport:render');
        }
    };

    editor.on('gizmo:type', updateGizmo);
    editor.on('selector:change', updateGizmo);
    editor.on('gizmo:translate:sync', updateGizmo);
});
