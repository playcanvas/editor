editor.once('load', () => {
    let events = [];
    let items = [];
    const quat = new pc.Quat();
    const vecA = new pc.Vec3();
    const vecB = new pc.Vec3();
    const vecC = new pc.Vec3();
    let timeoutUpdatePosition, timeoutUpdateRotation;
    let app;
    let gizmoMoving = false;
    let gizmoAxis, gizmoMiddle;
    const linesColorActive = new pc.Color(1, 1, 1, 1);
    const linesColorBehind = new pc.Color(1, 1, 1, 0.05);

    // get position of gizmo based on selected entities
    const getGizmoPosition = function () {
        if (!items.length) {
            return;
        }

        let reference = items[items.length - 1];
        let parent = reference.parent;
        while (parent) {
            reference = parent;
            parent = parent.parent;
        }
        vecA.copy(reference.obj.entity.getPosition());

        return vecA;
    };

    const getGizmoRotation = function () {
        if (!items.length) {
            return;
        }

        let reference = items[items.length - 1];
        let parent = reference.parent;
        while (parent) {
            reference = parent;
            parent = parent.parent;
        }
        const rot = reference.obj.entity.getEulerAngles();

        return [rot.x, rot.y, rot.z];
    };

    // update gizmo position
    const updateGizmoPosition = function () {
        if (!items.length || timeoutUpdatePosition) {
            return;
        }

        timeoutUpdatePosition = true;

        setTimeout(() => {
            timeoutUpdatePosition = false;

            const vec = getGizmoPosition();
            if (vec) {
                editor.call('gizmo:scale:position', vec.x, vec.y, vec.z);
            }
        });
    };

    // update gizmo position
    const updateGizmoRotation = function () {
        if (!items.length || timeoutUpdateRotation) {
            return;
        }

        timeoutUpdateRotation = true;

        setTimeout(() => {
            timeoutUpdateRotation = false;

            const vec = getGizmoRotation();
            if (vec) {
                editor.call('gizmo:scale:rotation', vec[0], vec[1], vec[2]);
            }
        });
    };

    // start translating
    const onGizmoStart = function (axis, middle) {
        gizmoAxis = axis;
        gizmoMiddle = middle;
        gizmoMoving = true;

        for (let i = 0; i < items.length; i++) {
            const scale = items[i].obj.get('scale');
            items[i].start[0] = scale[0];
            items[i].start[1] = scale[1];
            items[i].start[2] = scale[2];
            items[i].pos = items[i].start.slice(0);
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
                valueOld: items[i].start.slice(0),
                value: items[i].obj.get('scale')
            });
        }

        editor.api.globals.history.add({
            name: 'entities.scale',
            combine: false,
            undo: function () {
                for (let i = 0; i < records.length; i++) {
                    const item = records[i].item.latest();
                    if (!item) {
                        continue;
                    }

                    item.history.enabled = false;
                    item.set('scale', records[i].valueOld);
                    item.history.enabled = true;
                }
            },
            redo: function () {
                for (let i = 0; i < records.length; i++) {
                    const item = records[i].item.latest();
                    if (!item) {
                        continue;
                    }

                    item.history.enabled = false;
                    item.set('scale', records[i].value);
                    item.history.enabled = true;
                }
            }
        });
    };

    // scaled
    const onGizmoOffset = function (x, y, z) {
        for (let i = 0; i < items.length; i++) {
            if (items[i].child) {
                continue;
            }

            // skip 2D screens
            if (items[i].obj.get('components.screen.screenSpace')) {
                continue;
            }

            items[i].obj.set('scale', [items[i].start[0] * x, items[i].start[1] * y, items[i].start[2] * z]);
        }
    };

    const onRender = function () {
        if (!app) {
            return;
        } // webgl not available

        if (gizmoMoving) {
            const camera = editor.call('camera:current');
            const immediateLayer = editor.call('gizmo:layers', 'Axis Gizmo Immediate');
            const brightLayer = editor.call('gizmo:layers', 'Bright Gizmo');

            for (let i = 0; i < items.length; i++) {
                if (items[i].child) {
                    continue;
                }

                vecA.copy(items[i].obj.entity.getPosition());
                quat.copy(items[i].obj.entity.getRotation());

                if (gizmoAxis === 'x' || gizmoMiddle) {
                    vecB.set(camera.camera.farClip * 2, 0, 0);
                    quat.transformVector(vecB, vecB).add(vecA);
                    vecC.set(camera.camera.farClip * -2, 0, 0);
                    quat.transformVector(vecC, vecC).add(vecA);
                    app.drawLine(vecB, vecC, linesColorBehind, true, immediateLayer);
                    app.drawLine(vecB, vecC, linesColorActive, true, brightLayer);
                }
                if (gizmoAxis === 'y' || gizmoMiddle) {
                    vecB.set(0, camera.camera.farClip * 2, 0);
                    quat.transformVector(vecB, vecB).add(vecA);
                    vecC.set(0, camera.camera.farClip * -2, 0);
                    quat.transformVector(vecC, vecC).add(vecA);
                    app.drawLine(vecB, vecC, linesColorBehind, true, immediateLayer);
                    app.drawLine(vecB, vecC, linesColorActive, true, brightLayer);
                }
                if (gizmoAxis === 'z' || gizmoMiddle) {
                    vecB.set(0, 0, camera.camera.farClip * 2);
                    quat.transformVector(vecB, vecB).add(vecA);
                    vecC.set(0, 0, camera.camera.farClip * -2);
                    quat.transformVector(vecC, vecC).add(vecA);
                    app.drawLine(vecB, vecC, linesColorBehind, true, immediateLayer);
                    app.drawLine(vecB, vecC, linesColorActive, true, brightLayer);
                }
            }
        } else {
            let dirty = false;
            for (let i = 0; i < items.length; i++) {
                if (!items[i].obj.entity) {
                    continue;
                }

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
                editor.call('gizmo:scale:position', pos.x, pos.y, pos.z);
            }
        }
    };

    editor.once('viewport:load', (application) => {
        app = application;
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
            while (!child && parent) {
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
        if (!editor.call('permissions:write')) {
            return;
        }

        const objects = editor.call('selector:items');

        for (let i = 0; i < events.length; i++) {
            events[i].unbind();
        }
        events = [];
        items = [];

        if (editor.call('selector:type') === 'entity' && editor.call('gizmo:type') === 'scale') {
            for (let i = 0; i < objects.length; i++) {
                if (!objects[i].entity) {
                    continue;
                }

                const pos = objects[i].entity.getPosition();

                items.push({
                    obj: objects[i],
                    pos: [pos.x, pos.y, pos.z],
                    start: [1, 1, 1]
                });

                // position
                events.push(objects[i].on('position:set', updateGizmoPosition));
                // position.*
                for (let n = 0; n < 3; n++) {
                    events.push(objects[i].on(`position.${n}:set`, updateGizmoPosition));
                }

                // rotation
                events.push(objects[i].on('rotation:set', updateGizmoRotation));
                // rotation.*
                for (let n = 0; n < 3; n++) {
                    events.push(objects[i].on(`rotation.${n}:set`, updateGizmoRotation));
                }

                events.push(objects[i].on('parent:set', updateChildRelation));
            }

            if (!items.length) {
                return;
            }

            updateChildRelation();

            const rot = getGizmoRotation();
            editor.call('gizmo:scale:rotation', rot[0], rot[1], rot[2]);

            // gizmo start
            events.push(editor.on('gizmo:scale:start', onGizmoStart));
            // gizmo end
            events.push(editor.on('gizmo:scale:end', onGizmoEnd));
            // gizmo offset
            events.push(editor.on('gizmo:scale:offset', onGizmoOffset));

            // position gizmo
            const pos = getGizmoPosition();
            editor.call('gizmo:scale:position', pos.x, pos.y, pos.z);
            // show gizmo
            editor.call('gizmo:scale:toggle', true);
            // on render
            events.push(editor.on('gizmo:scale:render', onRender));
            // render
            editor.call('viewport:render');
        } else {
            // hide gizmo
            editor.call('gizmo:scale:toggle', false);
            // render
            editor.call('viewport:render');
        }
    };

    editor.on('gizmo:type', updateGizmo);
    editor.on('selector:change', updateGizmo);
});
