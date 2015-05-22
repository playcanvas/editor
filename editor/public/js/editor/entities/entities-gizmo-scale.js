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
    var app;
    var gizmoMoving = false;
    var gizmoAxis, gizmoMiddle;
    var linesColor = new pc.Color(1, 1, 1, .25);

    // get position of gizmo based on selected entities
    var getGizmoPosition = function() {
        if (! items.length)
            return;

        vecA.set(0, 0, 0);
        for(var i = 0; i < items.length; i++) {
            var pos = items[i].obj.get('position');
            vecA.x += pos[0];
            vecA.y += pos[1];
            vecA.z += pos[2];
        }
        vecA.scale(1 / items.length);
        return vecA;
    };

    var getGizmoRotation = function() {
        if (! items.length)
            return;

        if (items.length === 1) {
            return items[0].obj.get('rotation');
        } else {
            return [ 0, 0, 0 ];
        }
    };

    // update gizmo position
    var updateGizmoPosition = function() {
        if (! items.length || timeoutUpdatePosition)
            return;

        timeoutUpdatePosition = true;

        setTimeout(function() {
            timeoutUpdatePosition = false;

            var vec = getGizmoPosition();
            if (vec)
                editor.call('gizmo:scale:position', vec.x, vec.y, vec.z);
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
                editor.call('gizmo:scale:rotation', vec[0], vec[1], vec[2]);
        });
    };

    // start translating
    var onGizmoStart = function(axis, middle) {
        gizmoAxis = axis;
        gizmoMiddle = middle;
        gizmoMoving = true;

        var vec = getGizmoPosition();
        for(var i = 0; i < items.length; i++) {
            var scale = items[i].obj.get('scale');
            items[i].start[0] = scale[0];
            items[i].start[1] = scale[1];
            items[i].start[2] = scale[2];
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
                valueOld: items[i].start.slice(0),
                value: items[i].obj.get('scale')
            });
        }

        editor.call('history:add', {
            name: 'entities.scale',
            undo: function() {
                for(var i = 0; i < records.length; i++) {
                    var item = records[i].get();
                    if (! item)
                        continue;

                    item.history.enabled = false;
                    item.set('scale', records[i].valueOld);
                    item.history.enabled = true;
                }
            },
            redo: function() {
                for(var i = 0; i < records.length; i++) {
                    var item = records[i].get();
                    if (! item)
                        continue;

                    item.history.enabled = false;
                    item.set('scale', records[i].value);
                    item.history.enabled = true;
                }
            }
        });
    };

    // scaled
    var onGizmoOffset = function(x, y, z) {
        for(var i = 0; i < items.length; i++)
            items[i].obj.set('scale', [ items[i].start[0] * x, items[i].start[1] * y, items[i].start[2] * z ]);
    };

    var onRender = function() {
        if (gizmoMoving && items.length) {
            var camera = app.activeCamera;

            for(var i = 0; i < items.length; i++) {
                var pos = items[i].obj.get('position');
                vecA.set(pos[0], pos[1], pos[2]);

                var rot = items[i].obj.get('rotation');
                quat.setFromEulerAngles(rot[0], rot[1], rot[2]);

                if (gizmoAxis === 'x' || gizmoMiddle) {
                    vecB.set(camera.camera.farClip * 2, 0, 0);
                    quat.transformVector(vecB, vecB);
                    vecC.copy(vecB).scale(-1).add(vecA);
                    vecB.add(vecA);
                    app.renderLine(vecB, vecC, linesColor);
                }
                if (gizmoAxis === 'y' || gizmoMiddle) {
                    vecB.set(0, camera.camera.farClip * 2, 0);
                    quat.transformVector(vecB, vecB);
                    vecC.copy(vecB).scale(-1).add(vecA);
                    vecB.add(vecA);
                    app.renderLine(vecB, vecC, linesColor);
                }
                if (gizmoAxis === 'z' || gizmoMiddle) {
                    vecB.set(0, 0, camera.camera.farClip * 2);
                    quat.transformVector(vecB, vecB);
                    vecC.copy(vecB).scale(-1).add(vecA);
                    vecB.add(vecA);
                    app.renderLine(vecB, vecC, linesColor);
                }
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

        if (editor.call('selector:type') === 'entity' && editor.call('gizmo:type') === 'scale') {
            for(var i = 0; i < objects.length; i++) {
                items.push({
                    obj: objects[i],
                    start: [ 1, 1, 1 ]
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
                editor.call('gizmo:scale:rotation', rot[0], rot[1], rot[2]);
            }

            // gizmo start
            events.push(editor.on('gizmo:scale:start', onGizmoStart));
            // gizmo end
            events.push(editor.on('gizmo:scale:end', onGizmoEnd));
            // gizmo offset
            events.push(editor.on('gizmo:scale:offset', onGizmoOffset));

            // position gizmo
            var pos = getGizmoPosition();
            editor.call('gizmo:scale:position', pos.x, pos.y, pos.z);
            // show gizmo
            editor.call('gizmo:scale:toggle', true);
            // on render
            events.push(editor.on('viewport:update', onRender));
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
