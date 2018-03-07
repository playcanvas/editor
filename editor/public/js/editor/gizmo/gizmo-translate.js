editor.once('load', function() {
    'use strict';

    var gizmo = null;
    var visible = true;
    var moving = false;
    var mouseTap = null;
    var mouseTapMoved = false;
    var posCameraLast = new pc.Vec3();
    var visible = true;
    var enabled = false;
    var hover = false;
    var hoverAxis = '';
    var hoverPlane = false;
    var hoverEntity = null;
    var gizmoSize = .4;
    var arrowRadius = .4;
    var vecA = new pc.Vec3();
    var vecB = new pc.Vec3();
    var vecC = new pc.Vec3();
    var vecD = new pc.Vec3();
    var vecE = new pc.Vec3();
    var quat = new pc.Quat();
    var matA = new pc.Mat4();
    var matB = new pc.Mat4();
    var evtTapStart;
    var pickStart = new pc.Vec3();
    var immediateRenderOptions;

    var snap = false;
    var snapIncrement = 1;
    editor.on('gizmo:snap', function(state, increment) {
        snap = state;
        snapIncrement = increment;
    });

    // enable/disable gizmo
    editor.method('gizmo:translate:toggle', function(state) {
        if (! gizmo)
            return;

        gizmo.root.enabled = state && editor.call('permissions:write');
        enabled = state;

        visible = true;
    });

    editor.on('permissions:writeState', function(state) {
        if (! gizmo)
            return;

        gizmo.root.enabled = enabled && state;
        editor.call('viewport:render');
    });

    // show/hide gizmo
    editor.method('gizmo:translate:visible', function(state) {
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
    editor.method('gizmo:translate:position', function(x, y, z) {
        if (x === undefined)
            return gizmo.root.getPosition();

        gizmo.root.setPosition(x, y, z);

        if (gizmo.root.enabled)
            editor.call('viewport:render');
    });

    // rotate gizmo
    editor.method('gizmo:translate:rotation', function(pitch, yaw, roll) {
        gizmo.root.setEulerAngles(pitch, yaw, roll);

        if (gizmo.root.enabled)
            editor.call('viewport:render');
    });

    // initialize gizmo
    editor.once('viewport:load', function() {
        var app = editor.call('viewport:app');
        if (! app) return; // webgl not available

        gizmo = createEntity();
        gizmo.root.enabled = false;
        app.root.addChild(gizmo.root);

        if (!immediateRenderOptions) {
            immediateRenderOptions = {
                layer: editor.call('gizmo:layers', 'Axis Gizmo Immediate'),
                depthTest: true,
                mask: GIZMO_MASK
            };
        }

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

                if (node.axis && (hoverAxis !== node.axis || hoverPlane !== node.plane)) {
                    // set normal material
                    if (hoverAxis) {
                        if (hoverPlane) {
                            gizmo.plane[hoverAxis].model.material = gizmo.plane[hoverAxis].mat;
                        } else {
                            gizmo.arrow[hoverAxis].model.material = gizmo.arrow[hoverAxis].mat;
                        }
                    }

                    if (! hoverAxis && ! evtTapStart)
                        evtTapStart = editor.on('viewport:tap:start', onTapStart);

                    hoverAxis = node.axis;
                    hoverPlane = node.plane;

                    // set active material
                    if (hoverPlane) {
                        gizmo.plane[hoverAxis].model.material = gizmo.matActiveTransparent;
                    } else {
                        gizmo.arrow[hoverAxis].model.material = gizmo.matActive;
                    }
                }
            } else {
                if (hoverAxis) {
                    if (hoverPlane) {
                        gizmo.plane[hoverAxis].model.material = gizmo.plane[hoverAxis].mat;
                    } else {
                        gizmo.arrow[hoverAxis].model.material = gizmo.arrow[hoverAxis].mat;
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
                var camera = editor.call('camera:current');
                var posCamera = camera.getPosition();

                quat.copy(gizmo.root.getRotation()).invert();

                if (moving && (vecA.copy(posCameraLast).sub(posCamera).length() > 0.01 || mouseTapMoved)) {
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
                        editor.emit('gizmo:translate:offset', point.x, point.y, point.z);
                    }

                    editor.call('viewport:render');
                }

                editor.emit('gizmo:translate:render', dt);

                posCameraLast.copy(posCamera);

                var posGizmo = gizmo.root.getPosition();
                var scale = 1;

                // scale to screen space
                if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                    var dot = vecA.copy(posGizmo).sub(posCamera).dot(camera.forward);
                    var denom = 1280 / (2 * Math.tan(camera.camera.fov * pc.math.DEG_TO_RAD / 2));
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
                quat.transformVector(vecA, vecA);

                // swap sides to face camera
                // x
                gizmo.plane.x.setLocalPosition(0, (vecA.y > 0) ? .4 : -.4, (vecA.z > 0) ? .4 : -.4);
                gizmo.line.x.setLocalPosition((vecA.x > 0) ? 1.5 : 1.1, 0, 0);
                gizmo.line.x.setLocalScale(arrowRadius, (vecA.x > 0) ? 1 : 1.8, arrowRadius);
                // y
                gizmo.plane.y.setLocalPosition((vecA.x > 0) ? .4 : -.4, 0, (vecA.z > 0) ? .4 : -.4);
                gizmo.line.y.setLocalPosition(0, (vecA.y > 0) ? 1.5 : 1.1, 0);
                gizmo.line.y.setLocalScale(arrowRadius, (vecA.y > 0) ? 1 : 1.8, arrowRadius);
                // z
                gizmo.plane.z.setLocalPosition((vecA.x > 0) ? .4 : -.4, (vecA.y > 0) ? .4 : -.4, 0);
                gizmo.line.z.setLocalPosition(0, 0, (vecA.z > 0) ? 1.5 : 1.1);
                gizmo.line.z.setLocalScale(arrowRadius, (vecA.z > 0) ? 1 : 1.8, arrowRadius);

                // hide plane if viewed from very angle
                gizmo.plane.x.model.enabled = Math.abs(vecA.x) > 0.15 && visible;
                gizmo.plane.y.model.enabled = Math.abs(vecA.y) > 0.15 && visible;
                gizmo.plane.z.model.enabled = Math.abs(vecA.z) > 0.15 && visible;

                quat.invert();

                // plane x lines
                if (gizmo.plane.x.model.enabled) {
                    vecB.set(0, 0, (vecA.z > 0) ? scale * .8 : -scale * .8);
                    vecC.set(0, (vecA.y > 0) ? scale * .8 : -scale * .8, (vecA.z > 0) ? scale * .8 : -scale * .8);
                    vecD.set(0, (vecA.y > 0) ? scale * .8 : -scale * .8, 0);
                    quat.transformVector(vecB, vecB).add(gizmo.root.getPosition());
                    quat.transformVector(vecC, vecC).add(gizmo.root.getPosition());
                    quat.transformVector(vecD, vecD).add(gizmo.root.getPosition());
                    var clr = (hoverAxis === 'x' && hoverPlane) ? gizmo.matActive.color : gizmo.arrow.x.mat.color;
                    app.renderLines([ vecB, vecC, vecC, vecD ], clr, immediateRenderOptions);
                }
                // plane y lines
                if (gizmo.plane.y.model.enabled) {
                    vecB.set((vecA.x > 0) ? scale * .8 : -scale * .8, 0, 0);
                    vecC.set((vecA.x > 0) ? scale * .8 : -scale * .8, 0, (vecA.z > 0) ? scale * .8 : -scale * .8);
                    vecD.set(0, 0, (vecA.z > 0) ? scale * .8 : -scale * .8);
                    quat.transformVector(vecB, vecB).add(gizmo.root.getPosition());
                    quat.transformVector(vecC, vecC).add(gizmo.root.getPosition());
                    quat.transformVector(vecD, vecD).add(gizmo.root.getPosition());
                    var clr = (hoverAxis === 'y' && hoverPlane) ? gizmo.matActive.color : gizmo.arrow.y.mat.color;
                    app.renderLines([ vecB, vecC, vecC, vecD ], clr, immediateRenderOptions);
                }
                // plane z lines
                if (gizmo.plane.z.model.enabled) {
                    vecB.set((vecA.x > 0) ? scale * .8 : -scale * .8, 0, 0);
                    vecC.set((vecA.x > 0) ? scale * .8 : -scale * .8, (vecA.y > 0) ? scale * .8 : -scale * .8, 0);
                    vecD.set(0, (vecA.y > 0) ? scale * .8 : -scale * .8, 0);
                    quat.transformVector(vecB, vecB).add(gizmo.root.getPosition());
                    quat.transformVector(vecC, vecC).add(gizmo.root.getPosition());
                    quat.transformVector(vecD, vecD).add(gizmo.root.getPosition());
                    var clr = (hoverAxis === 'z' && hoverPlane) ? gizmo.matActive.color : gizmo.arrow.z.mat.color;
                    app.renderLines([ vecB, vecC, vecC, vecD ], clr, immediateRenderOptions);
                }

                // hide lines and arrows if viewed from very angle
                gizmo.line.x.model.enabled = gizmo.arrow.x.model.enabled = ! (Math.abs(vecA.z) <= 0.15 && Math.abs(vecA.y) <= 0.15) && visible;
                gizmo.line.y.model.enabled = gizmo.arrow.y.model.enabled = ! (Math.abs(vecA.x) <= 0.15 && Math.abs(vecA.z) <= 0.15) && visible;
                gizmo.line.z.model.enabled = gizmo.arrow.z.model.enabled = ! (Math.abs(vecA.x) <= 0.15 && Math.abs(vecA.y) <= 0.15) && visible;

                // draw axes lines
                // line x
                if (gizmo.line.x.model.enabled) {
                    vecB.set(((vecA.x > 0) ? scale * 1 : scale * .2), 0, 0);
                    quat.transformVector(vecB, vecB).add(gizmo.root.getPosition());
                    vecC.set(scale * 2, 0, 0);
                    quat.transformVector(vecC, vecC).add(gizmo.root.getPosition());
                    app.renderLines([vecB, vecC], gizmo.arrow.x.model.material.color, immediateRenderOptions);
                }
                // line y
                if (gizmo.line.y.model.enabled) {
                    vecB.set(0, ((vecA.y > 0) ? scale * 1 : scale * .2), 0);
                    quat.transformVector(vecB, vecB).add(gizmo.root.getPosition());
                    vecC.set(0, scale * 2, 0);
                    quat.transformVector(vecC, vecC).add(gizmo.root.getPosition());
                    app.renderLine(vecB, vecC, gizmo.arrow.y.model.material.color, immediateRenderOptions);
                }
                // line z
                if (gizmo.line.z.model.enabled) {
                    vecB.set(0, 0, ((vecA.z > 0) ? scale * 1 : scale * .2));
                    quat.transformVector(vecB, vecB).add(gizmo.root.getPosition());
                    vecC.set(0, 0, scale * 2);
                    quat.transformVector(vecC, vecC).add(gizmo.root.getPosition());
                    app.renderLine(vecB, vecC, gizmo.arrow.z.model.material.color, immediateRenderOptions);
                }
            }

            mouseTapMoved = false
        });

        var pickPlane = function(x, y) {
            var camera = editor.call('camera:current');

            var mouseWPos = camera.camera.screenToWorld(x, y, 1);
            var posGizmo = gizmo.root.getPosition();
            var rayOrigin = vecA.copy(camera.getPosition());
            var rayDirection = vecB.set(0, 0, 0);
            var planeNormal = vecC.set(0, 0, 0);
            planeNormal[hoverAxis] = 1;

            if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                rayDirection.copy(mouseWPos).sub(rayOrigin).normalize();
            } else {
                rayOrigin.add(mouseWPos);
                camera.getWorldTransform().transformVector(vecD.set(0, 0, -1), rayDirection);
            }

            // rotate vector by gizmo rotation
            quat.copy(gizmo.root.getRotation()).transformVector(planeNormal, planeNormal);

            // single axis
            if (! hoverPlane) {
                vecD.copy(rayOrigin).sub(posGizmo).normalize();
                planeNormal.copy(vecD.sub(planeNormal.scale(planeNormal.dot(vecD))).normalize());
            }

            var rayPlaneDot = planeNormal.dot(rayDirection);
            var planeDist = posGizmo.dot(planeNormal);
            var pointPlaneDist = (planeNormal.dot(rayOrigin) - planeDist) / rayPlaneDot;
            var pickedPos = rayDirection.scale(-pointPlaneDist).add(rayOrigin);

            if (! hoverPlane) {
                // single axis
                planeNormal.set(0, 0, 0);
                planeNormal[hoverAxis] = 1;
                quat.transformVector(planeNormal, planeNormal);
                pickedPos.copy(planeNormal.scale(planeNormal.dot(pickedPos)));
            }

            quat.invert().transformVector(pickedPos, pickedPos);

            if (! hoverPlane) {
                var v = pickedPos[hoverAxis];
                pickedPos.set(0, 0, 0);
                pickedPos[hoverAxis] = v;
            }

            return pickedPos;
        };

        var onTapStart = function(tap) {
            if (moving || tap.button !== 0)
                return;

            editor.emit('camera:toggle', false);
            editor.call('viewport:pick:state', false);

            moving = true;
            mouseTap = tap;

            if (gizmo.root.enabled)
                pickStart.copy(pickPlane(tap.x, tap.y));

            editor.emit('gizmo:translate:start', hoverAxis, hoverPlane);
            editor.call('gizmo:translate:visible', false);
        };

        var onTapMove = function(tap) {
            if (! moving)
                return;

            mouseTap = tap;
            mouseTapMoved = true;
        };

        var onTapEnd = function(tap) {
            if (tap.button !== 0)
                return;

            editor.emit('camera:toggle', true);

            if (! moving)
                return;

            moving = false;
            mouseTap = tap;

            editor.emit('gizmo:translate:end');
            editor.call('gizmo:translate:visible', true);
            editor.call('viewport:pick:state', true);
        };

        editor.on('viewport:tap:move', onTapMove);
        editor.on('viewport:tap:end', onTapEnd);
    });

    var createMaterial = function(color) {
        var mat = new pc.BasicMaterial();
        mat.color = color;
        if (color.a !== 1) {
            mat.blend = true;
            mat.blendSrc = pc.BLENDMODE_SRC_ALPHA;
            mat.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
        }
        mat.update();
        return mat;
    };

    var createEntity = function() {
        var obj = {
            root: null,
            plane: {
                x: null,
                y: null,
                z: null
            },
            line: {
                x: null,
                y: null,
                z: null
            },
            arrow: {
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
        obj.matActiveTransparent.cull = pc.CULLFACE_NONE;

        // root entity
        var entity = obj.root = new pc.Entity();

        var gizmoLayer = editor.call('gizmo:layers', 'Axis Gizmo').id;

        // plane x
        var planeX = obj.plane.x = new pc.Entity();
        planeX.name = "planeX";
        obj.hoverable.push(planeX);
        planeX.axis = 'x';
        planeX.plane = true;
        planeX.addComponent('model', {
            type: 'plane',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [gizmoLayer]
        });
        planeX.model.model.meshInstances[0].mask = GIZMO_MASK;
        entity.addChild(planeX);
        planeX.setLocalEulerAngles(90, -90, 0);
        planeX.setLocalScale(.8, .8, .8);
        planeX.setLocalPosition(0, .4, .4);
        planeX.mat = planeX.model.material = createMaterial(new pc.Color(1, 0, 0, .25));
        planeX.mat.cull = pc.CULLFACE_NONE;

        // plane y
        var planeY = obj.plane.y = new pc.Entity();
        planeY.name = "planeY";
        obj.hoverable.push(planeY);
        planeY.axis = 'y';
        planeY.plane = true;
        planeY.addComponent('model', {
            type: 'plane',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [gizmoLayer]
        });
        planeY.model.model.meshInstances[0].mask = GIZMO_MASK;
        entity.addChild(planeY);
        planeY.setLocalEulerAngles(0, 0, 0);
        planeY.setLocalScale(.8, .8, .8);
        planeY.setLocalPosition(-.4, 0, .4);
        planeY.mat = planeY.model.material = createMaterial(new pc.Color(0, 1, 0, .25));
        planeY.mat.cull = pc.CULLFACE_NONE;

        // plane z
        var planeZ = obj.plane.z = new pc.Entity();
        planeZ.name = "planeZ";
        obj.hoverable.push(planeZ);
        planeZ.axis = 'z';
        planeZ.plane = true;
        planeZ.addComponent('model', {
            type: 'plane',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [gizmoLayer]
        });
        planeZ.model.model.meshInstances[0].mask = GIZMO_MASK;
        entity.addChild(planeZ);
        planeZ.setLocalEulerAngles(90, 0, 0);
        planeZ.setLocalScale(.8, .8, .8);
        planeZ.setLocalPosition(-.4, .4, 0);
        planeZ.mat = planeZ.model.material = createMaterial(new pc.Color(0, 0, 1, .25));
        planeZ.mat.cull = pc.CULLFACE_NONE;

        // line x
        var lineX = obj.line.x = new pc.Entity();
        lineX.name = "lineX";
        obj.hoverable.push(lineX);
        lineX.axis = 'x';
        lineX.addComponent('model', {
            type: 'cylinder',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [gizmoLayer]
        });
        lineX.model.model.meshInstances[0].mask = GIZMO_MASK;
        entity.addChild(lineX);
        lineX.setLocalEulerAngles(90, 90, 0);
        lineX.setLocalPosition(1.6, 0, 0);
        lineX.setLocalScale(arrowRadius, .8, arrowRadius);
        lineX.mat = lineX.model.material = createMaterial(new pc.Color(1, 0, 0, 0));

        // line y
        var lineY = obj.line.y = new pc.Entity();
        lineY.name = "lineY";
        obj.hoverable.push(lineY);
        lineY.axis = 'y';
        lineY.addComponent('model', {
            type: 'cylinder',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [gizmoLayer]
        });
        lineY.model.model.meshInstances[0].mask = GIZMO_MASK;
        entity.addChild(lineY);
        lineY.setLocalEulerAngles(0, 0, 0);
        lineY.setLocalPosition(0, 1.6, 0);
        lineY.setLocalScale(arrowRadius, .8, arrowRadius);
        lineY.mat = lineY.model.material = createMaterial(new pc.Color(0, 1, 0, 0));

        // line z
        var lineZ = obj.line.z = new pc.Entity();
        lineZ.name = "lineZ";
        obj.hoverable.push(lineZ);
        lineZ.axis = 'z';
        lineZ.addComponent('model', {
            type: 'cylinder',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [gizmoLayer]
        });
        lineZ.model.model.meshInstances[0].mask = GIZMO_MASK;
        entity.addChild(lineZ);
        lineZ.setLocalEulerAngles(90, 0, 0);
        lineZ.setLocalPosition(0, 0, 1.6);
        lineZ.setLocalScale(arrowRadius, .8, arrowRadius);
        lineZ.mat = lineZ.model.material = createMaterial(new pc.Color(0, 0, 1, 0));

        // arrow x
        var arrowX = obj.arrow.x = new pc.Entity();
        arrowX.name = "arrowX";
        obj.hoverable.push(arrowX);
        arrowX.axis = 'x';
        arrowX.addComponent('model', {
            type: 'cone',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [gizmoLayer]
        });
        arrowX.model.model.meshInstances[0].mask = GIZMO_MASK;
        entity.addChild(arrowX);
        arrowX.setLocalEulerAngles(90, 90, 0);
        arrowX.setLocalPosition(2.3, 0, 0);
        arrowX.setLocalScale(arrowRadius, .6, arrowRadius);
        arrowX.mat = arrowX.model.material = createMaterial(new pc.Color(1, 0, 0, 1));

        // arrow y
        var arrowY = obj.arrow.y = new pc.Entity();
        arrowY.name = "arrowY";
        obj.hoverable.push(arrowY);
        arrowY.axis = 'y';
        arrowY.addComponent('model', {
            type: 'cone',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [gizmoLayer]
        });
        arrowY.model.model.meshInstances[0].mask = GIZMO_MASK;
        entity.addChild(arrowY);
        arrowY.setLocalEulerAngles(0, 0, 0);
        arrowY.setLocalPosition(0, 2.3, 0);
        arrowY.setLocalScale(arrowRadius, .6, arrowRadius);
        arrowY.mat = arrowY.model.material = createMaterial(new pc.Color(0, 1, 0, 1));

        // arrow z
        var arrowZ = obj.arrow.z = new pc.Entity();
        arrowZ.name = "arrowZ";
        obj.hoverable.push(arrowZ);
        arrowZ.axis = 'z';
        arrowZ.addComponent('model', {
            type: 'cone',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [gizmoLayer]
        });
        arrowZ.model.model.meshInstances[0].mask = GIZMO_MASK;
        entity.addChild(arrowZ);
        arrowZ.setLocalEulerAngles(90, 0, 0);
        arrowZ.setLocalPosition(0, 0, 2.3);
        arrowZ.setLocalScale(arrowRadius, .6, arrowRadius);
        arrowZ.mat = arrowZ.model.material = createMaterial(new pc.Color(0, 0, 1, 1));

        return obj;
    };
});
