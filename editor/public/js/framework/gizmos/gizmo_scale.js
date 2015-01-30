(function () {
    pc.GizmoScale = function (context) {

        this.transparentWhite = this._createTransparentMaterial(new pc.Color(1, 1, 1, 0.3));
        this.transparentYellow = this._createTransparentMaterial(new pc.Color(1, 1, 0, 0.3));

        this.selectedAxisMaterial = this._createBasicMaterial(new pc.Color(1, 1, 0, 1));

        this.setSnapIncrement(1);

        this.startX = 0;
        this.startY = 0;
        this.startTransform = null;
        this.undoDrag = true;
    }

    pc.GizmoScale = pc.inherits(pc.GizmoScale, pc.Gizmo);

    pc.extend(pc.GizmoScale.prototype, {
        _createModel: function () {
            // Create the axes mesh instances
            var device = this.context.graphicsDevice;
            var node = this.node;
            var meshInstances = this._createAxisMeshes();

            // create box mesh
            var mesh = pc.createBox(device, {
                halfExtents: new pc.Vec3(0.1, 0.1, 0.1)
            });

            // create center box
            var centerNode = new pc.GraphNode();
            node.addChild(centerNode);
            var meshInstance = this._createMeshInstance(centerNode, mesh, this.transparentWhite);
            meshInstances.push(meshInstance);

            // create tip for each axis
            [new pc.Vec3(1.1, 0, 0), new pc.Vec3(0, 1.1, 0), new pc.Vec3(0, 0, 1.1)].forEach(function (position, i) {
                var axisNode = new pc.GraphNode();
                axisNode.setLocalPosition(position);
                node.addChild(axisNode);
                meshInstance = this._createMeshInstance(axisNode, mesh, this.axisMaterials[i]);
                meshInstances.push(meshInstance);
            }.bind(this));

            var model = new pc.Model();
            model.graph = node;
            model.meshInstances = meshInstances;
            return model;
        },

        _activate: function (entity) {
            // add box shapes for each axis and the center box
            ['X', 'Y', 'Z', 'C'].forEach(function (name) {
                entity.pick.addShape(new pc.shape.Box(), name);
            })
        },

        _resetMaterials: function () {
            var meshInstances = this.model.meshInstances;

            for (var i = 0; i < 3; i++) {
                // axis meshes
                meshInstances[i].material = this.axisMaterials[i];
                meshInstances[i+4].material = this.axisMaterials[i];
            }

            // center mesh
            meshInstances[3].material = this.transparentWhite;
        },

        _getWorldTransform: function () {
            var entity = this.entity;
            var worldTransform = new pc.Mat4();
            worldTransform.setTRS(entity.getPosition(), entity.getRotation(), pc.Vec3.ONE);
            return worldTransform;
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
                    // center mesh material
                    this.model.meshInstances[3].material = this.transparentYellow;
                }
            }
        },

        _setAxisMaterial: function (axis, material) {
            var meshInstances = this.model.meshInstances;
            // axis and tip materials
            meshInstances[axis].material = material;
            meshInstances[axis+4].material = material;
        },

        _renderAxesAndPlanes: function (worldTransform, scaleFactor) {
            var entity = this.entity;

            // hide the axes that are at acute angles with the camera's look direction
            var lookDir = worldTransform.getTranslation().sub(this.cameraEntity.getPosition()).normalize();
            var axes = [
                worldTransform.getX().normalize(),
                worldTransform.getY().normalize(),
                worldTransform.getZ().normalize()
            ];

            for (var i = 0; i < 3; i++) {
                if (Math.abs(lookDir.dot(axes[i])) > 0.99) {
                    this._setAxisMaterial(i, this.invisibleMaterial);
                }
            }

            // Get the shapes from the Pick Component
            var shapes = entity.pick.shapes;

            // Update the transforms of all shapes in the Pick Component to stay a constant size on screen
            var scales = [[1.1, 0.15, 0.15], [0.15, 1.1, 0.15], [0.15, 0.15, 1,1], [0.3, 0.3, 0.3]];
            var positions = [[0.7, 0, 0], [0, 0.7, 0], [0, 0, 0.7], [0, 0, 0]];

            for (var i = 0 ; i < 4; i++) {
                var translate = new pc.Mat4().setTranslate(scaleFactor * positions[i][0], scaleFactor * positions[i][1], scaleFactor * positions[i][2]);
                translate.mul2(worldTransform, translate);
                var scale = new pc.Mat4().setScale(scaleFactor * scales[i][0], scaleFactor * scales[i][1], scaleFactor * scales[i][2]);
                shapes[i].shape.transform.mul2(translate, scale);
                shapes[i].model.getGraph().getWorldTransform().copy(shapes[i].shape.transform);
            }
        },

        _startDrag: function (e) {
            this.startX = e.x;
            this.startY = e.y;
            this.startTransform = this.entity.getWorldTransform().clone();
            this.undoDrag = true;
        },

        _drag: function (e) {
            var entity = this.entity;
            var cameraEntity = this.cameraEntity;
            var entityWtm = this.startTransform;
            var x = e.x;
            var y = e.y;

            var startScale = this.startTransform.getScale();

            // Calculate the world space coordinate of the click coordinate in the camera's projection plane
            var currentNearClipCoord = this._screenToNearClipCoord(x, y);
            var initialNearClipCoord = this._screenToNearClipCoord(this.startX, this.startY);

            // Setup our axes depending on the current coordinate system
            var axes = []
            axes[0] = entityWtm.getX().normalize();
            axes[1] = entityWtm.getY().normalize();
            axes[2] = entityWtm.getZ().normalize();

            var planeNormal;
            var lookDir = cameraEntity.forward;

            // Get the normal for the plane that constitutes the plane of movement for the gizmo
            var axis = this.activeAxis;
            if (axis == 0) {
                planeNormal = (Math.abs(axes[1].dot(lookDir)) > Math.abs(axes[2].dot(lookDir))) ? axes[1] : axes[2];
            } else if (axis == 1) {
                planeNormal = (Math.abs(axes[0].dot(lookDir)) > Math.abs(axes[2].dot(lookDir))) ? axes[0] : axes[2];
            } else if (axis == 2) {
                planeNormal = (Math.abs(axes[0].dot(lookDir)) > Math.abs(axes[1].dot(lookDir))) ? axes[0] : axes[1];
            } else if (axis == 3) {
                planeNormal = lookDir.clone().scale(-1);
            }

            var entityPosition = entityWtm.getTranslation();

            var plane = new pc.shape.Plane(entityPosition, planeNormal);

            // Find the intersection point from the camera position to the plane for the initial mouse position and the current position
            var eyePosition = cameraEntity.getPosition();
            if (cameraEntity.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                var currentIntersection = plane.intersectPosition(eyePosition, currentNearClipCoord);
                var initialIntersection = plane.intersectPosition(eyePosition, initialNearClipCoord);
            } else {
                var temp = currentNearClipCoord.clone().add(lookDir);
                var currentIntersection = plane.intersectPosition(currentNearClipCoord, temp);
                temp.add2(initialNearClipCoord, lookDir);
                var initialIntersection = plane.intersectPosition(initialNearClipCoord, temp);
            }

            // the difference of those two points is the translation that we want to apply
            var scale = currentIntersection.clone().sub(initialIntersection);

            var axisToProjectOn;

            // if we're scaling on all axes then transform the scale vector to camera space
            if (axis == 3) {
                var inverseCameraWtm = cameraEntity.getWorldTransform().clone().invert();
                inverseCameraWtm.transformVector(scale, scale);

                // initial scale of Entity affects how much it is scales on all 3 axes
                axisToProjectOn = startScale.clone().normalize();
            } else {
                axisToProjectOn = axes[axis];
            }

            // Project the scale vector on the axis we're moving on
            scale.project(axisToProjectOn);

            // transform the scale vector to the entity's local space
            if (axis < 3) {
                var entityRotation = entity.getRotation();
                // use a transformation matrix with scaling equal to [1,1,1]
                // so that it doesn't affect the scaling speed of the gizmo
                var inverseEntityWtm = new pc.Mat4().setTRS(entityPosition, entityRotation, pc.Vec3.ONE).invert();
                inverseEntityWtm.transformVector(scale, scale);
            }

            // Snap the translation to the closest increment if necessary
            if (this.snap && !this.overrideSnap && this.snapIncrement > 0) {
                if (axis < 3) {
                    var amount = scale.length();
                    if (amount > 0) {
                        scale.scale(Math.round(amount / this.snapIncrement) * this.snapIncrement / amount);
                    }
                } else {
                    for (var i = 0; i < 3; i++) {
                        scale.data[i] = Math.round(scale.data[i] / this.snapIncrement) * this.snapIncrement;
                    }
                }
            }

            var newScale = startScale.clone().add(scale);

            this._setEntityAttribute('scale', [newScale.x, newScale.y, newScale.z], this.undoDrag);
            this.undoDrag = false;
        }

    });
})();
