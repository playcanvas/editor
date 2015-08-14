editor.once('load', function() {
    'use strict';

    var gizmo = null;
    var visible = true;
    var moving = false;
    var mouseTap = null;
    var visible = true;
    var hover = false;
    var hoverAxis = '';
    var hoverMiddle = false;
    var hoverEntity = null;
    var gizmoSize = .4;
    var vecA = new pc.Vec3();
    var vecB = new pc.Vec3();
    var vecC = new pc.Vec3();
    var vecD = new pc.Vec3();
    var quat = new pc.Quat();
    var evtTapStart;
    var evtTapMove;
    var evtTapEnd;
    var pickStart = new pc.Vec3();

    var snap = false;
    var snapIncrement = 1;
    editor.on('gizmo:snap', function(state, increment) {
        snap = state;
        snapIncrement = increment;
    });

    // enable/disable gizmo
    editor.method('gizmo:scale:toggle', function(state) {
        if (! gizmo)
            return;

        if (! editor.call('permissions:write'))
            return;

        gizmo.root.enabled = state;

        visible = true;
    });

    // show/hide gizmo
    editor.method('gizmo:scale:visible', function(state) {
        if (! gizmo)
            return;

        visible = state;

        for(var i = 0; i < gizmo.hoverable.length; i++) {
            if (! gizmo.hoverable[i].model)
                continue;

            gizmo.hoverable[i].model.enabled = state;
        }

        editor.call('viewport:render');
    });

    // position gizmo
    editor.method('gizmo:scale:position', function(x, y, z) {
        gizmo.root.setPosition(x, y, z);

        if (gizmo.root.enabled)
            editor.call('viewport:render');
    });

    // rotate gizmo
    editor.method('gizmo:scale:rotation', function(pitch, yaw, roll) {
        gizmo.root.setEulerAngles(pitch, yaw, roll);

        if (gizmo.root.enabled)
            editor.call('viewport:render');
    });

    // initialize gizmo
    editor.once('viewport:load', function() {
        var app = editor.call('viewport:framework');

        gizmo = createEntity();
        gizmo.root.enabled = false;
        app.root.addChild(gizmo.root);

        // on picker hover
        editor.on('viewport:pick:hover', function(node, picked) {
            var match = gizmo.hoverable.indexOf(node) !== -1;
            if (! hover && match) {
                // hover
                hover = true;
            } else if (hover && ! match) {
                // unhover
                hover = false;
            }

            if (hover) {
                hoverEntity = node;

                if (node.axis && hoverAxis !== node.axis) {
                    // set normal material
                    if (hoverAxis) {
                        if (hoverMiddle) {
                            gizmo.box['x'].model.material = gizmo.box['x'].mat;
                            gizmo.box['y'].model.material = gizmo.box['y'].mat;
                            gizmo.box['z'].model.material = gizmo.box['z'].mat;
                        } else {
                            gizmo.box[hoverAxis].model.material = gizmo.box[hoverAxis].mat;
                        }
                    }

                    if (! hoverAxis && ! evtTapStart)
                        evtTapStart = editor.on('viewport:tap:start', onTapStart);

                    hoverAxis = node.axis;
                    hoverMiddle = node.middle;

                    // set active material
                    if (hoverMiddle) {
                        gizmo.box['x'].model.material = gizmo.matActive;
                        gizmo.box['y'].model.material = gizmo.matActive;
                        gizmo.box['z'].model.material = gizmo.matActive;
                    } else {
                        gizmo.box[hoverAxis].model.material = gizmo.matActive;
                    }
                }
            } else {
                if (hoverAxis) {
                    if (hoverMiddle) {
                        gizmo.box['x'].model.material = gizmo.box['x'].mat;
                        gizmo.box['y'].model.material = gizmo.box['y'].mat;
                        gizmo.box['z'].model.material = gizmo.box['z'].mat;
                    } else {
                        gizmo.box[hoverAxis].model.material = gizmo.box[hoverAxis].mat;
                    }
                }

                hoverAxis = '';

                if (evtTapStart) {
                    evtTapStart.unbind();
                    evtTapStart = null;
                }
            }
        });

        // update gizmo
        editor.on('viewport:postUpdate', function(dt) {
            if (gizmo.root.enabled) {
                editor.emit('gizmo:scale:render', dt);

                if (moving) {
                    var point = pickPlane(mouseTap.x, mouseTap.y);
                    if (point) {
                        point.sub(pickStart);
                        if (snap) {
                            point.scale(1 / snapIncrement);
                            point.x = Math.round(point.x);
                            point.y = Math.round(point.y);
                            point.z = Math.round(point.z);
                            point.scale(snapIncrement);
                        }
                        editor.emit('gizmo:scale:offset', point.x, point.y, point.z);
                    }
                }

                var camera = app.activeCamera;

                var posCamera = camera.getPosition();
                var posGizmo = gizmo.root.getPosition();
                var scale = 1;

                // scale to screen space
                if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                    var dot = vecA.copy(posGizmo).sub(posCamera).dot(camera.forward);
                    var denom = 1280 * Math.tan(camera.camera.fov * pc.math.DEG_TO_RAD);
                    scale = Math.max(0.0001, (dot / denom) * 150) * gizmoSize;
                } else {
                    scale = camera.camera.orthoHeight / 3 * gizmoSize;
                }
                gizmo.root.setLocalScale(scale, scale, scale);

                // calculate viewing angle
                vecA
                .copy(posCamera)
                .sub(posGizmo)
                .normalize();

                // rotate vector by gizmo rotation
                quat
                .copy(gizmo.root.getRotation())
                .invert()
                .transformVector(vecA, vecA);

                quat.invert();

                // hide lines and boxes if viewed from very angle
                gizmo.line.x.model.enabled = gizmo.box.x.model.enabled = ! (Math.abs(vecA.z) <= 0.15 && Math.abs(vecA.y) <= 0.15) && visible;
                gizmo.line.y.model.enabled = gizmo.box.y.model.enabled = ! (Math.abs(vecA.x) <= 0.15 && Math.abs(vecA.z) <= 0.15) && visible;
                gizmo.line.z.model.enabled = gizmo.box.z.model.enabled = ! (Math.abs(vecA.x) <= 0.15 && Math.abs(vecA.y) <= 0.15) && visible;

                // draw axes lines
                // line x
                if (gizmo.line.x.model.enabled) {
                    vecB.set(scale * .5, 0, 0);
                    quat.transformVector(vecB, vecB).add(posGizmo);
                    vecC.set(scale * 2, 0, 0);
                    quat.transformVector(vecC, vecC).add(posGizmo);
                    app.renderLine(vecB, vecC, gizmo.box.x.model.material === gizmo.matActive ? gizmo.matActive.color : gizmo.box.x.color, pc.LINEBATCH_GIZMO);
                }
                // line y
                if (gizmo.line.y.model.enabled) {
                    vecB.set(0, scale * .5, 0);
                    quat.transformVector(vecB, vecB).add(posGizmo);
                    vecC.set(0, scale * 2, 0);
                    quat.transformVector(vecC, vecC).add(posGizmo);
                    app.renderLine(vecB, vecC, gizmo.box.y.model.material === gizmo.matActive ? gizmo.matActive.color : gizmo.box.y.color, pc.LINEBATCH_GIZMO);
                }
                // line z
                if (gizmo.line.z.model.enabled) {
                    vecB.set(0, 0, scale * .5);
                    quat.transformVector(vecB, vecB).add(posGizmo);
                    vecC.set(0, 0, scale * 2);
                    quat.transformVector(vecC, vecC).add(posGizmo);
                    app.renderLine(vecB, vecC, gizmo.box.z.model.material === gizmo.matActive ? gizmo.matActive.color : gizmo.box.z.color, pc.LINEBATCH_GIZMO);
                }
            }
        });

        var pickPlane = function(x, y) {
            var camera = app.activeCamera;
            var scale = 1;
            var mouseWPos = camera.camera.screenToWorld(x, y, 1);
            var posCamera = camera.getPosition();
            var posGizmo = gizmo.root.getPosition();
            var mouseDir = vecA.copy(mouseWPos).sub(posCamera).normalize();

            if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                var dot = vecC.copy(posGizmo).sub(posCamera).dot(camera.forward);
                var denom = 1280 * Math.tan(camera.camera.fov * pc.math.DEG_TO_RAD);
                scale = Math.max(0.0001, (dot / denom) * 150) * gizmoSize;
            } else {
                scale = camera.camera.orthoHeight / 3 * gizmoSize;
            }

            quat.copy(gizmo.root.getRotation())

            // single axis
            if (! hoverMiddle) {
                // vector based on selected axis
                vecB.set(0, 0, 0);
                vecB[hoverAxis] = 1;
                // rotate vector by gizmo rotation
                quat.transformVector(vecB, vecB);

                vecC
                .copy(posCamera)
                .sub(posGizmo)
                .normalize();
                vecB.copy(vecC.sub(vecB.scale(vecB.dot(vecC))).normalize());
            } else {
                vecB
                .copy(posCamera)
                .sub(posGizmo)
                .normalize();
            }

            var rayPlaneDot = vecB.dot(mouseDir);
            var planeDist = posGizmo.dot(vecB);
            var pointPlaneDist = (vecB.dot(posCamera) - planeDist) / rayPlaneDot;
            var pickedPos = mouseDir.scale(-pointPlaneDist).add(posCamera);

            if (! hoverMiddle) {
                // single axis
                vecB.set(0, 0, 0);
                vecB[hoverAxis] = 1;
                quat.transformVector(vecB, vecB);
                pickedPos.copy(vecB.scale(vecB.dot(pickedPos)));
                quat.invert().transformVector(pickedPos, pickedPos);

                // calculate viewing angle
                vecC
                .copy(posCamera)
                .sub(posGizmo)
                .normalize();
                quat.transformVector(vecC, vecC);

                var v = pickedPos[hoverAxis];
                pickedPos.set(0, 0, 0);
                pickedPos[hoverAxis] = v / scale;
            } else {
                vecC.copy(pickedPos).sub(posGizmo).normalize();
                vecD.copy(camera.up).add(camera.right).normalize();

                var v = (pickedPos.sub(posGizmo).length() / scale / 2)  * vecC.dot(vecD);
                pickedPos.set(v, v, v);
            }

            return pickedPos;
        };

        var onTapStart = function(tap) {
            editor.emit('camera:toggle', false);

            moving = true;
            mouseTap = tap;

            if (gizmo.root.enabled) {
                pickStart.copy(pickPlane(tap.x, tap.y));
                pickStart.x -= 1;
                pickStart.y -= 1;
                pickStart.z -= 1;
            }

            editor.emit('gizmo:scale:start', hoverAxis, hoverMiddle);
            editor.call('gizmo:scale:visible', false);
        };

        var onTapMove = function(tap) {
            if (! moving)
                return;

            mouseTap = tap;
        };

        var onTapEnd = function(tap) {
            editor.emit('camera:toggle', true);

            if (! moving)
                return;

            moving = false;
            mouseTap = tap;

            editor.emit('gizmo:scale:end');
            editor.call('gizmo:scale:visible', true);
        };

        editor.on('viewport:hover', function(state) {
            if (state || ! moving)
                return;

            moving = false;

            editor.emit('gizmo:scale:end');
            editor.call('gizmo:scale:visible', true);
        });

        evtTapMove = editor.on('viewport:tap:move', onTapMove);
        evtTapEnd = editor.once('viewport:tap:end', onTapEnd);
    });

    var createMaterial = function(color) {
        var mat = new pc.BasicMaterial();
        mat.color = color;
        if (color.a !== 1) {
            mat.blend = true;
            mat.blendSrc = pc.BLENDMODE_SRC_ALPHA;
            mat.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
        }
        mat.cull = pc.CULLFACE_NONE;
        mat.update();
        return mat;
    };

    var createEntity = function() {
        var boxSize = .4;

        var obj = {
            root: null,
            middle: null,
            line: {
                x: null,
                y: null,
                z: null
            },
            box: {
                x: null,
                y: null,
                z: null
            },
            hoverable: [ ],
            matActive: null,
            matActiveTransparent: null
        };

        // active mat
        obj.matActive = createMaterial(new pc.Color(1, 1, 1, 1));
        obj.matActiveTransparent = createMaterial(new pc.Color(1, 1, 1, .25));
        obj.colorLineBehind = new pc.Color(1, 1, 1, 0.05);
        obj.colorLine = new pc.Color(1, 1, 1, .2);
        obj.colorLineActive = new pc.Color(1, 1, 1, 1);

        // root entity
        var entity = obj.root = new pc.Entity();

        // middle
        var middle = obj.middle = new pc.Entity();
        obj.hoverable.push(middle);
        middle.axis = 'xyz';
        middle.middle = true;
        middle.addComponent('model', {
            type: 'box'
        });
        middle.model.model.meshInstances[0].layer = pc.LAYER_GIZMO;
        middle.model.material.id = 0xFFFFFFFF;
        entity.addChild(middle);
        middle.setLocalScale(boxSize * 1.5, boxSize * 1.5, boxSize * 1.5);
        middle.mat = middle.model.material = createMaterial(new pc.Color(1, 1, 1, 0.2));
        middle.mat.depthTest = false;

        // line x
        var lineX = obj.line.x = new pc.Entity();
        obj.hoverable.push(lineX);
        lineX.axis = 'x';
        lineX.addComponent('model', {
            type: 'cylinder'
        });
        lineX.model.model.meshInstances[0].layer = pc.LAYER_GIZMO;
        entity.addChild(lineX);
        lineX.setLocalEulerAngles(90, 90, 0);
        lineX.setLocalPosition(1.25, 0, 0);
        lineX.setLocalScale(boxSize, 1.5, boxSize);
        lineX.mat = lineX.model.material = createMaterial(new pc.Color(1, 0, 0, 0));

        // line y
        var lineY = obj.line.y = new pc.Entity();
        obj.hoverable.push(lineY);
        lineY.axis = 'y';
        lineY.addComponent('model', {
            type: 'cylinder'
        });
        lineY.model.model.meshInstances[0].layer = pc.LAYER_GIZMO;
        entity.addChild(lineY);
        lineY.setLocalEulerAngles(0, 0, 0);
        lineY.setLocalPosition(0, 1.25, 0);
        lineY.setLocalScale(boxSize, 1.5, boxSize);
        lineY.mat = lineY.model.material = createMaterial(new pc.Color(0, 1, 0, 0));

        // line z
        var lineZ = obj.line.z = new pc.Entity();
        obj.hoverable.push(lineZ);
        lineZ.axis = 'z';
        lineZ.addComponent('model', {
            type: 'cylinder'
        });
        lineZ.model.model.meshInstances[0].layer = pc.LAYER_GIZMO;
        entity.addChild(lineZ);
        lineZ.setLocalEulerAngles(90, 0, 0);
        lineZ.setLocalPosition(0, 0, 1.25);
        lineZ.setLocalScale(boxSize, 1.5, boxSize);
        lineZ.mat = lineZ.model.material = createMaterial(new pc.Color(0, 0, 1, 0));

        // box x
        var boxX = obj.box.x = new pc.Entity();
        obj.hoverable.push(boxX);
        boxX.axis = 'x';
        boxX.addComponent('model', {
            type: 'box'
        });
        boxX.model.model.meshInstances[0].layer = pc.LAYER_GIZMO;
        entity.addChild(boxX);
        boxX.setLocalPosition(2.2, 0, 0);
        boxX.setLocalScale(boxSize, boxSize, boxSize);
        boxX.mat = boxX.model.material = createMaterial(new pc.Color(1, 0, 0, 1.1));
        boxX.color = new pc.Color(1, 0, 0, 1);

        // box y
        var boxY = obj.box.y = new pc.Entity();
        obj.hoverable.push(boxY);
        boxY.axis = 'y';
        boxY.addComponent('model', {
            type: 'box'
        });
        boxY.model.model.meshInstances[0].layer = pc.LAYER_GIZMO;
        entity.addChild(boxY);
        boxY.setLocalPosition(0, 2.2, 0);
        boxY.setLocalScale(boxSize, boxSize, boxSize);
        boxY.mat = boxY.model.material = createMaterial(new pc.Color(0, 1, 0, 1.1));
        boxY.color = new pc.Color(0, 1, 0, 1);

        // box z
        var boxZ = obj.box.z = new pc.Entity();
        obj.hoverable.push(boxZ);
        boxZ.axis = 'z';
        boxZ.addComponent('model', {
            type: 'box'
        });
        boxZ.model.model.meshInstances[0].layer = pc.LAYER_GIZMO;
        entity.addChild(boxZ);
        boxZ.setLocalPosition(0, 0, 2.2);
        boxZ.setLocalScale(boxSize, boxSize, boxSize);
        boxZ.mat = boxZ.model.material = createMaterial(new pc.Color(0, 0, 1, 1.1));
        boxZ.color = new pc.Color(0, 0, 1, 1);

        return obj;
    };
});
