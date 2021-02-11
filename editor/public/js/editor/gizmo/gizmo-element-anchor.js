editor.once('load', function () {
    'use strict';

    var vecA = new pc.Vec3();
    var vecB = new pc.Vec3();
    var vecC = new pc.Vec3();
    var vecD = new pc.Vec3();
    var quat = new pc.Quat();

    var gizmoAnchor = null;
    var evtTapStart = null;
    var moving = false;
    var mouseTap = null;
    var mouseTapMoved = false;
    var pickStart = new pc.Vec3();
    var posCameraLast = new pc.Vec3();
    var selectedEntity = null;
    var anchorDirty = false;
    var anchorStart = [];
    var anchorCurrent = [];
    var localPosition = [];
    var offset = new pc.Vec3();
    var visible = true;

    var createAnchorGizmo = function () {
        var obj = {
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

        var c = 0.8;
        obj.matInactive = createMaterial(new pc.Color(c, c, c, 0.5));
        obj.matActive = createMaterial(new pc.Color(c, c, c, 1));

        var layer = editor.call('gizmo:layers', 'Axis Gizmo');

        var createCone = function (angle) {
            var result = new pc.Entity();
            result.setLocalEulerAngles(0, 0, angle);
            obj.root.addChild(result);

            var cone = new pc.Entity();
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

    var createMaterial = function (color) {
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

    var setModelMaterial = function (entity, material) {
        if (entity.model.meshInstances[0].material !== material)
            entity.model.meshInstances[0].material = material;
    };

    editor.once('viewport:load', function (app) {
        var gizmoAnchor = createAnchorGizmo();
        app.root.addChild(gizmoAnchor.root);

        editor.on('selector:add', function (item, type) {
            if (type !== 'entity') return;

            if (! selectedEntity) {
                selectedEntity = item;
            }
        });

        editor.on('selector:remove', function (item, type) {
            if (selectedEntity === item) {
                selectedEntity = null;
            }
        });

        var isAnchorSplit = function (anchor) {
            return Math.abs(anchor[0] - anchor[2] > 0.001 || Math.abs(anchor[1] - anchor[3]) > 0.001);
        };

        var clamp = function (value, min, max) {
            return Math.min(Math.max(value, min), max);
        };

        var offsetAnchor = function (value, offset, min, max, snap) {
            value += offset;
            // value = Math.round(value / snap)  * snap;
            if (value < min + snap)
                value = min;
            else if (value > max - snap)
                value = max;
            return value;
        };

        var gizmoEnabled = function () {
            if (editor.call('selector:itemsRaw').length > 1)
                return false;

            return visible &&
                selectedEntity &&
                selectedEntity.has('components.element') &&
                editor.call('permissions:write') &&
                selectedEntity.entity &&
                selectedEntity.entity.element.screen;
        };

        editor.method('gizmo:anchor:visible', function (state) {
            if (visible !== state) {
                visible = state;

                editor.call('viewport:render');
            }
        });

        editor.on('viewport:gizmoUpdate', function (dt) {
            gizmoAnchor.root.enabled = gizmoEnabled();
            if (! gizmoAnchor.root.enabled)
                return;

            var entity = selectedEntity.entity;
            var parent = entity.parent && entity.parent.element ? entity.parent : entity.element.screen;


            var camera = editor.call('camera:current');
            var posCamera = camera.getPosition();

            gizmoAnchor.root.setPosition(parent.getPosition());
            gizmoAnchor.root.setRotation(parent.getRotation());

            // scale to screen space
            var scale = 1;
            var gizmoSize = 0.2;
            if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                var center = vecA;
                center.lerp(gizmoAnchor.handles.bl.getPosition(), gizmoAnchor.handles.tr.getPosition(), 0.5);
                var dot = center.sub(posCamera).dot(camera.forward);
                var denom = 1280 / (2 * Math.tan(camera.camera.fov * pc.math.DEG_TO_RAD / 2));
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
            var snapIncrement = 0.05 * scale;

            var resX, resY;
            if (parent === entity.element.screen) {
                resX = parent.screen.resolution.x;
                resY = parent.screen.resolution.y;

                if (parent.screen.scaleMode === 'blend') {
                    var resScale = parent.screen._calcScale(parent.screen.resolution, parent.screen.referenceResolution) || Number.MIN_VALUE;
                    resX /= resScale;
                    resY /= resScale;
                }
            } else {
                resX = parent.element.width;
                resY = parent.element.height;
            }

            var screenScale = entity.element.screen ? entity.element.screen.getLocalScale() : parent.getLocalScale();
            resX *= screenScale.x;
            resY *= screenScale.y;

            offset.set(0, 0, 0);
            if (moving && (vecA.copy(posCameraLast).sub(posCamera).length() > 0.01 || mouseTapMoved)) {
                offset = pickPlane(mouseTap.x, mouseTap.y);
                if (offset) {
                    offset.sub(pickStart);
                    anchorDirty = true;

                    for (let i = 0; i < 4; i++)
                        anchorCurrent[i] = anchorStart[i];

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

            var anchor = entity.element.anchor;

            var px = parent && parent.element ? parent.element.pivot.x : 0.5;
            var py = parent && parent.element ? parent.element.pivot.y : 0.5;

            gizmoAnchor.handles.tl.setLocalPosition(resX * (anchor.x - px), resY * (anchor.w - py), 0);
            gizmoAnchor.handles.tr.setLocalPosition(resX * (anchor.z - px), resY * (anchor.w - py), 0);
            gizmoAnchor.handles.bl.setLocalPosition(resX * (anchor.x - px), resY * (anchor.y - py), 0);
            gizmoAnchor.handles.br.setLocalPosition(resX * (anchor.z - px), resY * (anchor.y - py), 0);

            // gizmoAnchor.handles.center.setLocalPosition(resX * (pc.math.lerp(anchor.x,anchor.z,0.5) - 0.5), resY * (pc.math.lerp(anchor.y,anchor.w,0.5) - 0.5), 0, 0.1);
        });

        editor.on('viewport:pick:hover', function (node, picked) {
            if (! node || ! node.handle) {
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
                if (! gizmoAnchor.handle || gizmoAnchor.handle !== node.handle) {
                    gizmoAnchor.handle = node.handle;

                    for (const key in gizmoAnchor.handles) {
                        setModelMaterial(gizmoAnchor.handles[key].handleModel, gizmoAnchor.handles[key] === gizmoAnchor.handle ? gizmoAnchor.matActive : gizmoAnchor.matInactive);
                    }

                    if (! evtTapStart) {
                        evtTapStart = editor.on('viewport:tap:start', onTapStart);
                    }
                }
            }
        });

        var onTapStart = function (tap) {
            if (moving || tap.button !== 0)
                return;

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

        var onTapMove = function (tap) {
            if (! moving)
                return;

            mouseTap = tap;
            mouseTapMoved = true;
        };

        var onTapEnd = function (tap) {
            if (tap.button !== 0)
                return;

            editor.emit('camera:toggle', true);

            if (! moving)
                return;

            moving = false;
            mouseTap = tap;

            editor.call('gizmo:translate:visible', true);
            editor.call('gizmo:rotate:visible', true);
            editor.call('gizmo:scale:visible', true);
            editor.call('viewport:pick:state', true);

            // update entity anchor
            if (selectedEntity) {
                if (anchorDirty) {
                    var resourceId = selectedEntity.get('resource_id');
                    var previousAnchor = anchorStart.slice(0);
                    var newAnchor = anchorCurrent.slice(0);

                    editor.call('history:add', {
                        name: 'entity.element.anchor',
                        undo: function () {
                            var item = editor.call('entities:get', resourceId);
                            if (! item)
                                return;

                            var history = item.history.enabled;
                            item.history.enabled = false;
                            item.set('components.element.anchor', previousAnchor);
                            item.history.enabled = history;
                        },
                        redo: function () {
                            var item = editor.call('entities:get', resourceId);
                            if (! item)
                                return;

                            var history = item.history.enabled;
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
            var camera = editor.call('camera:current');

            var mouseWPos = camera.camera.screenToWorld(x, y, camera.camera.farClip);
            var posGizmo = gizmoAnchor.root.getPosition();
            var rayOrigin = vecA.copy(camera.getPosition());
            var rayDirection = vecB.set(0, 0, 0);

            vecC.copy(gizmoAnchor.root.forward);
            var planeNormal = vecC.scale(-1);

            if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                rayDirection.copy(mouseWPos).sub(rayOrigin).normalize();
            } else {
                rayOrigin.add(mouseWPos);
                camera.getWorldTransform().transformVector(vecD.set(0, 0, -1), rayDirection);
            }

            var rayPlaneDot = planeNormal.dot(rayDirection);
            var planeDist = posGizmo.dot(planeNormal);
            var pointPlaneDist = (planeNormal.dot(rayOrigin) - planeDist) / rayPlaneDot;
            var pickedPos = rayDirection.scale(-pointPlaneDist).add(rayOrigin);

            // convert pickedPos to local position relative to the gizmo
            quat.copy(gizmoAnchor.root.getRotation()).invert().transformVector(pickedPos, pickedPos);

            return pickedPos;
        };

        editor.on('viewport:tap:move', onTapMove);
        editor.on('viewport:tap:end', onTapEnd);

    });
});
