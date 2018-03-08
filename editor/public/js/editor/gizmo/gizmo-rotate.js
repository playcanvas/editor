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
    var hoverEntity = null;
    var gizmoSize = .4;
    var arrowRadius = .4;
    var vecA = new pc.Vec3();
    var vecB = new pc.Vec3();
    var vecC = new pc.Vec3();
    var vecD = new pc.Vec3();
    var quat = new pc.Quat();
    var evtTapStart;
    var angleStart = 0;
    var startRotation = new pc.Quat();

    var immediateRenderOptions;
    var noDepthImmediateRenderOptions

    var snap = false;
    var snapIncrement = 5;
    editor.on('gizmo:snap', function(state, increment) {
        snap = state;
        snapIncrement = increment * 5;
    });

    // enable/disable gizmo
    editor.method('gizmo:rotate:toggle', function(state) {
        if (! gizmo)
            return;

        gizmo.root.enabled = state && editor.call('permissions:write');
        enabled = state;

        visible = true;

        editor.call('viewport:render');
    });

    editor.on('permissions:writeState', function(state) {
        if (! gizmo)
            return;

        gizmo.root.enabled = enabled && state;
        editor.call('viewport:render');
    });

    // show/hide gizmo
    editor.method('gizmo:rotate:visible', function(state) {
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
    editor.method('gizmo:rotate:position', function(x, y, z) {
        if (x === undefined)
            return gizmo.root.getPosition();

        gizmo.root.setPosition(x, y, z);

        if (gizmo.root.enabled)
            editor.call('viewport:render');
    });

    // rotate gizmo
    editor.method('gizmo:rotate:rotation', function(pitch, yaw, roll) {
        gizmo.root.setEulerAngles(pitch, yaw, roll);

        if (gizmo.root.enabled)
            editor.call('viewport:render');
    });

    // initialize gizmo
    editor.once('viewport:load', function() {
        var app = editor.call('viewport:app');
        if (! app) return; // webgl not available

        gizmo = createEntity(app);
        gizmo.root.enabled = false;
        app.root.addChild(gizmo.root);

        immediateRenderOptions = {
            layer: editor.call('gizmo:layers', 'Axis Gizmo Immediate'),
            mask: GIZMO_MASK
        };

        noDepthImmediateRenderOptions = {
            layer: editor.call('gizmo:layers', 'Axis Rotate Gizmo Immediate'),
            depthTest: false,
            mask: GIZMO_MASK
        };

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
                    if (hoverAxis)
                        gizmo.line[hoverAxis].material = gizmo.line[hoverAxis].mat;

                    if (! hoverAxis && ! evtTapStart)
                        evtTapStart = editor.on('viewport:tap:start', onTapStart);

                    hoverAxis = node.axis;
                    console.log(hoverAxis);

                    // set active material
                    gizmo.line[hoverAxis].material = gizmo.matActive;
                }
            } else {
                if (hoverAxis) {
                    gizmo.line[hoverAxis].material = gizmo.line[hoverAxis].mat;
                }

                hoverAxis = '';

                if (evtTapStart) {
                    evtTapStart.unbind();
                    evtTapStart = null;
                }
            }
        });

        var lastPoint = new pc.Vec3();

        // update gizmo
        editor.on('viewport:postUpdate', function(dt) {
            if (gizmo.root.enabled) {
                var camera = editor.call('camera:current');
                var posCamera = camera.getPosition();

                if (moving && (vecA.copy(posCameraLast).sub(posCamera).length() > 0.01 || mouseTapMoved)) {
                    var data = pickPlane(mouseTap.x, mouseTap.y);
                    lastPoint.copy(data.point);

                    if (snap) {
                        data.angle = Math.round((data.angle - angleStart) / snapIncrement) * snapIncrement;
                    } else {
                        data.angle -= angleStart;
                    }

                    editor.emit('gizmo:rotate:offset', data.angle, data.point);

                    editor.call('viewport:render');
                }

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

                if (moving && lastPoint) {
                    vecC.copy(lastPoint).normalize().scale(2 * scale);
                    quat.copy(startRotation).transformVector(vecC, vecC);
                    // quat.invert().transformVector(vecC, vecC);
                    vecC.add(posGizmo);

                    app.renderLine(posGizmo, vecC, gizmo.colorActive, noDepthImmediateRenderOptions);
                }

                editor.emit('gizmo:rotate:render', dt);

                posCameraLast.copy(posCamera);

                // posGizmo = gizmo.root.getPosition();

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

                // hide plane if viewed from very angle
                gizmo.plane.x.model.enabled = Math.abs(vecA.x) > 0.1 && visible;
                gizmo.plane.y.model.enabled = Math.abs(vecA.y) > 0.1 && visible;
                gizmo.plane.z.model.enabled = Math.abs(vecA.z) > 0.1 && visible;

                var worldTransform = gizmo.root.getWorldTransform();

                // draw cull sphere
                gizmo.line.cull.node.worldTransform = worldTransform;
                app.renderMeshInstance(gizmo.line.cull, immediateRenderOptions);

                // render lines
                // x
                if (moving && hoverAxis === 'x') {
                    // behind line
                    app.renderMesh(gizmo.line.x.mesh, gizmo.matBehindActive, worldTransform, immediateRenderOptions);
                } else {
                    // behind line
                    app.renderMesh(gizmo.line.x.mesh, gizmo.matBehindHover.x, worldTransform, immediateRenderOptions);
                    // front line
                    if (! moving && gizmo.plane.x.model.enabled) {
                        gizmo.line.x.node.worldTransform = worldTransform;
                        app.renderMeshInstance(gizmo.line.x, immediateRenderOptions);
                    }
                }

                // y
                if (moving && hoverAxis === 'y') {
                    // behind line
                    app.renderMesh(gizmo.line.y.mesh, gizmo.matBehindActive, worldTransform, immediateRenderOptions);
                } else {
                    // behind line
                    app.renderMesh(gizmo.line.y.mesh, gizmo.matBehindHover.y, worldTransform, immediateRenderOptions);
                    // front line
                    if (! moving && gizmo.plane.y.model.enabled) {
                        gizmo.line.y.node.worldTransform = worldTransform;
                        app.renderMeshInstance(gizmo.line.y, immediateRenderOptions);
                    }
                }
                // z
                if (moving && hoverAxis === 'z') {
                    // behind line
                    app.renderMesh(gizmo.line.z.mesh, gizmo.matBehindActive, worldTransform, immediateRenderOptions);
                } else {
                    // behind line
                    app.renderMesh(gizmo.line.z.mesh, gizmo.matBehindHover.z, worldTransform, immediateRenderOptions);
                    // front line
                    if (! moving && gizmo.plane.z.model.enabled) {
                        gizmo.line.z.node.worldTransform = worldTransform;
                        app.renderMeshInstance(gizmo.line.z, immediateRenderOptions);
                    }
                }


            }

            mouseTapMoved = false
        });

        var pickPlane = function(x, y) {
            var camera = editor.call('camera:current');

            var mouseWPos = camera.camera.screenToWorld(x, y, 1);
            var posGizmo = gizmo.root.getPosition();
            var rayOrigin = vecA.copy(camera.getPosition());
            var rayDirection = vecB;
            var planeNormal = vecC.set(0, 0, 0);
            planeNormal[hoverAxis] = 1;

            // rotate plane to local space
            quat.copy(startRotation).transformVector(planeNormal, planeNormal);

            // ray from camera
            if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                rayDirection.copy(mouseWPos).sub(rayOrigin).normalize();
            } else {
                rayOrigin.copy(mouseWPos);
                camera.getWorldTransform().transformVector(vecD.set(0, 0, -1), rayDirection);
            }

            // pick the plane
            var rayPlaneDot = planeNormal.dot(rayDirection);
            var planeDist = posGizmo.dot(planeNormal);
            var pointPlaneDist = (planeNormal.dot(rayOrigin) - planeDist) / rayPlaneDot;
            var pickedPos = rayDirection.scale(-pointPlaneDist).add(rayOrigin).sub(posGizmo);

            // rotate vector to world space
            quat.invert().transformVector(pickedPos, pickedPos);

            var angle = 0;
            if (hoverAxis === 'x') {
                angle = Math.atan2(pickedPos.z, pickedPos.y) / (Math.PI / 180);
            } else if (hoverAxis === 'y') {
                angle = Math.atan2(pickedPos.x, pickedPos.z) / (Math.PI / 180);
            } else if (hoverAxis === 'z') {
                angle = Math.atan2(pickedPos.y, pickedPos.x) / (Math.PI / 180);
            }

            return {
                angle: angle,
                point: pickedPos
            };
        };

        var onTapStart = function(tap) {
            if (moving || tap.button !== 0)
                return;

            editor.emit('camera:toggle', false);

            moving = true;
            mouseTap = tap;
            mouseTapMoved = true;

            if (gizmo.root.enabled) {
                startRotation.copy(gizmo.root.getRotation());
                var data = pickPlane(tap.x, tap.y);
                angleStart = data.angle;
            }

            editor.emit('gizmo:rotate:start', hoverAxis);
            editor.call('viewport:pick:state', false);
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

            editor.emit('gizmo:rotate:end');
            editor.call('viewport:pick:state', true);
        };

        editor.on('viewport:mouse:move', onTapMove);
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

    var createEntity = function(app) {
        var obj = {
            root: null,
            sphere: null,
            plane: {
                x: null,
                y: null,
                z: null
            },
            line: {
                x: null,
                y: null,
                z: null,
                cull: null
            },
            hoverable: [ ],
            matActive: null,
            matBehind: null,
            matBehindHover: { },
            matBehindActive: null
        };

        // materials
        obj.matBehind = createMaterial(new pc.Color(1, 1, 1, .1));
        obj.matBehind.depthTest = false;
        obj.matBehindHover.x = createMaterial(new pc.Color(1, 0, 0, .2));
        obj.matBehindHover.y = createMaterial(new pc.Color(0, 1, 0, .2));
        obj.matBehindHover.z = createMaterial(new pc.Color(0, 0, 1, .2));
        obj.matBehindHover.x.depthTest = false;
        obj.matBehindHover.y.depthTest = false;
        obj.matBehindHover.z.depthTest = false;
        obj.matBehindActive = createMaterial(new pc.Color(1, 1, 1, 1.1));
        obj.matBehindActive.depthTest = false;
        obj.colorActive = new pc.Color(1, 1, 1, 1);

        var gizmoLayer = editor.call('gizmo:layers', 'Axis Gizmo').id;

        // root entity
        var entity = obj.root = new pc.Entity();

        // plane x
        var planeX = obj.plane.x = new pc.Entity();
        obj.hoverable.push(planeX);
        planeX.axis = 'x';
        planeX.plane = true;
        planeX.addComponent('model', {
            type: 'cylinder',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [gizmoLayer]
        });
        entity.addChild(planeX);
        planeX.setLocalEulerAngles(90, -90, 0);
        planeX.setLocalScale(4.1, 0.3, 4.1);
        planeX.mat = planeX.model.material = createMaterial(new pc.Color(1, 0, 0, 0));

        // plane y
        var planeY = obj.plane.y = new pc.Entity();
        obj.hoverable.push(planeY);
        planeY.axis = 'y';
        planeY.plane = true;
        planeY.addComponent('model', {
            type: 'cylinder',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [gizmoLayer]
        });
        entity.addChild(planeY);
        planeY.setLocalEulerAngles(0, 0, 0);
        planeY.setLocalScale(4.2, 0.3, 4.2);
        planeY.mat = planeY.model.material = createMaterial(new pc.Color(0, 1, 0, 0));

        // plane z
        var planeZ = obj.plane.z = new pc.Entity();
        obj.hoverable.push(planeZ);
        planeZ.axis = 'z';
        planeZ.plane = true;
        planeZ.addComponent('model', {
            type: 'cylinder',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [gizmoLayer]
        });
        entity.addChild(planeZ);
        planeZ.setLocalEulerAngles(90, 0, 0);
        planeZ.setLocalScale(4, 0.3, 4);
        planeZ.mat = planeZ.model.material = createMaterial(new pc.Color(0, 0, 1, 0));

        // sphere
        var sphere = obj.sphere = new pc.Entity();
        sphere.addComponent('model', {
            type: 'sphere',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [gizmoLayer]
        });
        entity.addChild(sphere);
        sphere.setLocalScale(3, 3, 3);
        sphere.mat = sphere.model.material = createMaterial(new pc.Color(1, 1, 1, 0));

        obj.matActive = createMaterial(new pc.Color(1, 1, 1, 1.1));

        var lines = createLinesModel(app);
        obj.line.x = lines[0];
        obj.line.y = lines[1];
        obj.line.z = lines[2];
        obj.line.cull = lines[3];

        return obj;
    };

    var createMeshInstance = function (node, mesh, material) {
        var mi = new pc.MeshInstance(node, mesh, material);
        mi.cull = false;
        return mi;
    };

    var createLinesModel = function(app) {
        // Create the rotate gizmo geometry
        var device = app.graphicsDevice;
        var axisSegments = 50;
        var numVerts = (axisSegments + 1);
        var angle = 0.0;
        var iterator;
        var sinAngle, cosAngle;
        var scale = 2;

        var vertexFormat = new pc.VertexFormat(app.graphicsDevice, [
            { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.TYPE_FLOAT32 }
        ]);

        var vertexBuffers = [];
        for (var axis = 0; axis < 3; axis++) {
            // Create a vertex buffer
            vertexBuffers.push(new pc.VertexBuffer(device, vertexFormat, numVerts));

            // Fill the vertex buffer
            iterator = new pc.VertexIterator(vertexBuffers[axis]);
            for (var seg = 0; seg <= axisSegments; seg++) {
                angle = 2 * Math.PI * (seg / axisSegments);
                sinAngle = Math.sin(angle);
                cosAngle = Math.cos(angle);
                if (axis === 0) {
                    iterator.element[pc.SEMANTIC_POSITION].set(0, sinAngle * scale, cosAngle * scale);
                } else if (axis === 1) {
                    iterator.element[pc.SEMANTIC_POSITION].set(sinAngle * scale, 0, cosAngle * scale);
                } else if (axis === 2) {
                    iterator.element[pc.SEMANTIC_POSITION].set(sinAngle * scale, cosAngle * scale, 0);
                }
                iterator.next();
            }
            iterator.end();
        }

        var node = new pc.GraphNode();
        var mesh, meshInstance;

        var meshInstances = [ ];
        var materials = [
            createMaterial(new pc.Color(1, 0, 0, 1.1)),
            createMaterial(new pc.Color(0, 1, 0, 1.1)),
            createMaterial(new pc.Color(0, 0, 1, 1.1))
        ];

        // create 3 rings of lines (the visible portion of the gizmo)
        for (var i = 0; i < 3; i++) {
            mesh = new pc.Mesh();
            mesh.vertexBuffer = vertexBuffers[i];
            mesh.indexBuffer[0] = null;
            mesh.primitive[0].type = pc.PRIMITIVE_LINESTRIP;
            mesh.primitive[0].base = 0;
            mesh.primitive[0].count = vertexBuffers[i].getNumVertices();
            mesh.primitive[0].indexed = false;

            meshInstance = createMeshInstance(node, mesh, materials[i]);
            meshInstance.mask = GIZMO_MASK;
            meshInstance.mat = materials[i];
            meshInstances.push(meshInstance);
        }

        // create a sphere which is used to render in the center and cull the rings (via depth buffer)
        mesh = pc.createSphere(device, {
            segments: 75,
            radius: 1.95
        });
        var material = createMaterial(new pc.Color(1, 1, 1, 0.5));
        material.redWrite = false;
        material.greenWrite = false;
        material.blueWrite = false;
        material.alphaWrite = false;
        material.update();
        meshInstance = createMeshInstance(node, mesh, material);
        meshInstance.mask = GIZMO_MASK;
        meshInstances.push(meshInstance);

        return meshInstances;
    };
});
