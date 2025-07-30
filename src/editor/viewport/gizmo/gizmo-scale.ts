import { GIZMO_MASK } from '../../../core/constants.ts';
import { createColorMaterial } from '../viewport-color-material.ts';

editor.once('load', () => {
    let gizmo = null;
    let visible = true;
    let moving = false;
    let mouseTap = null;
    let enabled = false;
    let hover = false;
    let hoverAxis = '';
    let hoverMiddle = false;
    const gizmoSize = 0.4;
    const vecA = new pc.Vec3();
    const vecB = new pc.Vec3();
    const vecC = new pc.Vec3();
    const vecD = new pc.Vec3();
    const vecE = new pc.Vec3();
    const quat = new pc.Quat();
    let evtTapStart;
    const pickStart = new pc.Vec3();

    const createMaterial = function (color) {
        const mat = createColorMaterial();
        mat.color = color;
        if (color.a !== 1) {
            mat.blendState = new pc.BlendState(true, pc.BLENDEQUATION_ADD, pc.BLENDMODE_SRC_ALPHA, pc.BLENDMODE_ONE_MINUS_SRC_ALPHA);
        }
        mat.cull = pc.CULLFACE_NONE;
        mat.update();
        return mat;
    };

    const createEntity = function () {
        const boxSize = 0.4;

        const obj = {
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
            hoverable: [],
            matActive: null,
            matActiveTransparent: null
        };

        // active mat
        obj.matActive = createMaterial(new pc.Color(1, 1, 1, 0.9)); // this has to be transparent otherwise it flickers when you hover over it
        obj.matActiveTransparent = createMaterial(new pc.Color(1, 1, 1, 0.25));
        obj.colorLineBehind = new pc.Color(1, 1, 1, 0.05);
        obj.colorLine = new pc.Color(1, 1, 1, 0.2);
        obj.colorLineActive = new pc.Color(1, 1, 1, 1);

        const layer = editor.call('gizmo:layers', 'Axis Gizmo').id;

        // root entity
        const entity = obj.root = new pc.Entity();

        // middle
        const middle = obj.middle = new pc.Entity();
        obj.hoverable.push(middle);
        middle.axis = 'xyz';
        middle.middle = true;
        middle.addComponent('model', {
            type: 'box',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [layer]
        });
        middle.model.model.meshInstances[0].mask = GIZMO_MASK;
        middle.model.material.id = 0xFFFFFFFF;
        entity.addChild(middle);
        middle.setLocalScale(boxSize * 1.5, boxSize * 1.5, boxSize * 1.5);
        middle.mat = middle.model.material = createMaterial(new pc.Color(1.0, 1.0, 1.0, 0.25));
        middle.mat.depthTest = false;

        // line x
        const lineX = obj.line.x = new pc.Entity();
        obj.hoverable.push(lineX);
        lineX.axis = 'x';
        lineX.addComponent('model', {
            type: 'cylinder',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [layer]
        });
        entity.addChild(lineX);
        lineX.setLocalEulerAngles(90, 90, 0);
        lineX.setLocalPosition(1.25, 0, 0);
        lineX.setLocalScale(boxSize, 1.5, boxSize);
        lineX.mat = lineX.model.material = createMaterial(new pc.Color(1, 0, 0, 0));

        // line y
        const lineY = obj.line.y = new pc.Entity();
        obj.hoverable.push(lineY);
        lineY.axis = 'y';
        lineY.addComponent('model', {
            type: 'cylinder',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [layer]
        });
        entity.addChild(lineY);
        lineY.setLocalEulerAngles(0, 0, 0);
        lineY.setLocalPosition(0, 1.25, 0);
        lineY.setLocalScale(boxSize, 1.5, boxSize);
        lineY.mat = lineY.model.material = createMaterial(new pc.Color(0, 1, 0, 0));

        // line z
        const lineZ = obj.line.z = new pc.Entity();
        obj.hoverable.push(lineZ);
        lineZ.axis = 'z';
        lineZ.addComponent('model', {
            type: 'cylinder',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [layer]
        });
        entity.addChild(lineZ);
        lineZ.setLocalEulerAngles(90, 0, 0);
        lineZ.setLocalPosition(0, 0, 1.25);
        lineZ.setLocalScale(boxSize, 1.5, boxSize);
        lineZ.mat = lineZ.model.material = createMaterial(new pc.Color(0, 0, 1, 0));

        // box x
        const boxX = obj.box.x = new pc.Entity();
        obj.hoverable.push(boxX);
        boxX.axis = 'x';
        boxX.addComponent('model', {
            type: 'box',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [layer]
        });
        boxX.model.model.meshInstances[0].mask = GIZMO_MASK;
        entity.addChild(boxX);
        boxX.setLocalPosition(2.2, 0, 0);
        boxX.setLocalScale(boxSize, boxSize, boxSize);
        boxX.mat = boxX.model.material = createMaterial(new pc.Color(1, 0, 0, 1.1));
        boxX.color = new pc.Color(1, 0, 0, 1);

        // box y
        const boxY = obj.box.y = new pc.Entity();
        obj.hoverable.push(boxY);
        boxY.axis = 'y';
        boxY.addComponent('model', {
            type: 'box',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [layer]
        });
        boxY.model.model.meshInstances[0].mask = GIZMO_MASK;
        entity.addChild(boxY);
        boxY.setLocalPosition(0, 2.2, 0);
        boxY.setLocalScale(boxSize, boxSize, boxSize);
        boxY.mat = boxY.model.material = createMaterial(new pc.Color(0, 1, 0, 1.1));
        boxY.color = new pc.Color(0, 1, 0, 1);

        // box z
        const boxZ = obj.box.z = new pc.Entity();
        obj.hoverable.push(boxZ);
        boxZ.axis = 'z';
        boxZ.addComponent('model', {
            type: 'box',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [layer]
        });
        boxZ.model.model.meshInstances[0].mask = GIZMO_MASK;
        entity.addChild(boxZ);
        boxZ.setLocalPosition(0, 0, 2.2);
        boxZ.setLocalScale(boxSize, boxSize, boxSize);
        boxZ.mat = boxZ.model.material = createMaterial(new pc.Color(0, 0, 1, 1.1));
        boxZ.color = new pc.Color(0, 0, 1, 1);

        return obj;
    };

    const pickPlane = function (x, y) {
        const camera = editor.call('camera:current');
        let scale = 1;
        const mouseWPos = camera.camera.screenToWorld(x, y, 1);
        const posGizmo = gizmo.root.getPosition();
        const rayOrigin = vecA.copy(camera.getPosition());
        const rayDirection = vecB;
        const planeNormal = vecC;

        if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
            rayDirection.copy(mouseWPos).sub(rayOrigin).normalize();
            const dot = vecC.copy(posGizmo).sub(rayOrigin).dot(camera.forward);
            const denom = 1280 * Math.tan(camera.camera.fov * pc.math.DEG_TO_RAD);
            scale = Math.max(0.0001, (dot / denom) * 150) * gizmoSize;
        } else {
            rayOrigin.add(mouseWPos);
            camera.getWorldTransform().transformVector(vecD.set(0, 0, -1), rayDirection);
            scale = camera.camera.orthoHeight / 3 * gizmoSize;
        }

        quat.copy(gizmo.root.getRotation());

        // single axis
        if (!hoverMiddle) {
            // vector based on selected axis
            planeNormal.set(0, 0, 0);
            planeNormal[hoverAxis] = 1;
            // rotate vector by gizmo rotation
            quat.transformVector(planeNormal, planeNormal);

            vecE.copy(rayOrigin).sub(posGizmo).normalize();
            planeNormal.copy(vecE.sub(planeNormal.scale(planeNormal.dot(vecE))).normalize());
        } else {
            planeNormal.copy(rayOrigin).sub(posGizmo).normalize();
        }

        const rayPlaneDot = planeNormal.dot(rayDirection);
        const planeDist = posGizmo.dot(planeNormal);
        const pointPlaneDist = (planeNormal.dot(rayOrigin) - planeDist) / rayPlaneDot;
        const pickedPos = rayDirection.scale(-pointPlaneDist).add(rayOrigin);

        if (!hoverMiddle) {
            // single axis
            planeNormal.set(0, 0, 0);
            planeNormal[hoverAxis] = 1;
            quat.transformVector(planeNormal, planeNormal);
            pickedPos.copy(planeNormal.scale(planeNormal.dot(pickedPos)));
            quat.invert().transformVector(pickedPos, pickedPos);

            // calculate viewing angle
            vecE.copy(rayOrigin).sub(posGizmo).normalize();
            quat.transformVector(vecE, vecE);

            const v = pickedPos[hoverAxis];
            pickedPos.set(0, 0, 0);
            pickedPos[hoverAxis] = v / scale;
        } else {
            vecE.copy(pickedPos).sub(posGizmo).normalize();
            vecD.copy(camera.up).add(camera.right).normalize();

            const v = (pickedPos.sub(posGizmo).length() / scale / 2)  * vecE.dot(vecD);
            pickedPos.set(v, v, v);
        }

        return pickedPos;
    };

    const onTapStart = function (tap) {
        if (tap.button !== 0) {
            return;
        }

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
        editor.call('viewport:pick:state', false);
    };

    const onTapMove = function (tap) {
        if (!moving) {
            return;
        }

        mouseTap = tap;
    };

    const onTapEnd = function (tap) {
        if (tap.button !== 0) {
            return;
        }

        editor.emit('camera:toggle', true);

        if (!moving) {
            return;
        }

        moving = false;
        mouseTap = tap;

        editor.emit('gizmo:scale:end');
        editor.call('gizmo:scale:visible', true);
        editor.call('viewport:pick:state', true);
    };

    let snap = false;
    let snapIncrement = 1;
    editor.on('gizmo:snap', (state, increment) => {
        snap = state;
        snapIncrement = increment;
    });

    // enable/disable gizmo
    editor.method('gizmo:scale:toggle', (state) => {
        if (!gizmo) {
            return;
        }

        gizmo.root.enabled = state && editor.call('permissions:write');
        enabled = state;

        visible = true;
    });

    editor.on('permissions:writeState', (state) => {
        if (!gizmo) {
            return;
        }

        gizmo.root.enabled = enabled && state;
        editor.call('viewport:render');
    });

    // show/hide gizmo
    editor.method('gizmo:scale:visible', (state) => {
        if (!gizmo) {
            return;
        }

        visible = state;

        for (let i = 0; i < gizmo.hoverable.length; i++) {
            if (!gizmo.hoverable[i].model) {
                continue;
            }

            gizmo.hoverable[i].model.enabled = state;
        }

        editor.call('viewport:render');
    });

    // position gizmo
    editor.method('gizmo:scale:position', (x, y, z) => {
        gizmo.root.setPosition(x, y, z);

        if (gizmo.root.enabled) {
            editor.call('viewport:render');
        }
    });

    // rotate gizmo
    editor.method('gizmo:scale:rotation', (pitch, yaw, roll) => {
        gizmo.root.setEulerAngles(pitch, yaw, roll);

        if (gizmo.root.enabled) {
            editor.call('viewport:render');
        }
    });

    // initialize gizmo
    editor.once('viewport:load', (app) => {
        gizmo = createEntity();
        gizmo.root.enabled = false;
        app.root.addChild(gizmo.root);

        // on picker hover
        editor.on('viewport:pick:hover', (node, picked) => {
            const match = gizmo.hoverable.indexOf(node) !== -1;
            if (!hover && match) {
                // hover
                hover = true;
            } else if (hover && !match) {
                // unhover
                hover = false;
            }

            if (hover) {
                if (node.axis && hoverAxis !== node.axis) {
                    // set normal material
                    if (hoverAxis) {
                        if (hoverMiddle) {
                            gizmo.box.x.model.material = gizmo.box.x.mat;
                            gizmo.box.y.model.material = gizmo.box.y.mat;
                            gizmo.box.z.model.material = gizmo.box.z.mat;
                        } else {
                            gizmo.box[hoverAxis].model.material = gizmo.box[hoverAxis].mat;
                        }
                    }

                    if (!hoverAxis && !evtTapStart) {
                        evtTapStart = editor.on('viewport:tap:start', onTapStart);
                    }

                    hoverAxis = node.axis;
                    hoverMiddle = node.middle;

                    // set active material
                    if (hoverMiddle) {
                        gizmo.box.x.model.material = gizmo.matActive;
                        gizmo.box.y.model.material = gizmo.matActive;
                        gizmo.box.z.model.material = gizmo.matActive;
                    } else {
                        gizmo.box[hoverAxis].model.material = gizmo.matActive;
                    }
                }
            } else {
                if (hoverAxis) {
                    if (hoverMiddle) {
                        gizmo.box.x.model.material = gizmo.box.x.mat;
                        gizmo.box.y.model.material = gizmo.box.y.mat;
                        gizmo.box.z.model.material = gizmo.box.z.mat;
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
        editor.on('viewport:postUpdate', (dt) => {
            if (gizmo.root.enabled) {
                editor.emit('gizmo:scale:render', dt);

                if (moving) {
                    const point = pickPlane(mouseTap.x, mouseTap.y);
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

                    editor.call('viewport:render');
                }

                const camera = editor.call('camera:current');

                const posCamera = camera.getPosition();
                const posGizmo = gizmo.root.getPosition();
                let scale = 1;

                // scale to screen space
                if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                    const dot = vecA.copy(posGizmo).sub(posCamera).dot(camera.forward);
                    const denom = 1280 / (2 * Math.tan(camera.camera.fov * pc.math.DEG_TO_RAD / 2));
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
                gizmo.line.x.model.enabled = gizmo.box.x.model.enabled = !(Math.abs(vecA.z) <= 0.15 && Math.abs(vecA.y) <= 0.15) && visible;
                gizmo.line.y.model.enabled = gizmo.box.y.model.enabled = !(Math.abs(vecA.x) <= 0.15 && Math.abs(vecA.z) <= 0.15) && visible;
                gizmo.line.z.model.enabled = gizmo.box.z.model.enabled = !(Math.abs(vecA.x) <= 0.15 && Math.abs(vecA.y) <= 0.15) && visible;

                const layer = editor.call('gizmo:layers', 'Axis Gizmo Immediate');

                // draw axes lines
                // line x
                if (gizmo.line.x.model.enabled) {
                    vecB.set(scale * 0.5, 0, 0);
                    quat.transformVector(vecB, vecB).add(posGizmo);
                    vecC.set(scale * 2, 0, 0);
                    quat.transformVector(vecC, vecC).add(posGizmo);
                    const color = gizmo.box.x.model.material === gizmo.matActive ? gizmo.matActive.color : gizmo.box.x.color;
                    app.drawLine(vecB, vecC, color, true, layer);
                }
                // line y
                if (gizmo.line.y.model.enabled) {
                    vecB.set(0, scale * 0.5, 0);
                    quat.transformVector(vecB, vecB).add(posGizmo);
                    vecC.set(0, scale * 2, 0);
                    quat.transformVector(vecC, vecC).add(posGizmo);
                    const color = gizmo.box.y.model.material === gizmo.matActive ? gizmo.matActive.color : gizmo.box.y.color;
                    app.drawLine(vecB, vecC, color, true, layer);
                }
                // line z
                if (gizmo.line.z.model.enabled) {
                    vecB.set(0, 0, scale * 0.5);
                    quat.transformVector(vecB, vecB).add(posGizmo);
                    vecC.set(0, 0, scale * 2);
                    quat.transformVector(vecC, vecC).add(posGizmo);
                    const color = gizmo.box.z.model.material === gizmo.matActive ? gizmo.matActive.color : gizmo.box.z.color;
                    app.drawLine(vecB, vecC, color, true, layer);
                }
            }
        });

        editor.on('viewport:mouse:move', onTapMove);
        editor.on('viewport:tap:end', onTapEnd);
    });
});
