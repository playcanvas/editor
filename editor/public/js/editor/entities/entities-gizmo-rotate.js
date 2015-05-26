editor.once('load', function() {
    'use strict';

    var events = [ ];
    var items = [ ];
    var quat = new pc.Quat();
    var quatB = new pc.Quat();
    var vecA = new pc.Vec3();
    var vecB = new pc.Vec3();
    var vecC = new pc.Vec3();
    var startPosition = new pc.Vec3();
    var timeoutUpdatePosition, timeoutUpdateRotation;
    var coordSystem = 'world';
    var app;
    var gizmoMoving = false;
    var gizmoAxis;
    var linesColorActive = new pc.Color(1, 1, 1, 1);
    var linesColor = new pc.Color(1, 1, 1, .2);
    var linesColorBehind = new pc.Color(1, 1, 1, .05);

    editor.on('gizmo:coordSystem', function(system) {
        if (coordSystem === system)
            return;

        coordSystem = system;

        var rot = getGizmoRotation();
        if (rot)
            editor.call('gizmo:rotate:rotation', rot[0], rot[1], rot[2]);

        editor.call('viewport:render');
    });

    // get position of gizmo based on selected entities
    var getGizmoPosition = function() {
        if (! items.length)
            return;

        vecA.set(0, 0, 0);
        for(var i = 0; i < items.length; i++) {
            var pos = items[i].obj.entity.getPosition();
            vecA.x += pos.x;
            vecA.y += pos.y;
            vecA.z += pos.z;
        }
        vecA.scale(1 / items.length);
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
        if (! items.length || timeoutUpdatePosition)
            return;

        timeoutUpdatePosition = true;

        setTimeout(function() {
            timeoutUpdatePosition = false;

            var vec = getGizmoPosition();
            if (vec)
                editor.call('gizmo:rotate:position', vec.x, vec.y, vec.z);
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
                editor.call('gizmo:rotate:rotation', vec[0], vec[1], vec[2]);
        });
    };

    // start translating
    var onGizmoStart = function(axis) {
        gizmoAxis = axis;
        gizmoMoving = true;

        var itemIds = { };
        for(var i = 0; i < items.length; i++) {
            itemIds[items[i].obj.get('resource_id')] = items[i];
        }

        var vec = getGizmoPosition();
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

            var rot = items[i].obj.entity.getEulerAngles();
            items[i].start[0] = rot.x;
            items[i].start[1] = rot.y;
            items[i].start[2] = rot.z;

            rot = items[i].obj.get('rotation');
            items[i].startLocal[0] = rot[0];
            items[i].startLocal[1] = rot[1];
            items[i].startLocal[2] = rot[2];

            items[i].startLocalQuat = items[i].obj.entity.getLocalRotation();
            items[i].startQuat = items[i].obj.entity.getRotation();

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
                value: items[i].obj.get('rotation')
            });
        }

        editor.call('history:add', {
            name: 'entities.rotate',
            undo: function() {
                for(var i = 0; i < records.length; i++) {
                    var item = records[i].get();
                    if (! item)
                        continue;

                    item.history.enabled = false;
                    item.set('rotation', records[i].valueOld);
                    item.history.enabled = true;
                }
            },
            redo: function() {
                for(var i = 0; i < records.length; i++) {
                    var item = records[i].get();
                    if (! item)
                        continue;

                    item.history.enabled = false;
                    item.set('rotation', records[i].value);
                    item.history.enabled = true;
                }

                var pos = getGizmoPosition();
                editor.call('gizmo:rotate:position', pos.x, pos.y, pos.z);
            }
        });

        var pos = getGizmoPosition();
        editor.call('gizmo:rotate:position', pos.x, pos.y, pos.z);
    };

    // translated
    var onGizmoOffset = function(angle, point) {
        timeoutUpdateRotation = true;

        for(var i = 0; i < items.length; i++) {
            if (items[i].child)
                continue;

            vecA.set(0, 0, 0);
            vecA[gizmoAxis] = 1;

            quat.setFromAxisAngle(vecA, angle);

            if (coordSystem === 'local' && items.length === 1) {
                quatB.copy(items[i].startLocalQuat).mul(quat);
                items[i].obj.entity.setLocalRotation(quatB);
            } else {
                quatB.copy(quat).mul(items[i].startQuat);
                items[i].obj.entity.setRotation(quatB);
            }

            var angles = items[i].obj.entity.getLocalEulerAngles();

            items[i].obj.set('rotation', [ angles.x, angles.y, angles.z ]);
        }

        timeoutUpdateRotation = false;

        if (items.length === 1 && coordSystem === 'local') {
            var rot = getGizmoRotation();
            editor.call('gizmo:rotate:rotation', rot[0], rot[1], rot[2]);
        }
    };

    var onRender = function() {
        if (items.length === 1 && coordSystem === 'local') {
            var rot = getGizmoRotation();
            editor.call('gizmo:rotate:rotation', rot[0], rot[1], rot[2]);
        }

        if (! gizmoMoving) {
            var pos = getGizmoPosition();
            editor.call('gizmo:rotate:position', pos.x, pos.y, pos.z);
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

        if (editor.call('selector:type') === 'entity' && editor.call('gizmo:type') === 'rotate') {
            for(var i = 0; i < objects.length; i++) {
                items.push({
                    obj: objects[i],
                    startLocalQuat: objects[i].entity.getLocalRotation(),
                    startQuat: objects[i].entity.getRotation(),
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
            }

            // gizmo start
            events.push(editor.on('gizmo:rotate:start', onGizmoStart));
            // gizmo end
            events.push(editor.on('gizmo:rotate:end', onGizmoEnd));
            // gizmo offset
            events.push(editor.on('gizmo:rotate:offset', onGizmoOffset));

            // rotation gizmo
            var rot = getGizmoRotation();
            editor.call('gizmo:rotate:rotation', rot[0], rot[1], rot[2]);
            // position gizmo
            var pos = getGizmoPosition();
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
