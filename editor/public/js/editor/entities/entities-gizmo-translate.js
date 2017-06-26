editor.once('load', function() {
    'use strict';

    var events = [ ];
    var items = [ ];
    var quat = new pc.Quat();
    var vecA = new pc.Vec3();
    var vecB = new pc.Vec3();
    var vecC = new pc.Vec3();
    var startPosition = new pc.Vec3();
    var timeoutUpdatePosition, timeoutUpdateRotation;
    var coordSystem = 'world';
    var app;
    var gizmoMoving = false;
    var gizmoAxis, gizmoPlane;
    var movingStart = new pc.Vec3();
    var linesColorActive = new pc.Color(1, 1, 1, 1);
    var linesColor = new pc.Color(1, 1, 1, .2);
    var linesColorBehind = new pc.Color(1, 1, 1, .05);

    editor.on('gizmo:coordSystem', function(system) {
        if (coordSystem === system)
            return;

        coordSystem = system;

        var pos = getGizmoPosition();
        if (pos)
            editor.call('gizmo:translate:position', pos.x, pos.y, pos.z);

        var rot = getGizmoRotation();
        if (rot)
            editor.call('gizmo:translate:rotation', rot[0], rot[1], rot[2]);

        editor.call('viewport:render');
    });

    // get position of gizmo based on selected entities
    var getGizmoPosition = function() {
        if (! items.length)
            return;

        if (items.length === 1) {
            vecA.copy(items[0].obj.entity.getPosition());
        } else if (coordSystem === 'local') {
            var reference = items[items.length - 1];
            var parent = reference.parent;
            while(parent) {
                reference = parent;
                parent = parent.parent;
            }
            vecA.copy(reference.obj.entity.getPosition());
        } else {
            var selection = editor.call('selection:aabb');
            if (! selection) return;
            vecA.copy(selection.center);
        }

        return vecA;
    };

    var getGizmoRotation = function() {
        if (! items.length)
            return;

        if (coordSystem === 'local') {
            var reference = items[items.length - 1];
            var parent = reference.parent;
            while(parent) {
                reference = parent;
                parent = parent.parent;
            }
            var rot = reference.obj.entity.getEulerAngles()
            return [ rot.x, rot.y, rot.z ];
        } else {
            return [ 0, 0, 0 ];
        }
    };

    // update gizmo position
    var updateGizmoPosition = function() {
        if (! items.length || timeoutUpdatePosition || gizmoMoving)
            return;

        timeoutUpdatePosition = true;

        setTimeout(function() {
            timeoutUpdatePosition = false;

            var vec = getGizmoPosition();
            if (vec)
                editor.call('gizmo:translate:position', vec.x, vec.y, vec.z);
        });
    };

    // update gizmo position
    var updateGizmoRotation = function() {
        if (! items.length || timeoutUpdateRotation)
            return;

        timeoutUpdateRotation = true;

        setTimeout(function() {
            timeoutUpdateRotation = false;

            var vec = getGizmoRotation();
            if (vec)
                editor.call('gizmo:translate:rotation', vec[0], vec[1], vec[2]);
        });
    };

    // start translating
    var onGizmoStart = function(axis, plane) {
        gizmoAxis = axis;
        gizmoPlane = plane;
        gizmoMoving = true;

        movingStart.copy(getGizmoPosition());

        for(var i = 0; i < items.length; i++) {
            var pos = items[i].obj.entity.getPosition();
            items[i].start[0] = pos.x;
            items[i].start[1] = pos.y;
            items[i].start[2] = pos.z;
            items[i].pos = items[i].start.slice(0);

            pos = items[i].obj.get('position');
            items[i].startLocal[0] = pos[0];
            items[i].startLocal[1] = pos[1];
            items[i].startLocal[2] = pos[2];

            if (items[i].obj.entity.element) {
                var margin = items[i].obj.entity.element.margin;
                items[i].startMargin[0] = margin.x;
                items[i].startMargin[1] = margin.y;
                items[i].startMargin[2] = margin.z;
                items[i].startMargin[3] = margin.w;
            }

            items[i].obj.history.enabled = false;
        }
    };

    // end translating
    var onGizmoEnd = function() {
        gizmoMoving = false;
        var records = [ ];

        for(var i = 0; i < items.length; i++) {
            items[i].obj.history.enabled = true;

            var data = {
                get: items[i].obj.history._getItemFn,
                valueOld: items[i].startLocal.slice(0),
                value: items[i].obj.get('position')
            };

            if (items[i].obj.entity.element) {
                data.marginOld = items[i].startMargin.slice(0);
                data.margin = items[i].obj.get('components.element.margin');
            }

            records.push(data);
        }

        editor.call('history:add', {
            name: 'entities.translate',
            undo: function() {
                for(var i = 0; i < records.length; i++) {
                    var item = records[i].get();
                    if (! item)
                        continue;

                    item.history.enabled = false;
                    item.set('position', records[i].valueOld);
                    if (records[i].marginOld)
                        item.set('components.element.margin', records[i].marginOld);
                    item.history.enabled = true;
                }
            },
            redo: function() {
                for(var i = 0; i < records.length; i++) {
                    var item = records[i].get();
                    if (! item)
                        continue;

                    item.history.enabled = false;
                    item.set('position', records[i].value);
                    if (records[i].margin)
                        item.set('components.element.margin', records[i].margin);
                    item.history.enabled = true;
                }
            }
        });
    };

    // translated
    var onGizmoOffset = function(x, y, z) {
        timeoutUpdateRotation = true;

        for(var i = 0; i < items.length; i++) {
            if (items[i].child)
                continue;

            var entity = items[i].obj.entity;
            var marginDirty = false;

            if (coordSystem === 'local') {
                vecA.set(x, y, z);
                vecB.set(1,1,1);
                if (entity.element && entity.element.screen) {
                    // scale offset by screen scale to ensure correct movement
                    vecB.copy(entity.element.screen.getLocalScale())
                    vecB.x = 1/vecB.x;
                    vecB.y = 1/vecB.y;
                    vecB.z = 1/vecB.z;
                }
                quat.copy(entity.getLocalRotation()).transformVector(vecA, vecA);
                vecA.mul(vecB);

                if (entity.element && (Math.abs(entity.element.anchor.x - entity.element.anchor.z) > 0.001 || Math.abs(entity.element.anchor.y - entity.element.anchor.w) > 0.001)) {
                    entity.element.margin.set(items[i].startMargin[0] + vecA.x, items[i].startMargin[1] + vecA.y, items[i].startMargin[2] - vecA.x, items[i].startMargin[3] - vecA.y);
                    entity.setLocalPosition(items[i].startLocal[0], items[i].startLocal[1], items[i].startLocal[2] + vecA.z);
                    marginDirty = true;
                } else {
                    entity.setLocalPosition(items[i].startLocal[0] + vecA.x, items[i].startLocal[1] + vecA.y, items[i].startLocal[2] + vecA.z);
                }
            } else {
                if (entity.element && (Math.abs(entity.element.anchor.x - entity.element.anchor.z) > 0.001 || Math.abs(entity.element.anchor.y - entity.element.anchor.w) > 0.001)) {
                    if (entity.element.screen) {
                        vecB.copy(entity.element.screen.getLocalScale())
                        vecA.set(x/vecB.x, y/vecB.y, z/vecB.z);
                    } else {
                        vecA.set(x, y, z);
                    }

                    entity.element.margin.set(items[i].startMargin[0] + vecA.x, items[i].startMargin[1] + vecA.y, items[i].startMargin[2] - vecA.x, items[i].startMargin[3] - vecA.y);
                    entity.setPosition(items[i].start[0], items[i].start[1], items[i].start[2] + z);
                    marginDirty = true;
                } else {
                    entity.setPosition(items[i].start[0] + x, items[i].start[1] + y, items[i].start[2] + z);
                }
            }

            // if (entity.collision) {
            //     app.systems.collision.onTransformChanged(entity.collision, entity.getPosition(), entity.getRotation(), entity.getLocalScale());
            // }

            if (marginDirty) {
                var margin = entity.element.margin;
                items[i].obj.set('components.element.margin', [margin.x, margin.y, margin.z, margin.w]);
            } else {
                var pos = entity.getLocalPosition();
                items[i].obj.set('position', [ pos.x, pos.y, pos.z ]);
            }

        }

        timeoutUpdateRotation = false;

        var pos = getGizmoPosition();
        editor.call('gizmo:translate:position', pos.x, pos.y, pos.z);
    };

    var onRender = function() {
        if (! app) return; // webgl not available

        if (! gizmoMoving && items.length) {
            var dirty = false;
            for(var i = 0; i < items.length; i++) {
                if (! items[i].obj.entity)
                    continue;

                var pos = items[i].obj.entity.getPosition();
                if (pos.x !== items[i].pos[0] || pos.y !== items[i].pos[1] || pos.z !== items[i].pos[2]) {
                    dirty = true;
                    items[i].pos[0] = pos.x;
                    items[i].pos[1] = pos.y;
                    items[i].pos[2] = pos.z;
                }
            }

            if (dirty) {
                var pos = getGizmoPosition();
                editor.call('gizmo:translate:position', pos.x, pos.y, pos.z);
            }
        }

        if (gizmoMoving && items.length) {
            var camera = editor.call('camera:current');
            var pos;

            var len = coordSystem === 'local' ? items.length : 1;
            for(var i = 0; i < len; i++) {
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
                app.renderLine(vecB, vecC, linesColorBehind, pc.LINEBATCH_GIZMO);
                if ((gizmoAxis === 'x' && ! gizmoPlane) || (gizmoPlane && (gizmoAxis === 'y' || gizmoAxis === 'z'))) {
                    app.renderLine(vecB, vecC, linesColorActive);
                } else {
                    app.renderLine(vecB, vecC, linesColor);
                }

                // y
                vecB.set(0, camera.camera.farClip * 2, 0);
                quat.transformVector(vecB, vecB).add(pos);
                vecC.set(0, camera.camera.farClip * -2, 0);
                quat.transformVector(vecC, vecC).add(pos);
                app.renderLine(vecB, vecC, linesColorBehind, pc.LINEBATCH_GIZMO);
                if ((gizmoAxis === 'y' && ! gizmoPlane) || (gizmoPlane && (gizmoAxis === 'x' || gizmoAxis === 'z'))) {
                    app.renderLine(vecB, vecC, linesColorActive);
                } else {
                    app.renderLine(vecB, vecC, linesColor);
                }

                // z
                vecB.set(0, 0, camera.camera.farClip * 2);
                quat.transformVector(vecB, vecB).add(pos);
                vecC.set(0, 0, camera.camera.farClip * -2);
                quat.transformVector(vecC, vecC).add(pos);
                app.renderLine(vecB, vecC, linesColorBehind, pc.LINEBATCH_GIZMO);
                if ((gizmoAxis === 'z' && ! gizmoPlane) || (gizmoPlane && (gizmoAxis === 'x' || gizmoAxis === 'y'))) {
                    app.renderLine(vecB, vecC, linesColorActive);
                } else {
                    app.renderLine(vecB, vecC, linesColor);
                }
            }
        }
    };

    editor.once('viewport:load', function() {
        app = editor.call('viewport:app');
    });

    var updateChildRelation = function() {
        var itemIds = { };
        for(var i = 0; i < items.length; i++) {
            itemIds[items[i].obj.get('resource_id')] = items[i];
        }

        for(var i = 0; i < items.length; i++) {
            var child = false;
            var parent = items[i].obj.entity._parent;
            var id = '';
            while(! child && parent) {
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

    var updateGizmo = function() {
        if (! editor.call('permissions:write'))
            return;

        var objects = editor.call('selector:items');

        for(var i = 0; i < events.length; i++)
            events[i].unbind();
        events = [ ];
        items = [ ];

        if (editor.call('selector:type') === 'entity' && editor.call('gizmo:type') === 'translate') {
            for(var i = 0; i < objects.length; i++) {
                if (! objects[i].entity)
                    continue;

                var pos = objects[i].entity.getPosition();

                var data = {
                    obj: objects[i],
                    pos: [ pos.x, pos.y, pos.z ],
                    start: [ 0, 0, 0 ],
                    startLocal: [ 0, 0, 0 ],
                };
                if (objects[i].entity.element) {
                    data.startMargin = [0, 0, 0, 0];
                }

                items.push(data);

                // position
                events.push(objects[i].on('position:set', updateGizmoPosition));
                // position.*
                for(var n = 0; n < 3; n++)
                    events.push(objects[i].on('position.' + n + ':set', updateGizmoPosition));

                // rotation
                events.push(objects[i].on('rotation:set', updateGizmoRotation));
                // rotation.*
                for(var n = 0; n < 3; n++)
                    events.push(objects[i].on('rotation.' + n + ':set', updateGizmoRotation));

                events.push(objects[i].on('parent:set', updateChildRelation));
            }

            if (! items.length)
                return;

            updateChildRelation();

            var rot = getGizmoRotation();
            editor.call('gizmo:translate:rotation', rot[0], rot[1], rot[2]);

            // gizmo start
            events.push(editor.on('gizmo:translate:start', onGizmoStart));
            // gizmo end
            events.push(editor.on('gizmo:translate:end', onGizmoEnd));
            // gizmo offset
            events.push(editor.on('gizmo:translate:offset', onGizmoOffset));

            // position gizmo
            var pos = getGizmoPosition();
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
});
