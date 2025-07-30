import { GIZMO_MASK } from '../../../core/constants.ts';
import { createColorMaterial } from '../viewport-color-material.ts';

editor.once('load', () => {
    const vecA = new pc.Vec3();
    const vecB = new pc.Vec3();
    const vecC = new pc.Vec3();
    const vecD = new pc.Vec3();
    const quat = new pc.Quat();

    const gizmoAnchor = null; // eslint-disable-line no-unused-vars
    let evtTapStart = null;
    let moving = false;
    let mouseTap = null;
    let mouseTapMoved = false;
    const pickStart = new pc.Vec3();
    const posCameraLast = new pc.Vec3();
    let selectedEntity = null;
    let anchorDirty = false;
    let anchorStart = [];
    const anchorCurrent = [];
    const localPosition = []; // eslint-disable-line no-unused-vars
    let offset = new pc.Vec3();
    let visible = true;

    const createAnchorGizmo = function () {
        const obj = {
            root: null,
            handles: {
                tl: null,
                tr: null,
                bl: null,
                br: null
                // center: null
            },
            matActive: null,
            matInactive: null,
            handle: null
        };

        obj.root = new pc.Entity();
        obj.root.enabled = false;

        const c = 0.8;
        obj.matInactive = createMaterial(new pc.Color(c, c, c, 0.5));
        obj.matActive = createMaterial(new pc.Color(c, c, c, 1));

        const layer = editor.call('gizmo:layers', 'Axis Gizmo');

        const createCone = function (angle) {
            const result = new pc.Entity();
            result.setLocalEulerAngles(0, 0, angle);
            obj.root.addChild(result);

            const cone = new pc.Entity();
            cone.addComponent('model', {
                type: 'cone',
                layers: [layer.id]
            });
            cone.model.castShadows = false;
            cone.model.receiveShadows = false;
            cone.model.meshInstances[0].material = obj.matInactive;
            cone.model.meshInstances[0].mask = GIZMO_MASK;
            cone.setLocalPosition(0, -0.5, 0);
            cone.setLocalScale(1, 1, 0.01);
            cone.handle = result;
            result.addChild(cone);

            result.handleModel = cone;

            return result;
        };

        obj.handles.tl = createCone(230);
        obj.handles.tr = createCone(130);
        obj.handles.bl = createCone(130 + 180);
        obj.handles.br = createCone(230 + 180);

        // obj.handles.center = new pc.Entity();
        // var sphere = new pc.Entity();
        // obj.handles.center.addChild(sphere);
        // sphere.addComponent('model', {type: 'sphere'});
        // sphere.model.castShadows = false;
        // sphere.model.receiveShadows = false;
        // sphere.model.meshInstances[0].material = obj.matInactive;
        // sphere.setLocalPosition(0,0,0.1);
        // sphere.setLocalScale(0.5, 0.5, 0.5);
        // sphere.handle = obj.handles.center;
        // obj.handles.center.handleModel = sphere;
        // obj.root.addChild(obj.handles.center);

        return obj;
    };

    const createMaterial = function (color) {
        const mat = createColorMaterial();
        mat.color = color;
        if (color.a !== 1) {
            mat.blendState = new pc.BlendState(true, pc.BLENDEQUATION_ADD, pc.BLENDMODE_SRC_ALPHA, pc.BLENDMODE_ONE_MINUS_SRC_ALPHA);
        }
        mat.update();
        return mat;
    };

    const setModelMaterial = function (entity, material) {
        if (entity.model.meshInstances[0].material !== material) {
            entity.model.meshInstances[0].material = material;
        }
    };

    editor.once('viewport:load', (app) => {
        const gizmoAnchor = createAnchorGizmo();
        app.root.addChild(gizmoAnchor.root);

        editor.on('selector:add', (item, type) => {
            if (type !== 'entity') return;

            if (!selectedEntity) {
                selectedEntity = item;
            }
        });

        editor.on('selector:remove', (item, type) => {
            if (selectedEntity === item) {
                selectedEntity = null;
            }
        });

        const isAnchorSplit = function (anchor) { // eslint-disable-line no-unused-vars
            return Math.abs(anchor[0] - anchor[2] > 0.001 || Math.abs(anchor[1] - anchor[3]) > 0.001);
        };

        const clamp = function (value, min, max) { // eslint-disable-line no-unused-vars
            return Math.min(Math.max(value, min), max);
        };

        const offsetAnchor = function (value, offset, min, max, snap) {
            if (!isFinite(offset)) {
                return value;
            }

            value += offset;
            // value = Math.round(value / snap)  * snap;
            if (value < min + snap) {
                value = min;
            } else if (value > max - snap) {
                value = max;
            }
            return value;
        };

        const gizmoEnabled = function () {
            if (editor.api.globals.selection.items.length > 1) {
                return false;
            }

            return visible &&
                selectedEntity &&
                selectedEntity.has('components.element') &&
                editor.call('permissions:write') &&
                selectedEntity.entity &&
                selectedEntity.entity.element.screen;
        };

        editor.method('gizmo:anchor:visible', (state) => {
            if (visible !== state) {
                visible = state;

                editor.call('viewport:render');
            }
        });

        editor.on('viewport:gizmoUpdate', (dt) => {
            gizmoAnchor.root.enabled = gizmoEnabled();
            if (!gizmoAnchor.root.enabled) {
                return;
            }

            const entity = selectedEntity.entity;
            const parent = entity.parent && entity.parent.element ? entity.parent : entity.element.screen;


            const camera = editor.call('camera:current');
            const posCamera = camera.getPosition();

            gizmoAnchor.root.setPosition(parent.getPosition());
            gizmoAnchor.root.setRotation(parent.getRotation());

            // scale to screen space
            let scale = 1;
            const gizmoSize = 0.2;
            if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                const center = vecA;
                center.lerp(gizmoAnchor.handles.bl.getPosition(), gizmoAnchor.handles.tr.getPosition(), 0.5);
                const dot = center.sub(posCamera).dot(camera.forward);
                const denom = 1280 / (2 * Math.tan(camera.camera.fov * pc.math.DEG_TO_RAD / 2));
                scale = Math.max(0.0001, (dot / denom) * 150) * gizmoSize;
            } else {
                scale = camera.camera.orthoHeight / 3 * gizmoSize;
            }

            gizmoAnchor.handles.tr.setLocalScale(scale, scale, scale);
            gizmoAnchor.handles.tl.setLocalScale(scale, scale, scale);
            gizmoAnchor.handles.br.setLocalScale(scale, scale, scale);
            gizmoAnchor.handles.bl.setLocalScale(scale, scale, scale);
            // gizmoAnchor.handles.center.setLocalScale(scale, scale, scale);

            // scale snap by gizmo scale
            const snapIncrement = 0.05 * scale;

            let resX, resY;
            if (parent === entity.element.screen) {
                resX = parent.screen.resolution.x;
                resY = parent.screen.resolution.y;

                if (parent.screen.scaleMode === 'blend') {
                    const resScale = parent.screen._calcScale(parent.screen.resolution, parent.screen.referenceResolution) || Number.MIN_VALUE;
                    resX /= resScale;
                    resY /= resScale;
                }
            } else {
                resX = parent.element.calculatedWidth;
                resY = parent.element.calculatedHeight;
            }

            const screenScale = entity.element.screen ? entity.element.screen.getLocalScale() : parent.getLocalScale();
            resX *= screenScale.x;
            resY *= screenScale.y;

            offset.set(0, 0, 0);
            if (moving && (vecA.copy(posCameraLast).sub(posCamera).length() > 0.01 || mouseTapMoved)) {
                offset = pickPlane(mouseTap.x, mouseTap.y);
                if (offset) {
                    offset.sub(pickStart);
                    anchorDirty = true;

                    for (let i = 0; i < 4; i++) {
                        anchorCurrent[i] = anchorStart[i];
                    }

                    if (gizmoAnchor.handle === gizmoAnchor.handles.tr || gizmoAnchor.handle === gizmoAnchor.handles.tl) {
                        anchorCurrent[3] = offsetAnchor(anchorCurrent[3], offset.y / resY, anchorCurrent[1], 1, snapIncrement);
                        if (gizmoAnchor.handle === gizmoAnchor.handles.tr) {
                            anchorCurrent[2] = offsetAnchor(anchorCurrent[2], offset.x / resX, anchorCurrent[0], 1, snapIncrement);
                        } else {
                            anchorCurrent[0] = offsetAnchor(anchorCurrent[0], offset.x / resX, 0, anchorCurrent[2], snapIncrement);
                        }
                    } else if (gizmoAnchor.handle === gizmoAnchor.handles.br || gizmoAnchor.handle === gizmoAnchor.handles.bl) {
                        anchorCurrent[1] = offsetAnchor(anchorCurrent[1], offset.y / resY, 0, anchorCurrent[3], snapIncrement);
                        if (gizmoAnchor.handle === gizmoAnchor.handles.br) {
                            anchorCurrent[2] = offsetAnchor(anchorCurrent[2], offset.x / resX, anchorCurrent[0], 1, snapIncrement);
                        } else {
                            anchorCurrent[0] = offsetAnchor(anchorCurrent[0], offset.x / resX, 0, anchorCurrent[2], snapIncrement);
                        }
                    }
                    // else if (gizmoAnchor.handle === gizmoAnchor.handles.center) {
                    //     var dx = anchorCurrent[2] - anchorCurrent[0];
                    //     var dy = anchorCurrent[3] - anchorCurrent[1];

                    //     anchorCurrent[0] = clamp(anchorCurrent[0] + offset.x / resX, 0, 1 - dx);
                    //     anchorCurrent[2] = clamp(anchorCurrent[2] + offset.x / resX, dx, 1);
                    //     anchorCurrent[1] = clamp(anchorCurrent[1] + offset.y / resY, 0, 1 - dy);
                    //     anchorCurrent[3] = clamp(anchorCurrent[3] + offset.y / resY, dy, 1);
                    // }

                    selectedEntity.set('components.element.anchor', anchorCurrent);
                }

                editor.call('viewport:render');
            }

            posCameraLast.copy(posCamera);
            mouseTapMoved = false;

            const anchor = entity.element.anchor;

            const px = parent && parent.element ? parent.element.pivot.x : 0.5;
            const py = parent && parent.element ? parent.element.pivot.y : 0.5;

            gizmoAnchor.handles.tl.setLocalPosition(resX * (anchor.x - px), resY * (anchor.w - py), 0);
            gizmoAnchor.handles.tr.setLocalPosition(resX * (anchor.z - px), resY * (anchor.w - py), 0);
            gizmoAnchor.handles.bl.setLocalPosition(resX * (anchor.x - px), resY * (anchor.y - py), 0);
            gizmoAnchor.handles.br.setLocalPosition(resX * (anchor.z - px), resY * (anchor.y - py), 0);

            // gizmoAnchor.handles.center.setLocalPosition(resX * (pc.math.lerp(anchor.x,anchor.z,0.5) - 0.5), resY * (pc.math.lerp(anchor.y,anchor.w,0.5) - 0.5), 0, 0.1);
        });

        editor.on('viewport:pick:hover', (node, picked) => {
            if (!node || !node.handle) {
                if (gizmoAnchor.handle) {
                    gizmoAnchor.handle = null;

                    for (const key in gizmoAnchor.handles) {
                        setModelMaterial(gizmoAnchor.handles[key].handleModel, gizmoAnchor.matInactive);
                    }

                    if (evtTapStart) {
                        evtTapStart.unbind();
                        evtTapStart = null;
                    }
                }
            } else {
                if (!gizmoAnchor.handle || gizmoAnchor.handle !== node.handle) {
                    gizmoAnchor.handle = node.handle;

                    for (const key in gizmoAnchor.handles) {
                        setModelMaterial(gizmoAnchor.handles[key].handleModel, gizmoAnchor.handles[key] === gizmoAnchor.handle ? gizmoAnchor.matActive : gizmoAnchor.matInactive);
                    }

                    if (!evtTapStart) {
                        evtTapStart = editor.on('viewport:tap:start', onTapStart);
                    }
                }
            }
        });

        var onTapStart = function (tap) {
            if (moving || tap.button !== 0) {
                return;
            }

            editor.emit('camera:toggle', false);
            editor.call('viewport:pick:state', false);

            moving = true;
            mouseTap = tap;
            anchorDirty = false;

            if (gizmoAnchor.root.enabled) {
                pickStart.copy(pickPlane(tap.x, tap.y));
            }

            if (selectedEntity) {
                selectedEntity.history.enabled = false;

                anchorStart = selectedEntity.get('components.element.anchor').slice(0);
            }

            editor.call('gizmo:translate:visible', false);
            editor.call('gizmo:rotate:visible', false);
            editor.call('gizmo:scale:visible', false);
        };

        const onTapMove = function (tap) {
            if (!moving) {
                return;
            }

            mouseTap = tap;
            mouseTapMoved = true;
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

            editor.call('gizmo:translate:visible', true);
            editor.call('gizmo:rotate:visible', true);
            editor.call('gizmo:scale:visible', true);
            editor.call('viewport:pick:state', true);

            // update entity anchor
            if (selectedEntity) {
                if (anchorDirty) {
                    const resourceId = selectedEntity.get('resource_id');
                    const previousAnchor = anchorStart.slice(0);
                    const newAnchor = anchorCurrent.slice(0);

                    editor.api.globals.history.add({
                        name: 'entity.element.anchor',
                        combine: false,
                        undo: function () {
                            const item = editor.call('entities:get', resourceId);
                            if (!item) {
                                return;
                            }

                            const history = item.history.enabled;
                            item.history.enabled = false;
                            item.set('components.element.anchor', previousAnchor);
                            item.history.enabled = history;
                        },
                        redo: function () {
                            const item = editor.call('entities:get', resourceId);
                            if (!item) {
                                return;
                            }

                            const history = item.history.enabled;
                            item.history.enabled = false;
                            item.set('components.element.anchor', newAnchor);
                            item.history.enabled = history;
                        }
                    });
                }

                selectedEntity.history.enabled = true;
            }
        };

        var pickPlane = function (x, y) {
            const camera = editor.call('camera:current');

            const mouseWPos = camera.camera.screenToWorld(x, y, camera.camera.farClip);
            const posGizmo = gizmoAnchor.root.getPosition();
            const rayOrigin = vecA.copy(camera.getPosition());
            const rayDirection = vecB.set(0, 0, 0);

            vecC.copy(gizmoAnchor.root.forward);
            const planeNormal = vecC.scale(-1);

            if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                rayDirection.copy(mouseWPos).sub(rayOrigin).normalize();
            } else {
                rayOrigin.add(mouseWPos);
                camera.getWorldTransform().transformVector(vecD.set(0, 0, -1), rayDirection);
            }

            const rayPlaneDot = planeNormal.dot(rayDirection);
            const planeDist = posGizmo.dot(planeNormal);
            const pointPlaneDist = (planeNormal.dot(rayOrigin) - planeDist) / rayPlaneDot;
            const pickedPos = rayDirection.scale(-pointPlaneDist).add(rayOrigin);

            // convert pickedPos to local position relative to the gizmo
            quat.copy(gizmoAnchor.root.getRotation()).invert().transformVector(pickedPos, pickedPos);

            return pickedPos;
        };

        editor.on('viewport:tap:move', onTapMove);
        editor.on('viewport:tap:end', onTapEnd);

    });
});
