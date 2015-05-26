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
        } else {
            var selection = editor.call('selection:aabb');
            if (! selection)
                return;

            vecA.copy(selection.center);
        }

        return vecA;
    };

    var getGizmoRotation = function() {
        if (! items.length)
            return;

        if (items.length === 1 && coordSystem === 'local') {
            var rot = items[0].obj.entity.getEulerAngles()
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

        var itemIds = { };
        for(var i = 0; i < items.length; i++) {
            itemIds[items[i].obj.get('resource_id')] = items[i];
        }

        movingStart.copy(getGizmoPosition());

        for(var i = 0; i < items.length; i++) {
            var child = false;
            var parent = items[i].obj.entity._parent;
            while(! child && parent) {
                if (itemIds[parent.getGuid()]) {
                    child = true;
                    break;
                }
                parent = parent._parent;
            }
            items[i].child = child;

            var pos = items[i].obj.entity.getPosition();
            items[i].start[0] = pos.x;
            items[i].start[1] = pos.y;
            items[i].start[2] = pos.z;
            pos = items[i].obj.get('position');
            items[i].startLocal[0] = pos[0];
            items[i].startLocal[1] = pos[1];
            items[i].startLocal[2] = pos[2];
            items[i].obj.history.enabled = false;
        }
    };

    // end translating
    var onGizmoEnd = function() {
        gizmoMoving = false;
        var records = [ ];

        for(var i = 0; i < items.length; i++) {
            items[i].obj.history.enabled = true;

            records.push({
                get: items[i].obj.history._getItemFn,
                valueOld: items[i].startLocal.slice(0),
                value: items[i].obj.get('position')
            });
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
                    item.history.enabled = true;
                }

                var pos = getGizmoPosition();
                if (pos)
                    editor.call('gizmo:translate:position', pos.x, pos.y, pos.z);
            },
            redo: function() {
                for(var i = 0; i < records.length; i++) {
                    var item = records[i].get();
                    if (! item)
                        continue;

                    item.history.enabled = false;
                    item.set('position', records[i].value);
                    item.history.enabled = true;
                }

                var pos = getGizmoPosition();
                if (pos)
                    editor.call('gizmo:translate:position', pos.x, pos.y, pos.z);
            }
        });
    };

    // translated
    var onGizmoOffset = function(x, y, z) {
        timeoutUpdateRotation = true;

        for(var i = 0; i < items.length; i++) {
            if (items[i].child)
                continue;

            items[i].obj.entity.setPosition(items[i].start[0] + x, items[i].start[1] + y, items[i].start[2] + z);
            var pos = items[i].obj.entity.getLocalPosition();
            items[i].obj.set('position', [ pos.x, pos.y, pos.z ]);
        }

        timeoutUpdateRotation = false;

        vecA.copy(movingStart).add(vecB.set(x, y, z));
        editor.call('gizmo:translate:position', vecA.x, vecA.y, vecA.z);
    };

    var onRender = function() {
        // if (items.length && ! gizmoMoving) {
        //     var pos = getGizmoPosition();
        //     editor.call('gizmo:translate:position', pos.x, pos.y, pos.z);
        // }

        if (gizmoMoving && items.length) {
            var pos = editor.call('gizmo:translate:position');
            var camera = app.activeCamera;

            if (coordSystem === 'local' && items.length === 1) {
                quat.copy(items[0].obj.entity.getRotation());
            } else {
                quat.setFromEulerAngles(0, 0, 0);
            }

            // x
            vecB.set(camera.camera.farClip * 2, 0, 0);
            quat.transformVector(vecB, vecB);
            vecC.copy(vecB).scale(-1).add(pos);
            vecB.add(pos);
            app.renderLine(vecB, vecC, linesColorBehind, pc.LINEBATCH_GIZMO);
            if ((gizmoAxis === 'x' && ! gizmoPlane) || (gizmoPlane && (gizmoAxis === 'y' || gizmoAxis === 'z'))) {
                app.renderLine(vecB, vecC, linesColorActive);
            } else {
                app.renderLine(vecB, vecC, linesColor);
            }

            // y
            vecB.set(0, camera.camera.farClip * 2, 0);
            quat.transformVector(vecB, vecB);
            vecC.copy(vecB).scale(-1).add(pos);
            vecB.add(pos);
            app.renderLine(vecB, vecC, linesColorBehind, pc.LINEBATCH_GIZMO);
            if ((gizmoAxis === 'y' && ! gizmoPlane) || (gizmoPlane && (gizmoAxis === 'x' || gizmoAxis === 'z'))) {
                app.renderLine(vecB, vecC, linesColorActive);
            } else {
                app.renderLine(vecB, vecC, linesColor);
            }

            // z
            vecB.set(0, 0, camera.camera.farClip * 2);
            quat.transformVector(vecB, vecB);
            vecC.copy(vecB).scale(-1).add(pos);
            vecB.add(pos);
            app.renderLine(vecB, vecC, linesColorBehind, pc.LINEBATCH_GIZMO);
            if ((gizmoAxis === 'z' && ! gizmoPlane) || (gizmoPlane && (gizmoAxis === 'x' || gizmoAxis === 'y'))) {
                app.renderLine(vecB, vecC, linesColorActive);
            } else {
                app.renderLine(vecB, vecC, linesColor);
            }
        }
    };

    editor.once('viewport:load', function() {
        app = editor.call('viewport:framework');
    });

    var updateGizmo = function() {
        var objects = editor.call('selector:items');

        for(var i = 0; i < events.length; i++)
            events[i].unbind();
        items = [ ];

        if (editor.call('selector:type') === 'entity' && editor.call('gizmo:type') === 'translate') {
            for(var i = 0; i < objects.length; i++) {
                items.push({
                    obj: objects[i],
                    start: [ 0, 0, 0 ],
                    startLocal: [ 0, 0, 0 ]
                });

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

                var rot = getGizmoRotation();
                editor.call('gizmo:translate:rotation', rot[0], rot[1], rot[2]);
            }

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
