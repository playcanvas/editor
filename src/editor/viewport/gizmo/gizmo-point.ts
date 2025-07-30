import { Events } from '@playcanvas/observer';

import { assignEvents } from '../../../common/utils.ts';
import { GIZMO_MASK } from '../../../core/constants.ts';
import { createColorMaterial } from '../viewport-color-material.ts';

editor.once('viewport:load', (app) => {
    const pool = [];
    const points = [];
    const gizmoSize = 0.1;
    let hoverPoint = null;
    let dragPoint = null;
    let mouseTap;
    let evtTapStart;
    const pickStart = new pc.Vec3();
    const vecA = new pc.Vec3();
    const vecB = new pc.Vec3();
    const vecC = new pc.Vec3();
    const vecD = new pc.Vec3();
    const vecE = new pc.Vec3();
    const quatA = new pc.Quat();

    const container = new pc.Entity();
    container.name = 'gizmo-points';
    container.__editor = true;
    app.root.addChild(container);

    var material = createColorMaterial();
    material.color = new pc.Color(1.0, 1.0, 1.0);
    material.cull = pc.CULLFACE_NONE;
    material.update();

    const layer = editor.call('gizmo:layers', 'Axis Gizmo');

    const pickPlane = function (x, y) {
        const camera = editor.call('camera:current');
        const mouseWPos = camera.camera.screenToWorld(x, y, 1);
        const posGizmo = vecE.copy(dragPoint.position);
        const rayOrigin = vecA.copy(camera.getPosition());
        const rayDirection = vecB.set(0, 0, 0);
        const planeNormal = vecC.set(0, 0, 0);
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

        const rayPlaneDot = planeNormal.dot(rayDirection);
        const planeDist = posGizmo.dot(planeNormal);
        const pointPlaneDist = (planeNormal.dot(rayOrigin) - planeDist) / rayPlaneDot;
        const pickedPos = rayDirection.scale(-pointPlaneDist).add(rayOrigin);

        // single axis
        planeNormal.set(0, 0, 0);
        planeNormal[dragPoint.axis] = 1;
        quatA.transformVector(planeNormal, planeNormal);
        pickedPos.copy(planeNormal.scale(planeNormal.dot(pickedPos)));

        quatA.invert().transformVector(pickedPos, pickedPos);

        const v = pickedPos[dragPoint.axis];
        pickedPos.set(0, 0, 0);
        pickedPos[dragPoint.axis] = v;

        return pickedPos;
    };

    const onTapStart = function (tap) {
        if (tap.button !== 0 || !hoverPoint) {
            return;
        }

        editor.emit('camera:toggle', false);

        mouseTap = tap;
        dragPoint = hoverPoint;

        pickStart.copy(pickPlane(mouseTap.x, mouseTap.y));
        dragPoint.entity.enabled = false;

        editor.emit('gizmo:point:start', dragPoint);
        dragPoint.emit('dragStart');
        editor.call('viewport:pick:state', false);
    };

    const onTapMove = function (tap) {
        if (!dragPoint) {
            return;
        }

        mouseTap = tap;
    };

    const onTapEnd = function (tap) {
        if (tap.button !== 0) {
            return;
        }

        editor.emit('camera:toggle:true', true);

        if (!dragPoint) {
            return;
        }

        mouseTap = tap;

        dragPoint.entity.enabled = true;
        editor.emit('gizmo:point:end', dragPoint);
        dragPoint.emit('dragEnd');
        dragPoint = null;

        editor.call('viewport:pick:state', true);
    };

    function Gizmo(axis, dir) {
        assignEvents(this);
        this.entity = null;
        this.axis = axis || 'y';
        this.dir = dir === undefined ? 1 : dir;
        this.rotation = new pc.Quat();
        this.position = new pc.Vec3();
        this.scale = new pc.Vec3(1, 1, 1);
    }
    Gizmo.prototype = Object.create(Events.prototype);

    Gizmo.prototype.update = function () {
        if (!this.entity) {
            return;
        }

        const camera = editor.call('camera:current');
        const posCamera = camera.getPosition();
        const pos = this.entity.getLocalPosition();
        let scale = 1;

        // scale to screen space
        if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
            const dot = vecA.copy(pos).sub(posCamera).dot(camera.forward);
            const denom = 1280 / (2 * Math.tan(camera.camera.fov * pc.math.DEG_TO_RAD / 2));
            scale = Math.max(0.0001, (dot / denom) * 150) * gizmoSize;
        } else {
            scale = camera.camera.orthoHeight / 3 * gizmoSize;
        }
        vecA.copy(this.scale).scale(scale);
        this.entity.setLocalScale(vecA);
    };

    Object.defineProperty(Gizmo.prototype, 'enabled', {
        set: function (value) {
            if (!!value === !!this.entity) {
                return;
            }

            if (value) {
                this.entity = new pc.Entity();
                this.entity.addComponent('model', {
                    type: 'box',
                    receiveShadows: false,
                    castShadowsLightmap: false,
                    castShadows: false,
                    layers: [layer.id]
                });
                this.entity.__editor = true;
                this.entity.point = this;
                // this.entity.model.meshInstances[0].layer = pc.LAYER_GIZMO;
                this.entity.model.meshInstances[0].mask = GIZMO_MASK;
                this.entity.model.meshInstances[0].material = material;
                container.addChild(this.entity);
            } else {
                this.entity.destroy();
                this.entity = null;
            }
        },
        get: function () {
            return !!this.entity;
        }
    });

    editor.method('gizmo:point:create', (axis, position, dir) => {
        let item = pool.shift();
        if (!item) {
            item = new Gizmo();
        }

        item.axis = axis || 'y';
        item.dir = dir === undefined ? 1 : dir;
        if (position) axis.position.copy(position);
        item.enabled = true;
        points.push(item.entity);

        return item;
    });

    editor.method('gizmo:point:recycle', (point) => {
        point.scale.set(1, 1, 1);
        point.enabled = false;
        pool.push(point);

        const ind = points.indexOf(point.entity);
        if (ind !== -1) {
            points.splice(ind, 1);
        }
    });

    editor.call('gizmo:point:hovered', () => {
        return hoverPoint;
    });

    // on picker hover
    editor.on('viewport:pick:hover', (node, picked) => {
        let match = false;
        if (node && node.__editor && node.point) {
            match = points.indexOf(node) !== -1;
        }

        if ((!hoverPoint || hoverPoint !== node) && match && node.point) {
            if (hoverPoint) {
                hoverPoint.emit('blur');
            }

            hoverPoint = node.point;
            hoverPoint.emit('focus');

            if (!evtTapStart) {
                evtTapStart = editor.on('viewport:tap:start', onTapStart);
            }
        } else if (hoverPoint && !match) {
            if (hoverPoint) {
                hoverPoint.emit('blur');
            }
            hoverPoint = null;

            if (evtTapStart) {
                evtTapStart.unbind();
                evtTapStart = null;
            }
        }
    });

    editor.on('viewport:mouse:move', onTapMove);
    editor.on('viewport:tap:end', onTapEnd);

    editor.on('viewport:postUpdate', (dt) => {
        if (!dragPoint) {
            return;
        }

        const point = pickPlane(mouseTap.x, mouseTap.y);
        if (point) {
            vecA.copy(point).sub(pickStart);

            let length = vecA.length();
            if ((vecA[dragPoint.axis] < 0 && dragPoint.dir === 1) || (vecA[dragPoint.axis] > 0 && dragPoint.dir === -1)) {
                length *= -1;
            }

            dragPoint.emit('dragMove', length);
        }

        editor.call('viewport:render');
    });
});
