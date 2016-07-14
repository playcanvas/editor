editor.once('viewport:load', function() {
    'use strict';

    var app = editor.call('viewport:framework');
    var pool = [ ];
    var points = [ ];
    var gizmoSize = 0.1;
    var hoverPoint = null;
    var dragPoint = null;
    var mouseTap;
    var evtTapStart;
    var pickStart = new pc.Vec3();
    var vecA = new pc.Vec3();
    var vecB = new pc.Vec3();
    var vecC = new pc.Vec3();
    var vecD = new pc.Vec3();
    var vecE = new pc.Vec3();
    var quatA = new pc.Quat();

    var color = new pc.Color(1, 1, 1, 1);
    var colorBehind = new pc.Color(1, 1, 1, 0.25);

    var container = new pc.Entity();
    container.name = 'gizmo-points';
    container.__editor = true;
    app.root.addChild(container);

    var material = new pc.BasicMaterial();
    material.color = new pc.Color(1.0, 1.0, 1.0);
    material.cull = pc.CULLFACE_NONE;
    material.update();

    function Gizmo(axis, dir) {
        Events.call(this);
        this.entity = null;
        this.axis = axis || 'y';
        this.dir = dir === undefined ? 1 : dir;
        this.rotation = new pc.Quat();
        this.position = new pc.Vec3();
    }
    Gizmo.prototype = Object.create(Events.prototype);

    Gizmo.prototype.update = function() {
        if (! this.entity)
            return;

        var camera = editor.call('camera:current');
        var posCamera = camera.getPosition();
        var pos = this.entity.getLocalPosition();
        var scale = 1;

        // scale to screen space
        if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
            var dot = vecA.copy(pos).sub(posCamera).dot(camera.forward);
            var denom = 1280 * Math.tan(camera.camera.fov * pc.math.DEG_TO_RAD);
            scale = Math.max(0.0001, (dot / denom) * 150) * gizmoSize;
        } else {
            scale = camera.camera.orthoHeight / 3 * gizmoSize;
        }
        this.entity.setLocalScale(scale, scale, scale);
    };

    Object.defineProperty(Gizmo.prototype, 'enabled', {
        set: function(value) {
            if (!! value === !! this.entity)
                return;

            if (value) {
                this.entity = new pc.Entity();
                this.entity.addComponent('model', {
                    type: 'box',
                    receiveShadows: false,
                    castShadowsLightmap: false,
                    castShadows: false,
                });
                this.entity.__editor = true;
                this.entity.point = this;
                this.entity.model.meshInstances[0].layer = pc.LAYER_GIZMO;
                this.entity.model.meshInstances[0].material = material;
                container.addChild(this.entity);
            } else {
                this.entity.destroy();
                this.entity = null;
            }
        },
        get: function() {
            return !! this.entity;
        }
    });

    editor.method('gizmo:point:create', function(axis, position, dir) {
        var item = pool.shift();
        if (! item)
            item = new Gizmo();

        item.axis = axis || 'y';
        item.dir = dir === undefined ? 1 : dir;
        if (position) axis.position.copy(position);
        item.enabled = true;
        points.push(item.entity);

        return item;
    });

    editor.method('gizmo:point:recycle', function(point) {
        point.enabled = false;
        pool.push(point);

        var ind = points.indexOf(point.entity);
        if (ind !== -1)
            points.splice(ind, 1);
    });

    editor.call('gizmo:point:hovered', function() {
        return hoverPoint;
    });

    // on picker hover
    editor.on('viewport:pick:hover', function(node, picked) {
        var match = false;
        if (node && node.__editor && node.point)
            match = points.indexOf(node) !== -1;

        if ((! hoverPoint || hoverPoint !== node) && match && node.point) {
            if (hoverPoint)
                hoverPoint.emit('blur');

            hoverPoint = node.point;
            hoverPoint.emit('focus');

            if (! evtTapStart)
                evtTapStart = editor.on('viewport:tap:start', onTapStart);
        } else if (hoverPoint && ! match) {
            if (hoverPoint)
                hoverPoint.emit('blur');
            hoverPoint = null;

            if (evtTapStart) {
                evtTapStart.unbind();
                evtTapStart = null;
            }
        }
    });

    var pickPlane = function(x, y) {
        var camera = editor.call('camera:current');
        var scale = 1;
        var mouseWPos = camera.camera.screenToWorld(x, y, 1);
        var posGizmo = vecE.copy(dragPoint.position);
        var rayOrigin = vecA.copy(camera.getPosition());
        var rayDirection = vecB.set(0, 0, 0);
        var planeNormal = vecC.set(0, 0, 0);
        planeNormal[dragPoint.axis] = 1;

        if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
            rayDirection.copy(mouseWPos).sub(rayOrigin).normalize();
        } else {
            rayOrigin.add(mouseWPos);
            camera.getWorldTransform().transformVector(vecD.set(0, 0, -1), rayDirection);
        }

        quatA.copy(dragPoint.rotation);

        // rotate vector by gizmo rotation
        quatA.transformVector(planeNormal, planeNormal);

        vecD.copy(rayOrigin).sub(posGizmo).normalize();
        planeNormal.copy(vecD.sub(planeNormal.scale(planeNormal.dot(vecD))).normalize());

        var rayPlaneDot = planeNormal.dot(rayDirection);
        var planeDist = posGizmo.dot(planeNormal);
        var pointPlaneDist = (planeNormal.dot(rayOrigin) - planeDist) / rayPlaneDot;
        var pickedPos = rayDirection.scale(-pointPlaneDist).add(rayOrigin);

        // single axis
        planeNormal.set(0, 0, 0);
        planeNormal[dragPoint.axis] = 1;
        quatA.transformVector(planeNormal, planeNormal);
        pickedPos.copy(planeNormal.scale(planeNormal.dot(pickedPos)));

        quatA.invert().transformVector(pickedPos, pickedPos);

        var v = pickedPos[dragPoint.axis];
        pickedPos.set(0, 0, 0);
        pickedPos[dragPoint.axis] = v;

        return pickedPos;
    };

    var onTapStart = function(tap) {
        if (tap.button !== 0 || ! hoverPoint)
            return;

        editor.emit('camera:toggle', false);

        mouseTap = tap;
        dragPoint = hoverPoint;

        pickStart.copy(pickPlane(mouseTap.x, mouseTap.y));
        dragPoint.entity.enabled = false;

        editor.emit('gizmo:point:start', dragPoint);
        dragPoint.emit('dragStart');
        editor.call('viewport:pick:state', false);
    };

    var onTapMove = function(tap) {
        if (! dragPoint)
            return;

        mouseTap = tap;
    };

    var onTapEnd = function(tap) {
        if (tap.button !== 0)
            return;

        editor.emit('camera:toggle:true', true);

        if (! dragPoint)
            return;

        mouseTap = tap;

        dragPoint.entity.enabled = true;
        editor.emit('gizmo:point:end', dragPoint);
        dragPoint.emit('dragEnd');
        dragPoint = null;

        editor.call('viewport:pick:state', true);
    };

    editor.on('viewport:hover', function(state) {
        if (state || ! dragPoint)
            return;

        dragPoint.entity.enabled = true;
        editor.emit('gizmo:point:end', dragPoint);
        dragPoint.emit('dragEnd');
        dragPoint = null;

        editor.call('viewport:pick:state', true);
    });

    editor.on('viewport:mouse:move', onTapMove);
    editor.on('viewport:tap:end', onTapEnd);

    editor.on('viewport:postUpdate', function(dt) {
        if (! dragPoint)
            return;

        var point = pickPlane(mouseTap.x, mouseTap.y);
        if (point) {
            vecA.copy(point).sub(pickStart);

            var length = vecA.length();
            if ((vecA[dragPoint.axis] < 0 && dragPoint.dir === 1) || (vecA[dragPoint.axis] > 0 && dragPoint.dir === -1))
                length *= -1;

            dragPoint.emit('dragMove', length);
        }
    });
});
