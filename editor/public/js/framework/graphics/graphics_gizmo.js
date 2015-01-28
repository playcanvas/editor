pc.extend(pc.designer.graphics, function() {

    var MULTIAXIS_PLANESIZE = 0.4;

    // Public Interface
    var Gizmo = function Gizmo(context) {
        this.context = context;
        var device = context.graphicsDevice;
        this.currentGizmo = -1;

        // Create the materials
        var red = new pc.scene.BasicMaterial();
        red.color = new pc.Color(1, 0, 0, 1);
        red.cull = pc.gfx.CULLFACE_NONE;
        red.update();

        var green = new pc.scene.BasicMaterial();
        green.color = new pc.Color(0, 1, 0, 1);
        green.cull = pc.gfx.CULLFACE_NONE;
        green.update();

        var blue = new pc.scene.BasicMaterial();
        blue.color = new pc.Color(0, 0, 1, 1);
        blue.cull = pc.gfx.CULLFACE_NONE;
        blue.update();

        var yellow = new pc.scene.BasicMaterial();
        yellow.color = new pc.Color(1, 1, 0, 1);
        yellow.cull = pc.gfx.CULLFACE_NONE;
        yellow.update();

        var transparent_yellow = new pc.scene.BasicMaterial();
        transparent_yellow.color = new pc.Color(1, 1, 0, 0.5);
        transparent_yellow.cull = pc.gfx.CULLFACE_NONE;
        transparent_yellow.blendType = pc.scene.BLEND_NORMAL;
        transparent_yellow.depthTest = false;
        transparent_yellow.depthWrite = false;
        transparent_yellow.update();

        var transparent_red = new pc.scene.BasicMaterial();
        transparent_red.color = new pc.Color(1, 0, 0, 0.3);
        transparent_red.blend = true;
        transparent_red.blendSrc = pc.gfx.BLENDMODE_SRC_ALPHA;
        transparent_red.blendDst = pc.gfx.BLENDMODE_ONE_MINUS_SRC_ALPHA;
        transparent_red.cull = pc.gfx.CULLFACE_NONE;
        transparent_red.depthTest = false;
        transparent_red.depthWrite = false;
        transparent_red.update();

        var transparent_green = new pc.scene.BasicMaterial();
        transparent_green.color = new pc.Color(0, 1, 0, 0.3);
        transparent_green.blend = true;
        transparent_green.blendSrc = pc.gfx.BLENDMODE_SRC_ALPHA;
        transparent_green.blendDst = pc.gfx.BLENDMODE_ONE_MINUS_SRC_ALPHA;
        transparent_green.cull = pc.gfx.CULLFACE_NONE;
        transparent_green.depthTest = false;
        transparent_green.depthWrite = false;
        transparent_green.update();

        var transparent_blue = new pc.scene.BasicMaterial();
        transparent_blue.color = new pc.Color(0, 0, 1, 0.3);
        transparent_blue.blend = true;
        transparent_blue.blendSrc = pc.gfx.BLENDMODE_SRC_ALPHA;
        transparent_blue.blendDst = pc.gfx.BLENDMODE_ONE_MINUS_SRC_ALPHA;
        transparent_blue.cull = pc.gfx.CULLFACE_NONE;
        transparent_blue.depthTest = false;
        transparent_blue.depthWrite = false;
        transparent_blue.update();

        var transparent_white = new pc.scene.BasicMaterial();
        transparent_white.color = new pc.Color(1, 1, 1, 0.3);
        transparent_white.blend = true;
        transparent_white.blendSrc = pc.gfx.BLENDMODE_SRC_ALPHA;
        transparent_white.blendDst = pc.gfx.BLENDMODE_ONE_MINUS_SRC_ALPHA;
        transparent_white.cull = pc.gfx.CULLFACE_NONE;
        transparent_white.depthTest = false;
        transparent_white.depthWrite = false;
        transparent_white.update();

        var blocker = new pc.scene.BasicMaterial();
        blocker.redWrite = false;
        blocker.greenWrite = false;
        blocker.blueWrite = false;
        blocker.alphaWrite = false;
        blocker.update();

        var invisible = new pc.scene.BasicMaterial();
        invisible.color = new pc.Color(0, 0, 0, 0);
        invisible.blend = true;
        invisible.blendSrc = pc.gfx.BLENDMODE_SRC_ALPHA;
        invisible.blendDst = pc.gfx.BLENDMODE_ONE_MINUS_SRC_ALPHA;
        invisible.depthTest = false;
        invisible.depthWrite = false;
        invisible.update();

        this.axisMaterials = [red, green, blue];

        this.selectedMaterials = [];
        this.selectedMaterials[pc.designer.graphics.GizmoMode.ROTATE] = [yellow, yellow, yellow];
        this.selectedMaterials[pc.designer.graphics.GizmoMode.TRANSLATE] = [yellow, yellow, yellow, transparent_yellow, transparent_yellow, transparent_yellow, yellow, yellow, yellow];
        this.selectedMaterials[pc.designer.graphics.GizmoMode.SCALE] = [yellow, yellow, yellow, transparent_yellow, yellow, yellow, yellow];

        this.blockerMaterial = blocker;
        this.invisibleMaterial = invisible;

        // Create the vertex format
        this.vertexFormat = new pc.gfx.VertexFormat(device, [
            { semantic: pc.gfx.SEMANTIC_POSITION, components: 3, type: pc.gfx.ELEMENTTYPE_FLOAT32 }
        ]);

        this.gizmoMaterials = [];
        this.gizmoMaterials[pc.designer.graphics.GizmoMode.ROTATE] = this.axisMaterials;
        this.gizmoMaterials[pc.designer.graphics.GizmoMode.TRANSLATE] = [red, green, blue, transparent_blue, transparent_red, transparent_green, red, green, blue];
        this.gizmoMaterials[pc.designer.graphics.GizmoMode.SCALE] = [red, green, blue, transparent_white, red, green, blue];

        this.gizmos = [];
        this.gizmos[pc.designer.graphics.GizmoMode.ROTATE] = this.createRotateGizmo();
        this.gizmos[pc.designer.graphics.GizmoMode.TRANSLATE] = this.createTranslateGizmo();
        this.gizmos[pc.designer.graphics.GizmoMode.SCALE] = this.createScaleGizmo();

        this.renders = [];
        this.renders[pc.designer.graphics.GizmoMode.ROTATE] = this._renderRotateGizmo;
        this.renders[pc.designer.graphics.GizmoMode.TRANSLATE] = this._renderTranslateGizmo;
        this.renders[pc.designer.graphics.GizmoMode.SCALE] = this._renderScaleGizmo;

        // Insert a command into the draw call queue to clear the depth buffer immediately before the gizmos are rendered
        var clearOptions = {
            flags: pc.gfx.CLEARFLAG_DEPTH
        };
        var command = new pc.scene.Command(pc.scene.LAYER_GIZMO, pc.scene.BLEND_NONE, function () {
            device.clear(clearOptions);
        });
        context.scene.drawCalls.push(command);
    };

    Gizmo.prototype = {
        createAxes: function (node) {
            // Create the axes mesh instances
            var device = this.context.graphicsDevice;
            var vertexBuffer = new pc.gfx.VertexBuffer(device, this.vertexFormat, 6);
            var vertexData = new Float32Array(vertexBuffer.lock());
            vertexData.set([
                0, 0, 0, 1, 0, 0,
                0, 0, 0, 0, 1, 0,
                0, 0, 0, 0, 0, 1
            ]);
            vertexBuffer.unlock();

            var meshInstances = [];
            for (var axis = 0; axis < 3; axis++) {
                var mesh = new pc.scene.Mesh();
                mesh.vertexBuffer = vertexBuffer;
                mesh.indexBuffer[0] = null;
                mesh.primitive[0].type = pc.gfx.PRIMITIVE_LINES;
                mesh.primitive[0].base = axis * 2;
                mesh.primitive[0].count = 2;
                mesh.primitive[0].indexed = false;

                var meshInstance = new pc.scene.MeshInstance(node, mesh, this.axisMaterials[axis]);
                meshInstance.layer = pc.scene.LAYER_GIZMO;
                meshInstance.updateKey();
                meshInstances.push(meshInstance);
            }

            return meshInstances;
        },

        createRotateGizmo: function () {
            // Create the rotate gizmo geometry
            var device = this.context.graphicsDevice;
            var axisSegments = 50;
            var numVerts = (axisSegments + 1);
            var angle = 0.0;
            var iterator;

            var vertexBuffers = [];
            for (var axis = 0; axis <= 3; axis++) {
                // Create a vertex buffer
                vertexBuffers.push(new pc.gfx.VertexBuffer(device, this.vertexFormat, numVerts));

                // Fill the vertex buffer
                iterator = new pc.gfx.VertexIterator(vertexBuffers[axis]);
                for (var seg = 0; seg <= axisSegments; seg++) {
                    angle = 2 * Math.PI * (seg / axisSegments);
                    sinAngle = Math.sin(angle);
                    cosAngle = Math.cos(angle);
                    if (axis === 0) {
                        iterator.element[pc.gfx.SEMANTIC_POSITION].set(0, sinAngle, cosAngle);
                    } else if (axis === 1) {
                        iterator.element[pc.gfx.SEMANTIC_POSITION].set(sinAngle, 0, cosAngle);
                    } else if (axis === 2) {
                        iterator.element[pc.gfx.SEMANTIC_POSITION].set(sinAngle, cosAngle, 0);
                    }
                    iterator.next();
                }
                iterator.end();
            }

            var node = new pc.scene.GraphNode();
            var mesh, meshInstance;

            var meshInstances = [];
            var materials = this.gizmoMaterials[pc.designer.graphics.GizmoMode.ROTATE];

            for (var i = 0; i < 3; i++) {
                mesh = new pc.scene.Mesh();
                mesh.vertexBuffer = vertexBuffers[i];
                mesh.indexBuffer[0] = null;
                mesh.primitive[0].type = pc.gfx.PRIMITIVE_LINESTRIP;
                mesh.primitive[0].base = 0;
                mesh.primitive[0].count = vertexBuffers[i].getNumVertices();
                mesh.primitive[0].indexed = false;

                meshInstance = new pc.scene.MeshInstance(node, mesh, materials[i]);
                meshInstance.layer = pc.scene.LAYER_GIZMO;
                meshInstance.updateKey();
                meshInstances.push(meshInstance);
            }

            mesh = pc.scene.procedural.createSphere(device, {
                segments: 75,
                radius: 0.99
            });
            meshInstance = new pc.scene.MeshInstance(node, mesh, this.blockerMaterial);
            meshInstance.layer = pc.scene.LAYER_GIZMO;
            meshInstance.updateKey();
            meshInstances.push(meshInstance);

            var model = new pc.scene.Model();
            model.graph = node;
            model.meshInstances = meshInstances;
            return model;
        },

        createTranslateGizmo: function () {
            // Create the axes mesh instances
            var device = this.context.graphicsDevice;
            var node = new pc.scene.GraphNode();

            var meshInstances = this.createAxes(node);

            // Create the tip mesh instances
            var coneMesh = pc.scene.procedural.createCone(device, {
                baseRadius: 0.085,
                peakRadius: 0,
                height: 0.3
            })

            var tipNodes = [
                new pc.scene.GraphNode(),
                new pc.scene.GraphNode(),
                new pc.scene.GraphNode()
            ];
            tipNodes[0].setLocalEulerAngles(0, 0, -90);
            tipNodes[0].setLocalPosition(1.15, 0, 0);
            tipNodes[1].setLocalPosition(0, 1.15, 0);
            tipNodes[2].setLocalEulerAngles(90, 0, 0);
            tipNodes[2].setLocalPosition(0, 0, 1.15);

            var planeMesh = pc.scene.procedural.createPlane(device, {
                halfExtents: new pc.Vec2(MULTIAXIS_PLANESIZE * 0.5, MULTIAXIS_PLANESIZE * 0.5),
                widthSegments: 1,
                lengthSegments: 1
            });

            var planeNodes = [
                new pc.scene.GraphNode(),
                new pc.scene.GraphNode(),
                new pc.scene.GraphNode()
            ];

            planeNodes[0].setLocalEulerAngles(90, 0, 0);
            planeNodes[0].setLocalPosition(MULTIAXIS_PLANESIZE * 0.5, MULTIAXIS_PLANESIZE * 0.5, 0);
            planeNodes[1].setLocalEulerAngles(90, 90, 0);
            planeNodes[1].setLocalPosition(0, MULTIAXIS_PLANESIZE * 0.5, MULTIAXIS_PLANESIZE * 0.5);
            planeNodes[2].setLocalPosition(MULTIAXIS_PLANESIZE * 0.5, 0, MULTIAXIS_PLANESIZE * 0.5);

            var materials = this.gizmoMaterials[pc.designer.graphics.GizmoMode.TRANSLATE];

            for (var axis = 0; axis < 3; axis++) {
                node.addChild(planeNodes[axis]);
                meshInstance = new pc.scene.MeshInstance(planeNodes[axis], planeMesh, materials[axis + 3]);
                meshInstance.layer = pc.scene.LAYER_GIZMO;
                meshInstance.updateKey();
                meshInstances.push(meshInstance);
            }

            for (var axis = 0; axis < 3; axis++) {
                node.addChild(tipNodes[axis]);
                var meshInstance = new pc.scene.MeshInstance(tipNodes[axis], coneMesh, materials[axis]);
                meshInstance.layer = pc.scene.LAYER_GIZMO;
                meshInstance.updateKey();
                meshInstances.push(meshInstance);
            }

            var model = new pc.scene.Model();
            model.graph = node;
            model.meshInstances = meshInstances;
            return model;
        },

        createScaleGizmo: function () {
            // Create the axes mesh instances
            var device = this.context.graphicsDevice;
            var node = new pc.scene.GraphNode();

            var meshInstances = this.createAxes(node);

            // Create the tip mesh instances
            var mesh = pc.scene.procedural.createBox(device, {
                halfExtents: new pc.Vec3(0.1, 0.1, 0.1)
            });

            var materials = this.gizmoMaterials[pc.designer.graphics.GizmoMode.SCALE];

            var centerNode = new pc.scene.GraphNode();
            node.addChild(centerNode);
            var meshInstance = new pc.scene.MeshInstance(centerNode, mesh, materials[3]);
            meshInstance.layer = pc.scene.LAYER_GIZMO;
            meshInstance.updateKey();
            meshInstances.push(meshInstance);

            var nodes = [
                new pc.scene.GraphNode(),
                new pc.scene.GraphNode(),
                new pc.scene.GraphNode()
            ];

            nodes[0].setLocalPosition(1.1, 0, 0);
            nodes[1].setLocalPosition(0, 1.1, 0);
            nodes[2].setLocalPosition(0, 0, 1.1);


            for (var i = 0; i < 3; i++) {
                node.addChild(nodes[i]);
                var meshInstance = new pc.scene.MeshInstance(nodes[i], mesh, materials[i]);
                meshInstance.layer = pc.scene.LAYER_GIZMO;
                meshInstance.updateKey();
                meshInstances.push(meshInstance);
            }

            var model = new pc.scene.Model();
            model.graph = node;
            model.meshInstances = meshInstances;
            return model;
        },

        render: function (gizmo, transform, activeAxis, cameraTransform) {
            var model;

            if (this.currentGizmo !== gizmo) {
                model = this.gizmos[this.currentGizmo];
                if (this.context.scene.containsModel(model)) {
                    this.context.scene.removeModel(model);
                    this.context.root.removeChild(model.graph);
                }

                this.currentGizmo = gizmo;

                model = this.gizmos[this.currentGizmo];
                if (!this.context.scene.containsModel(model)) {
                    this.context.scene.addModel(model);
                    this.context.root.addChild(model.graph);
                }
            }

            if (this.currentGizmo !== -1) {
                model = this.gizmos[this.currentGizmo];

                // set transform for current gizmo
                var root = model.graph;
                root.setPosition(transform.getTranslation());
                root.setEulerAngles(transform.getEulerAngles());
                root.setLocalScale(transform.getScale());

                // reset materials of current gizmo
                var meshInstances = model.meshInstances;
                var materials = this.gizmoMaterials[this.currentGizmo];
                for (var i = 0, len = materials.length; i < len; i++) {
                    meshInstances[i].material = materials[i];
                }

                this.renders[this.currentGizmo].call(this, transform, cameraTransform, activeAxis);
            }
        },

        _setMeshInstanceLayer: function (meshInstance, layer) {
            if (meshInstance.layer !== layer) {
                meshInstance.layer = layer;
                meshInstance.updateKey();
            }
        },

        getIndicesOfDisabledGizmoMeshes: function (gizmo) {
            var result = [];
            var gizmo = this.gizmos[gizmo];
            var meshInstances = gizmo.meshInstances;
            for (var i=0; i<meshInstances.length; i++) {
                if (meshInstances[i].material === this.invisibleMaterial) {
                    result.push(i);
                }
            }

            return result;
        },

        _renderRotateGizmo: function (gizmoTransform, cameraTransform, activeAxis) {
            var gizmoModel = this.gizmos[this.currentGizmo];
            var selectedMaterials = this.selectedMaterials[this.currentGizmo];

            // set the selected material to the meshes that correspond to the active axis
            if (activeAxis >= 0 && activeAxis < 3) {
                gizmoModel.meshInstances[activeAxis].material = selectedMaterials[activeAxis];
            }

            // hide the axes that are at acute angles with the camera's look direction
            var lookDir = gizmoTransform.getTranslation().sub(cameraTransform.getTranslation()).normalize();
            var axes = [
                gizmoTransform.getX().normalize(),
                gizmoTransform.getY().normalize(),
                gizmoTransform.getZ().normalize()
            ];

            for (var i=0; i<3; i++) {
                var meshInstance = gizmoModel.meshInstances[i];
                var layer = pc.scene.LAYER_GIZMO;

                if (Math.abs(lookDir.dot(axes[i])) < 0.15) {
                    meshInstance.material = this.invisibleMaterial;
                }

                this._setMeshInstanceLayer(meshInstance, layer);
            }
        },

        _renderTranslateGizmo: function (gizmoTransform, cameraTransform, activeAxis) {
            var gizmoModel = this.gizmos[this.currentGizmo];
            var selectedMaterials = this.selectedMaterials[this.currentGizmo];

            // set the selected material to the meshes that correspond to the active axis
            if (activeAxis >= 0) {
                if (activeAxis < 3) {
                    gizmoModel.meshInstances[activeAxis].material = selectedMaterials[activeAxis];
                    gizmoModel.meshInstances[activeAxis + 6].material = selectedMaterials[activeAxis + 6];
                } else {
                    gizmoModel.meshInstances[activeAxis].material = selectedMaterials[activeAxis];
                }
            }

            // hide the axes that are at acute angles with the camera's look direction
            var cameraPosition = cameraTransform.getTranslation();
            var lookDir = gizmoTransform.getTranslation().sub(cameraPosition).normalize();
            var axes = [
                gizmoTransform.getX().normalize(),
                gizmoTransform.getY().normalize(),
                gizmoTransform.getZ().normalize()
            ];

            for (var i=0; i<3; i++) {
                var layer = pc.scene.LAYER_GIZMO;
                var meshInstance1 = gizmoModel.meshInstances[i];
                var meshInstance2 = gizmoModel.meshInstances[i+6];

                if (Math.abs(lookDir.dot(axes[i])) > 0.99) {
                    meshInstance1.material = this.invisibleMaterial;
                    meshInstance2.material = this.invisibleMaterial;
                }

                this._setMeshInstanceLayer(meshInstance1, layer);
                this._setMeshInstanceLayer(meshInstance2, layer);
            }

            // hide multi-axis planes that are parallel to the camera direction
            var planes = [
                gizmoModel.meshInstances[3],
                gizmoModel.meshInstances[4],
                gizmoModel.meshInstances[5]
            ];

            var planeAxes = [
                axes[2],
                axes[0],
                axes[1]
            ];

            for (var i=0; i<3; i++) {
                var plane = planes[i];
                if (Math.abs(lookDir.dot(planeAxes[i])) < 0.1) {
                    plane.material = this.invisibleMaterial;
                } else {
                    this._setMeshInstanceLayer(plane, pc.scene.LAYER_GIZMO);
                }
            }

            // position the planes depending on where we're looking from
            var gizmoGraph = gizmoModel.graph;
            var children = gizmoGraph.getChildren();
            var temp = new pc.Vec3();

            var isUnderZ = temp.cross(lookDir, axes[0]).dot(axes[2]) < 0;
            var isLeftOfX = temp.cross(lookDir, axes[0]).dot(axes[1]) > 0;
            var isLeftOfZ = temp.cross(lookDir, axes[2]).dot(axes[1]) > 0;

            var x,y,z;
            var offset = MULTIAXIS_PLANESIZE * 0.5;

            // xy plane
            x = isLeftOfZ ? 1 : -1;
            y = isUnderZ ? -1 : 1;
            children[0].setLocalPosition(x * offset, y * offset, 0);

            // yz plane
            y = isUnderZ ? -1 : 1;
            z = isLeftOfX ? -1 : 1;
            children[1].setLocalPosition(0, y * offset, z * offset);

            // zx plane
            x = isLeftOfZ ? 1 : -1;
            z = isLeftOfX ? -1 : 1;
            children[2].setLocalPosition(x * offset, 0, z * offset);
        },

        _renderScaleGizmo: function (gizmoTransform, cameraTransform, activeAxis) {
            var gizmoModel = this.gizmos[this.currentGizmo];
            var selectedMaterials = this.selectedMaterials[this.currentGizmo];

            // set the selected material to the meshes that correspond to the active axis
            if (activeAxis >= 0) {
                if (activeAxis < 3) {
                    gizmoModel.meshInstances[activeAxis].material = selectedMaterials[activeAxis];
                    gizmoModel.meshInstances[activeAxis + 4].material = selectedMaterials[activeAxis+4];
                } else {
                    gizmoModel.meshInstances[activeAxis].material = selectedMaterials[activeAxis];
                }
            }

            // hide the axes that are at acute angles with the camera's look direction
            var lookDir = gizmoTransform.getTranslation().sub(cameraTransform.getTranslation()).normalize();
            var axes = [
                gizmoTransform.getX().normalize(),
                gizmoTransform.getY().normalize(),
                gizmoTransform.getZ().normalize()
            ];

            for (var i=0; i<3; i++) {
                var layer = pc.scene.LAYER_GIZMO;
                var meshInstance1 = gizmoModel.meshInstances[i];
                var meshInstance2 = gizmoModel.meshInstances[i+4];

                if (Math.abs(lookDir.dot(axes[i])) > 0.99) {
                    meshInstance1.material = this.invisibleMaterial;
                    meshInstance2.material = this.invisibleMaterial;
                }

                this._setMeshInstanceLayer(meshInstance1, layer);
                this._setMeshInstanceLayer(meshInstance2, layer);
            }
        },

        destroy: function () {
            var model = this.gizmos[this.currentGizmo];
            if (this.context.scene.containsModel(model)) {
                this.context.scene.removeModel(model);
                this.context.root.removeChild(model.graph);
            }

            this.currentGizmo = -1;
        }
    }

    return {
        Gizmo: Gizmo,
        GizmoMode: {
            TRANSLATE: 0,
            ROTATE: 1,
            SCALE: 2
        }
    }
}());