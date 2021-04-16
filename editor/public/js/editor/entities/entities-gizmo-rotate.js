editor.once('load', function () {
    'use strict';

    let events = [];
    let items = [];
    const quat = new pc.Quat();
    const quatB = new pc.Quat();
    const vecA = new pc.Vec3();
    let timeoutUpdatePosition, timeoutUpdateRotation;
    let coordSystem = 'world';
    const gizmoPos = new pc.Vec3();
    let gizmoMoving = false;
    let gizmoAxis;

    // get position of gizmo based on selected entities
    const getGizmoPosition = function () {
        if (! items.length)
            return;

        if (items.length === 1) {
            vecA.copy(items[0].obj.entity.getPosition());
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

        const rot = getGizmoRotation();
        if (rot)
            editor.call('gizmo:rotate:rotation', rot[0], rot[1], rot[2]);

        const vec = getGizmoPosition();
        if (vec)
            editor.call('gizmo:rotate:position', vec.x, vec.y, vec.z);

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
                editor.call('gizmo:rotate:position', vec.x, vec.y, vec.z);
        });
    };

    // update gizmo position
    const updateGizmoRotation = function () {
        if (! gizmoMoving)
            updateGizmoPosition();

        if (! items.length || timeoutUpdateRotation)
            return;

        timeoutUpdateRotation = true;

        setTimeout(function () {
            timeoutUpdateRotation = false;

            const vec = getGizmoRotation();
            if (vec)
                editor.call('gizmo:rotate:rotation', vec[0], vec[1], vec[2]);
        });
    };

    // start translating
    const onGizmoStart = function (axis) {
        gizmoAxis = axis;
        gizmoMoving = true;

        gizmoPos.copy(editor.call('gizmo:rotate:position'));

        for (let i = 0; i < items.length; i++) {
            let rot = items[i].obj.entity.getEulerAngles();
            items[i].start[0] = rot.x;
            items[i].start[1] = rot.y;
            items[i].start[2] = rot.z;
            items[i].pos = items[i].start.slice(0);

            const posLocal = items[i].obj.entity.getLocalPosition();

            items[i].startPosLocal[0] = posLocal.x;
            items[i].startPosLocal[1] = posLocal.y;
            items[i].startPosLocal[2] = posLocal.z;

            const pos = items[i].obj.entity.getPosition();

            items[i].offset[0] = pos.x - gizmoPos.x;
            items[i].offset[1] = pos.y - gizmoPos.y;
            items[i].offset[2] = pos.z - gizmoPos.z;

            rot = items[i].obj.get('rotation');
            items[i].startLocal[0] = rot[0];
            items[i].startLocal[1] = rot[1];
            items[i].startLocal[2] = rot[2];

            items[i].startLocalQuat.copy(items[i].obj.entity.getLocalRotation());
            items[i].startQuat.copy(items[i].obj.entity.getRotation());

            items[i].obj.history.enabled = false;
        }
    };

    // end translating
    const onGizmoEnd = function () {
        gizmoMoving = false;
        const records = [];

        for (let i = 0; i < items.length; i++) {
            items[i].obj.history.enabled = true;

            records.push({
                item: items[i].obj,
                valueRotOld: items[i].startLocal.slice(0),
                valueRot: items[i].obj.get('rotation'),
                valuePosOld: items[i].startPosLocal.slice(0),
                valuePos: items[i].obj.get('position')
            });
        }

        editor.call('history:add', {
            name: 'entities.rotate',
            undo: function () {
                for (let i = 0; i < records.length; i++) {
                    const item = records[i].item.latest();
                    if (! item)
                        continue;

                    item.history.enabled = false;
                    item.set('position', records[i].valuePosOld);
                    item.set('rotation', records[i].valueRotOld);
                    item.history.enabled = true;
                }
            },
            redo: function () {
                for (let i = 0; i < records.length; i++) {
                    const item = records[i].item.latest();
                    if (! item)
                        continue;

                    item.history.enabled = false;
                    item.set('position', records[i].valuePos);
                    item.set('rotation', records[i].valueRot);
                    item.history.enabled = true;
                }
            }
        });

        const pos = getGizmoPosition();
        editor.call('gizmo:rotate:position', pos.x, pos.y, pos.z);
    };

    // translated
    const onGizmoOffset = function (angle, point) {
        timeoutUpdateRotation = true;

        for (let i = 0; i < items.length; i++) {
            if (items[i].child)
                continue;

            // skip 2D screens
            if (items[i].obj.get('components.screen.screenSpace'))
                continue;

            vecA.set(0, 0, 0);
            vecA[gizmoAxis] = 1;

            quat.setFromAxisAngle(vecA, angle);

            if (coordSystem === 'local') {
                quatB.copy(items[i].startLocalQuat).mul(quat);
                items[i].obj.entity.setLocalRotation(quatB);
            } else if (items.length === 1) {
                quatB.copy(quat).mul(items[i].startQuat);
                items[i].obj.entity.setRotation(quatB);
            } else {
                vecA.set(items[i].offset[0], items[i].offset[1], items[i].offset[2]);
                quat.transformVector(vecA, vecA);
                quatB.copy(quat).mul(items[i].startQuat);
                items[i].obj.entity.setRotation(quatB);
                items[i].obj.entity.setPosition(vecA.add(gizmoPos));

                const pos = items[i].obj.entity.getLocalPosition();
                items[i].obj.set('position', [pos.x, pos.y, pos.z]);
            }

            const angles = items[i].obj.entity.getLocalEulerAngles();
            items[i].obj.set('rotation', [angles.x, angles.y, angles.z]);
        }

        timeoutUpdateRotation = false;

        if (items.length > 1 || coordSystem === 'local') {
            const rot = getGizmoRotation();
            editor.call('gizmo:rotate:rotation', rot[0], rot[1], rot[2]);
        }
    };

    const onRender = function () {
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
                editor.call('gizmo:translate:position', pos.x, pos.y, pos.z);
            }
        }

        if (items.length > 1 && ! coordSystem === 'world') {
            const rot = getGizmoRotation();
            editor.call('gizmo:rotate:rotation', rot[0], rot[1], rot[2]);
        }
    };

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

        updateGizmoPosition();
    };

    const updateGizmo = function () {
        if (! editor.call('permissions:write'))
            return;

        const objects = editor.call('selector:items');

        for (let i = 0; i < events.length; i++)
            events[i].unbind();
        events = [];
        items = [];

        if (editor.call('selector:type') === 'entity' && editor.call('gizmo:type') === 'rotate') {
            for (let i = 0; i < objects.length; i++) {
                if (! objects[i].entity)
                    continue;

                const pos = objects[i].entity.getPosition();

                items.push({
                    obj: objects[i],
                    startLocalQuat: objects[i].entity.getLocalRotation().clone(),
                    startQuat: objects[i].entity.getRotation().clone(),
                    pos: [pos.x, pos.y, pos.z],
                    offset: [0, 0, 0],
                    start: [0, 0, 0],
                    startLocal: [0, 0, 0],
                    startPosLocal: [0, 0, 0]
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

            // gizmo start
            events.push(editor.on('gizmo:rotate:start', onGizmoStart));
            // gizmo end
            events.push(editor.on('gizmo:rotate:end', onGizmoEnd));
            // gizmo offset
            events.push(editor.on('gizmo:rotate:offset', onGizmoOffset));

            // rotation gizmo
            const rot = getGizmoRotation();
            editor.call('gizmo:rotate:rotation', rot[0], rot[1], rot[2]);
            // position gizmo
            const pos = getGizmoPosition();
            editor.call('gizmo:rotate:position', pos.x, pos.y, pos.z);
            // show gizmo
            editor.call('gizmo:rotate:toggle', true);
            // on render
            events.push(editor.on('gizmo:rotate:render', onRender));
            // render
            editor.call('viewport:render');
        } else {
            // hide gizmo
            editor.call('gizmo:rotate:toggle', false);
            // render
            editor.call('viewport:render');
        }
    };

    editor.on('gizmo:type', updateGizmo);
    editor.on('selector:change', updateGizmo);
});
