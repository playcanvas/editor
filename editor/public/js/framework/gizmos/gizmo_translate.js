(function () {
    var PLANE_SIZE = 0.4;

    pc.GizmoTranslate = function (context) {
        // create transparent materials for the planes
        var colors = [
            new pc.Color(0, 0, 1, 0.3),
            new pc.Color(1, 0, 0, 0.3),
            new pc.Color(0, 1, 0, 0.3)
        ];

        this.planeMaterials = colors.map(this._createTransparentMaterial);

        this.selectedAxisMaterial = this._createBasicMaterial(new pc.Color(1, 1, 0, 1));
        this.selectedPlaneMaterial = this._createTransparentMaterial(new pc.Color(1, 1, 0, 0.3));

        this.setSnapIncrement(1);
    }

    pc.GizmoTranslate = pc.inherits(pc.GizmoTranslate, pc.Gizmo);

    pc.extend(pc.GizmoTranslate.prototype, {
        _createModel: function () {
            var device = this.context.graphicsDevice;
            var node = this.node;
            var meshInstances = this.axisMeshes;
            var meshInstance;

            // Create the tip mesh instances
            var coneMesh = pc.createCone(device, {
                baseRadius: 0.085,
                peakRadius: 0,
                height: 0.3
            })

            var tipNodes = [
                new pc.GraphNode(),
                new pc.GraphNode(),
                new pc.GraphNode()
            ];

            tipNodes[0].setLocalEulerAngles(0, 0, -90);
            tipNodes[0].setLocalPosition(1.15, 0, 0);
            tipNodes[1].setLocalPosition(0, 1.15, 0);
            tipNodes[2].setLocalEulerAngles(90, 0, 0);
            tipNodes[2].setLocalPosition(0, 0, 1.15);

            var planeMesh = pc.createPlane(device, {
                halfExtents: new pc.Vec2(PLANE_SIZE * 0.5, PLANE_SIZE * 0.5),
                widthSegments: 1,
                lengthSegments: 1
            });

            var planeNodes = [
                new pc.GraphNode(),
                new pc.GraphNode(),
                new pc.GraphNode()
            ];

            planeNodes[0].setLocalEulerAngles(90, 0, 0);
            planeNodes[0].setLocalPosition(PLANE_SIZE * 0.5, PLANE_SIZE * 0.5, 0);
            planeNodes[1].setLocalEulerAngles(90, 90, 0);
            planeNodes[1].setLocalPosition(0, PLANE_SIZE * 0.5, PLANE_SIZE * 0.5);
            planeNodes[2].setLocalPosition(PLANE_SIZE * 0.5, 0, PLANE_SIZE * 0.5);

            // add planes and tips meshes to the mesh instances array
            for (var axis = 0; axis < 3; axis++) {
                node.addChild(planeNodes[axis]);
                meshInstances.push(this._createMeshInstance(planeNodes[axis], planeMesh, this.planeMaterials[axis]));
            }

            for (var axis = 0; axis < 3; axis++) {
                node.addChild(tipNodes[axis]);
                meshInstances.push(this._createMeshInstance(tipNodes[axis], coneMesh, this.axisMaterials[axis]));
            }

            var model = new pc.Model();
            model.graph = node;
            model.meshInstances = meshInstances;
            return model;
        },

        _activate: function (entity) {
            // add box shapes for each axis and plane to the pick component
            // so that we are able to detect clicks
            ['X', 'Y', 'Z', 'XY', 'YZ', 'ZX'].forEach(function (name) {
                entity.pick.addShape(new pc.shape.Box(), name);
            })
        },

        _resetMaterials: function () {
            var meshInstances = this.model.meshInstances;

            for (var i = 0; i < 3; i++) {
                // axis meshes
                meshInstances[i].material = this.axisMaterials[i];
                // plane meshes
                meshInstances[i + 3].material = this.planeMaterials[i];
                // tip meshes
                meshInstances[i + 6].material = this.axisMaterials[i];
            }
        },

        _render: function (worldTransform, scaleFactor) {
            this._highlightActiveAxis();
            this._renderAxesAndPlanes(worldTransform, scaleFactor);
        },

        _highlightActiveAxis: function () {
            var activeAxis = this.activeAxis;

            // set the selected material to the meshes that correspond to the active axis
            if (activeAxis !== null) {
                if (activeAxis < 3) {
                    this._setAxisMaterial(activeAxis, this.selectedAxisMaterial);
                } else {
                    this._setPlaneMaterial(activeAxis, this.selectedPlaneMaterial);
                }
            }
        },

        _setAxisMaterial: function (axis, material) {
            var meshInstances = this.model.meshInstances;
            meshInstances[axis].material = material;
            meshInstances[axis+6].material = material;
        },

        _setPlaneMaterial: function (axis, material) {
            this.model.meshInstances[axis].material = material;
        },

        _renderAxesAndPlanes: function (worldTransform, scaleFactor) {
            var model = this.model;

            var x,y,z;
            var scale;
            var translate;

            // Get the shapes from the Pick Component
            var shapes = this.entity.pick.shapes;

            var axes = [
                worldTransform.getX().normalize(),
                worldTransform.getY().normalize(),
                worldTransform.getZ().normalize()
            ];

            var planeAxes = [
                axes[2],
                axes[0],
                axes[1]
            ];

            var planeMeshes = model.meshInstances.slice(3, 6);

            var lookDir = worldTransform.getTranslation().sub(this.cameraEntity.getPosition()).normalize();

            // hide the axes and planes that are at acute angles with the camera's look direction
            for (var i = 0; i < 3; i++) {
                if (Math.abs(lookDir.dot(axes[i])) > 0.99) {
                    this._setAxisMaterial(i, this.invisibleMaterial);
                }

                if (Math.abs(lookDir.dot(planeAxes[i])) < 0.1) {
                    planeMeshes[i].material = this.invisibleMaterial;
                }
            }

            // Update the transforms axis shapes in the Pick Component to stay a constant size on screen
            var axisScales = [[1.3, 0.15, 0.15], [0.15, 1.3, 0.15], [0.15, 0.15, 1.3]];
            var axisPositions = [[0.65, 0, 0], [0, 0.65, 0], [0, 0, 0.65]];
            for (var i = 0; i < 3; i++) {
                scale = new pc.Mat4().setScale(
                    axisScales[i][0] * scaleFactor,
                    axisScales[i][1] * scaleFactor,
                    axisScales[i][2] * scaleFactor
                );

                var translate = new pc.Mat4().setTranslate(
                    axisPositions[i][0] * scaleFactor,
                    axisPositions[i][1] * scaleFactor,
                    axisPositions[i][2] * scaleFactor
                );

                translate.mul2(worldTransform, translate);
                shapes[i].shape.transform.mul2(translate, scale);
            }

            // position the planes depending on where we're looking from
            var planeNodes = model.graph.getChildren();
            var planeShapes = shapes.slice(3, 6);

            var temp = new pc.Vec3();

            var isUnderZ = temp.cross(lookDir, axes[0]).dot(axes[2]) < 0;
            var isLeftOfX = temp.cross(lookDir, axes[0]).dot(axes[1]) > 0;
            var isLeftOfZ = temp.cross(lookDir, axes[2]).dot(axes[1]) > 0;

            var offset = PLANE_SIZE * 0.5;

            // xy plane
            x = isLeftOfZ ? 1 : -1;
            y = isUnderZ ? -1 : 1;
            planeNodes[0].setLocalPosition(x * offset, y * offset, 0);

            translate = new pc.Mat4().setTranslate(x * scaleFactor * offset, y * scaleFactor * offset, 0);
            translate.mul2(worldTransform, translate);
            scale = new pc.Mat4().setScale(scaleFactor * PLANE_SIZE, scaleFactor * PLANE_SIZE, scaleFactor * PLANE_SIZE * 0.1);
            planeShapes[0].shape.transform.mul2(translate, scale);

            // yz plane
            y = isUnderZ ? -1 : 1;
            z = isLeftOfX ? -1 : 1;
            planeNodes[1].setLocalPosition(0, y * offset, z * offset);

            translate = new pc.Mat4().setTranslate(0, y * scaleFactor * offset, z * scaleFactor * offset);
            translate.mul2(worldTransform, translate);
            scale = new pc.Mat4().setScale(scaleFactor * PLANE_SIZE * 0.1, scaleFactor * PLANE_SIZE, scaleFactor * PLANE_SIZE);
            planeShapes[1].shape.transform.mul2(translate, scale);

            // zx plane
            x = isLeftOfZ ? 1 : -1;
            z = isLeftOfX ? -1 : 1;
            planeNodes[2].setLocalPosition(x * offset, 0, z * offset);

            translate = new pc.Mat4().setTranslate(x * scaleFactor * offset, 0, z * scaleFactor * offset);
            translate.mul2(worldTransform, translate);
            scale = new pc.Mat4().setScale(scaleFactor * PLANE_SIZE, scaleFactor * PLANE_SIZE * 0.1, scaleFactor * PLANE_SIZE);
            planeShapes[2].shape.transform.mul2(translate, scale);

            // copy box transforms to the model transforms for each shape
            shapes.forEach(function (s) {
                s.model.graph.getWorldTransform().copy(s.shape.transform);
            })
        }

    });
})();
