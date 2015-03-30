(function () {
    pc.GizmoRotate = function (context) {
        this.selectedAxisMaterial = this._createBasicMaterial(new pc.Color(1, 1, 0, 1));

        this.setSnapIncrement(5);

        this.startX = 0;
        this.startY = 0;
        this.startTransform = null;
        this.undoDrag = false;

        this.blockerMaterial = new pc.scene.BasicMaterial();
        this.blockerMaterial.redWrite = false;
        this.blockerMaterial.greenWrite = false;
        this.blockerMaterial.blueWrite = false;
        this.blockerMaterial.alphaWrite = false;
        this.blockerMaterial.update();
    };

    pc.GizmoRotate = pc.inherits(pc.GizmoRotate, pc.Gizmo);

    pc.extend(pc.GizmoRotate.prototype, {
        _createModel: function () {
            // Create the rotate gizmo geometry
            var device = this.context.graphicsDevice;
            var axisSegments = 50;
            var numVerts = (axisSegments + 1);
            var angle = 0.0;
            var iterator;

            var vertexBuffers = [];
            for (var axis = 0; axis < 3; axis++) {
                // Create a vertex buffer
                vertexBuffers.push(new pc.gfx.VertexBuffer(device, this.vertexFormat, numVerts));

                // Fill the vertex buffer
                iterator = new pc.gfx.VertexIterator(vertexBuffers[axis]);
                for (var seg = 0; seg <= axisSegments; seg++) {
                    angle = 2 * Math.PI * (seg / axisSegments);
                    sinAngle = Math.sin(angle);
                    cosAngle = Math.cos(angle);
                    if (axis === 0) {
                        iterator.element[pc.SEMANTIC_POSITION].set(0, sinAngle, cosAngle);
                    } else if (axis === 1) {
                        iterator.element[pc.SEMANTIC_POSITION].set(sinAngle, 0, cosAngle);
                    } else if (axis === 2) {
                        iterator.element[pc.SEMANTIC_POSITION].set(sinAngle, cosAngle, 0);
                    }
                    iterator.next();
                }
                iterator.end();
            }

            var node = this.node;
            var mesh, meshInstance;

            var meshInstances = [];
            var materials = this.axisMaterials;

            for (var i = 0; i < 3; i++) {
                mesh = new pc.Mesh();
                mesh.vertexBuffer = vertexBuffers[i];
                mesh.indexBuffer[0] = null;
                mesh.primitive[0].type = pc.PRIMITIVE_LINESTRIP;
                mesh.primitive[0].base = 0;
                mesh.primitive[0].count = vertexBuffers[i].getNumVertices();
                mesh.primitive[0].indexed = false;

                meshInstance = this._createMeshInstance(node, mesh, materials[i]);
                meshInstances.push(meshInstance);
            }

            mesh = pc.createSphere(device, {
                segments: 75,
                radius: 0.99
            });
            meshInstance = this._createMeshInstance(node, mesh, this.blockerMaterial);
            meshInstances.push(meshInstance);

            var model = new pc.scene.Model();
            model.graph = node;
            model.meshInstances = meshInstances;
            return model;
        },

        _activate: function (entity) {
            var iradius = 0.1;
            var oradius = 1;

            this.entity.pick.addShape(new pc.shape.Torus(new pc.Mat4(), iradius, oradius), 'X');
            this.entity.pick.addShape(new pc.shape.Torus(new pc.Mat4(), iradius, oradius), 'Y');
            this.entity.pick.addShape(new pc.shape.Torus(new pc.Mat4(), iradius, oradius), 'Z');

            // add torus shapes for each ring so that we can select them
            ['X', 'Y', 'Z'].forEach(function (name) {
                entity.pick.addShape(new pc.shape.Torus(new pc.Mat4(), iradius, oradius), name);
            });
        },

        _resetMaterials: function () {
            var meshInstances = this.model.meshInstances;

            for (var i = 0; i < 3; i++) {
                // axis meshes
                meshInstances[i].material = this.axisMaterials[i];
            }

            meshInstances[3].material = this.blockerMaterial;
        },

        _getWorldTransform: function () {
            var entity = this.entity;
            var position = entity.getPosition();
            var rotation = entity.getRotation();
            var worldTransform = new pc.Mat4();

            // calculate world transform for gizmo based
            // on current coordinate system
            if (this.coordinateSystem === 'world') {
                worldTransform.setTRS(position, pc.Quat.IDENTITY, pc.Vec3.ONE);
            } else {
                worldTransform.setTRS(position, rotation, pc.Vec3.ONE);
            }

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
                    this.model.meshInstances[activeAxis].material = this.selectedAxisMaterial;
                }
            }
        },

        _renderAxesAndPlanes: function (worldTransform, scaleFactor) {
            var entity = this.entity;
            var model = this.model;

            // hide the axes that are at acute angles with the camera's look direction
            var lookDir = worldTransform.getTranslation().sub(this.cameraEntity.getPosition()).normalize();
            var axes = [
                worldTransform.getX().normalize(),
                worldTransform.getY().normalize(),
                worldTransform.getZ().normalize()
            ];

            for (var i = 0; i < 3; i++) {
                var meshInstance = model.meshInstances[i];

                if (Math.abs(lookDir.dot(axes[i])) < 0.15) {
                    meshInstance.material = this.invisibleMaterial;
                }
            }

            // Update the gizmo scale to stay a constant size on screen
            var scale = new pc.Mat4().setScale(scaleFactor, scaleFactor, scaleFactor);

            // Get the shapes from the Pick Component
            var shapes = entity.pick.shapes;

            // x
            var rotate = new pc.Mat4().setFromAxisAngle(pc.Vec3.BACK, 90);
            rotate.mul2(worldTransform, rotate);
            shapes[0].shape.transform.mul2(rotate, scale);

            // y
            shapes[1].shape.transform.mul2(worldTransform, scale);

            // z
            rotate.setFromAxisAngle(pc.Vec3.RIGHT, 90);
            rotate.mul2(worldTransform, rotate);
            shapes[2].shape.transform.mul2(rotate, scale);

            // Update model transforms
            shapes.forEach(function (s) {
                s.model.getGraph().getWorldTransform().copy(s.shape.transform);
            });
        },

        _startDrag: function (e) {
            this.startX = e.x;
            this.startY = e.y;
            this.startTransform = this.entity.getWorldTransform().clone();
            this.undoDrag = true;
        },

        _drag: function (e) {
            if (this.activeAxis >= 3) {
                // TODO: find out why / when this happens
                console.log('Rotation gizmo: active axis is ' + this.activeAxis);
                return;
            }

            var x = e.x;
            var y = e.y;
            var entity = this.entity;

            // Calculate the world space coordinate of the click coordinate in the camera's projection plane
            var currentNearClipCoord = this._screenToNearClipCoord(x, y);
            var initialNearClipCoord = this._screenToNearClipCoord(this.startX, this.startY);

            // Calculate the world space intersection point of click 'ray' and the plane
            // that constitutes the plane of movement for the gizmo
            var cameraEntity = this.cameraEntity;
            var eyePosition = cameraEntity.getPosition();
            var lookDir = cameraEntity.forward;
            var entityWtm = this.startTransform;
            var temp = new pc.Vec3();

            var refWorld = (this.coordinateSystem === 'world');
            var axes = [];
            if (refWorld) {
                axes[0] = pc.Vec3.RIGHT;
                axes[1] = pc.Vec3.UP;
                axes[2] = pc.Vec3.BACK;
            } else {
                axes[0] = entityWtm.getX().normalize();
                axes[1] = entityWtm.getY().normalize();
                axes[2] = entityWtm.getZ().normalize();
            }

            var entityPosition = entityWtm.getTranslation();
            var planePoint  = entityPosition;
            var planeNormal = axes[this.activeAxis];
            var plane = new pc.shape.Plane(planePoint, planeNormal);

            if (cameraEntity.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                var currentIntersection = plane.intersectPosition(eyePosition, currentNearClipCoord);
                var initialIntersection = plane.intersectPosition(eyePosition, initialNearClipCoord);
            } else {
                temp.add2(currentNearClipCoord, lookDir);
                var currentIntersection = plane.intersectPosition(currentNearClipCoord, temp);
                temp.add2(initialNearClipCoord, lookDir);
                var initialIntersection = plane.intersectPosition(initialNearClipCoord, temp);
            }

            // normalized vector from entity center to initial intersection
            var centerToInitial = initialIntersection.clone().sub(entityPosition).normalize();
            // normalized vector from entity center to current intersection
            var centerToCurrent = currentIntersection.clone().sub(entityPosition).normalize();
            // calculate angle between two vectors. That is the angle that we need to rotate the entity by
            var angle = Math.acos(centerToInitial.dot(centerToCurrent)) * pc.math.RAD_TO_DEG;
            var cross = temp.cross(centerToInitial, centerToCurrent);
            if (cross.dot(planeNormal) < 0) {
                angle = -angle;
            }

            // Snap to closest increment
            if (this.snap !== this.overrideSnap && this.snapIncrement > 0) {
                angle = Math.round(angle / this.snapIncrement) * this.snapIncrement;
            }

            var rot = new pc.Mat4().setFromAxisAngle(planeNormal, angle);
            var updatedTransform = new pc.Mat4().mul2(rot, entityWtm);
            var inverseParentWtm = entity.getParent().getWorldTransform().clone().invert();
            updatedTransform.mul2(inverseParentWtm, updatedTransform);

            var newLocalEulerAngles = updatedTransform.getEulerAngles();

            this._setEntityAttribute('rotation', [newLocalEulerAngles.x, newLocalEulerAngles.y, newLocalEulerAngles.z], this.undoDrag);
            this.undoDrag = false;
        }

    });
})();
