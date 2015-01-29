(function () {
    pc.Gizmo = function (context) {
        this.context = context;
        this.node = new pc.GraphNode();
        this.model = null;

        this.vertexFormat = new pc.gfx.VertexFormat(context.graphicsDevice, [
            { semantic: pc.gfx.SEMANTIC_POSITION, components: 3, type: pc.gfx.ELEMENTTYPE_FLOAT32 }
        ]);

        this.axisMaterials = this._createAxisMaterials();
        this.axisMeshes = this._createAxisMeshes();
        this.entity = null;
        this.cameraEntity = null;
        this.activeAxis = null;

        // Set decent enough picker resolution for accuracy
        this.picker = new pc.scene.Picker(context.graphicsDevice, 1024, 1024);

        // create a scene which will only contain the gizmo shapes used to intersect with the cursor
        this.scene = new pc.scene.Scene();

        this.blockerMaterial = new pc.scene.BasicMaterial();
        this.blockerMaterial.redWrite = false;
        this.blockerMaterial.greenWrite = false;
        this.blockerMaterial.blueWrite = false;
        this.blockerMaterial.alphaWrite = false;
        this.blockerMaterial.update();

        this.invisibleMaterial = this._createTransparentMaterial(new pc.Color(0, 0, 0, 0));

        this.coordinateSystem = 'world';
        this.snap = false;
        this.overrideSnap = false;
        this.snapIncrement = 1;

        // holds indices of picker shapes that are considered disabled
        this.disabledShapes = [];

        this.isDragging = false;
    }

    pc.Gizmo.prototype = {
        initialize: function () {
            this.model = this._createModel();
        },

        _createBasicMaterial: function (color) {
            var material = new pc.BasicMaterial();
            material.color = color;
            material.cull = pc.CULLFACE_NONE;
            material.update();
            return material;
        },

        _createTransparentMaterial: function (color) {
            var material = new pc.BasicMaterial();
            material.color = color;
            material.blend = true;
            material.blendSrc = pc.BLENDMODE_SRC_ALPHA;
            material.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
            material.cull = pc.CULLFACE_NONE;
            material.depthTest = false;
            material.depthWrite = false;
            material.update();
            return material;
        },

        _createAxisMaterials: function () {
            var colors = [
                new pc.Color(1, 0, 0, 1),
                new pc.Color(0, 1, 0, 1),
                new pc.Color(0, 0, 1, 1)
            ];

            return colors.map(this._createBasicMaterial);
        },

        _createAxisMeshes: function () {
            var device = this.context.graphicsDevice;
            var node = this.node;
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

                meshInstances.push(this._createMeshInstance(node, mesh, this.axisMaterials[axis]));
            }

            return meshInstances;
        },

        _createMeshInstance: function (node, mesh, material) {
            var result = new pc.MeshInstance(node, mesh, material);
            result.layer = pc.LAYER_GIZMO;
            result.updateKey();
            return result;
        },

        _createModel: function () {
            return null; // derived gizmos must return the model of the gizmo
        },

        activate: function (entity) {
            if (this.entity && this.entity !== entity) {
                this.deactivate();
            }

            this.entity = entity;

            // add pick component to entity
            this.context.systems.pick.addComponent(entity, {});
            entity.pick.layer = 'gizmo';

            if (!this.context.scene.containsModel(this.model)) {
                this.context.scene.addModel(this.model);
                this.context.root.addChild(this.model.graph);
            }

            this._activate(entity);

            // add picker shapes to the current scene
            entity.pick.shapes.map(function (shape) {
                return shape.model;
            }).forEach(function (model) {
                this.scene.addModel(model);
            }.bind(this))
        },

        _activate: function (entity) {
            // implemented by derived
        },

        deactivate: function () {
            if (this.entity) {
                // remove all picker models from the scene
                // add picker shapes to the current scene
                this.entity.pick.shapes.map(function (shape) {
                    return shape.model;
                }).forEach(function (model) {
                    this.scene.removeModel(model);
                }.bind(this))

                // remove all picker shapes from pick component
                this.entity.pick.deleteShapes();
                // remove the pick component
                this.context.systems.pick.removeComponent(this.entity);

                this.entity = null;
            }

            if (this.context.scene.containsModel(this.model)) {
                this.context.scene.removeModel(this.model);
                this.context.root.removeChild(this.model.graph);
            }
        },

        setCamera: function (cameraEntity) {
            this.cameraEntity = cameraEntity;
        },

        setActiveAxis: function (axis) {
            this.activeAxis = axis;
            editor.call('3d:render');
        },

        // Sets current coordinate system. Can be 'world' or 'local'
        setCoordinateSystem: function (system) {
            this.coordinateSystem = system;
        },

        setSnap: function (snap) {
            this.snap = snap;
        },

        setSnapIncrement: function (snapIncrement) {
            this.snapIncrement = snapIncrement;
        },

        render: function () {
            if (!this.entity) {
                return;
            }

            var model = this.model;

            this._resetMaterials();

            var entity = this.entity;

            // Get the world transformation matrix of the gizmo
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

            // Update the gizmo scale to stay a constant size on screen
            var scaleFactor = this._calculateScale();

            // set transform for current gizmo
            var root = model.graph;
            root.setPosition(worldTransform.getTranslation());
            root.setEulerAngles(worldTransform.getEulerAngles());
            root.setLocalScale(worldTransform.getScale().clone().scale(scaleFactor));

            this._render(worldTransform, scaleFactor);

            // disable shapes that correspond to disabled gizmo meshes
            this._disableInvisibleShapes();
        },

        _resetMaterials: function () {
            // implemented by derived
        },

        _render: function (worldTransform, scaleFactor) {
            // implemented by derived
        },

        _calculateScale: function () {
            // Calculate scale that will make the gizmo appear the same size on screen all the time
            var scale = 1;
            var camera = this.cameraEntity.camera;

            if (camera.projection === pc.PROJECTION_PERSPECTIVE) {
                var fov = camera.fov;
                var cameraPosition = this.cameraEntity.getPosition();
                var denom = 0;
                var width = 1024;
                var height = 768;

                var distance = new pc.Vec3().sub2(this.entity.getPosition(), cameraPosition);

                var dot = distance.dot(this.cameraEntity.forward);

                denom = Math.sqrt( width * width + height * height ) * Math.tan( fov * pc.math.DEG_TO_RAD );

                scale = Math.max(0.0001, (dot / denom) * 150);
            } else {
                scale = camera.orthoHeight / 3;
            }

            return scale;
        },

        _disableInvisibleShapes: function () {
            this.disabledShapes = [];
            this.model.meshInstances.forEach(function (mesh, index) {
                if (mesh.material === this.invisibleMaterial) {
                    this.disabledShapes.push(index);
                }
            }.bind(this));
        },

        _isShapeDisabled: function (shapeIndex) {
            return this.disabledShapes.indexOf(shapeIndex) >= 0;
        },

        handleMouseDown: function (e) {
            if(e.button === pc.MOUSEBUTTON_LEFT) {
                if (this.activeAxis !== null) {
                    // prevent default event which causes selection of text
                    e.event.preventDefault();

                    this._startDrag(e);
                    this.isDragging = true;
                }
            }
        },

        handleMouseUp: function (e) {
            if(e.button === pc.input.MOUSEBUTTON_LEFT) {
                if(this.isDragging) {
                    this.isDragging = false;
                    this._endDrag();
                }
            }
        },

        handleMouseMove: function (e) {
            if (this.entity) {
                if (this.isDragging) {
                    this._handleDragging(e);
                } else if (e.event) {
                    this._handleHovering(e);
                }
            }
        },

        _handleDragging: function (e) {
            this.overrideSnap = e.shiftKey;
            this._drag(e);
        },

        _startDrag: function (e) {
            // implemented by derived
        },

        _endDrag: function (e) {
            // implemented by derived
        },

        _drag: function (e) {
            // implemented by derived
        },

        _handleHovering: function (e) {
            // check to see if the mouse is over the canvas still.
            // Click coordinates are with reference to a top left origin, so
            // convert to a bottom left origin that PlayCanvas (and WebGL) uses.
            var x = e.x;
            var y = e.element.height - e.y;

            var camera = this.cameraEntity.camera.camera;
            var vp = camera.getRect();
            var gd = this.context.graphicsDevice;
            var dw = gd.width;
            var dh = gd.height;
            var vpx = vp.x * dw;
            var vpy = vp.y * dh;
            var vpw = vp.width * dw;
            var vph = vp.height * dh;

            // Ignore if we're hovering outside the active viewport
            if ((x >= vpx) && (x < (vpx + vpw)) &&
                (y >= vpy) && (y < (vpy + vph))) {
                // Check we've got a current camera set on the view model (a pack must be loaded)
                if ((vpw !== this.picker.width) || (vph !== this.picker.height)) {
                    this.picker.resize(vpw, vph);
                }

                this.picker.prepare(camera, this.scene);

                var selection = this.picker.getSelection({
                    x: x - vpx,
                    y: y - vpy
                });

                // find the active axis - the index of the shape
                // that is currently being hovered
                var activeAxis = null;

                if (selection.length > 0) {
                    var shapes = this.entity.pick.shapes;
                    for (var i = 0; i < shapes.length; i++) {
                        if (this._isShapeDisabled(i)) {
                            continue;
                        }

                        if (selection[0] === shapes[i].model.meshInstances[0]) {
                            activeAxis = i;
                        }
                    }
                }

                this.setActiveAxis(activeAxis);
            }
        },

        _setEntityAttribute: function (attribute, value, undo) {
            var entity = editor.call('entities:get', this.entity.getGuid());
            if (entity) {
                entity.history.combine = !undo;
                entity.set(attribute, value);
            }
        },

        _screenToNearClipCoord: function (x, y) {
            var cameraEntity = this.cameraEntity;
            var camera = cameraEntity.camera.camera;
            var vp = camera.getRect();
            var gd = this.context.graphicsDevice;
            var dw = gd.width;
            var dh = gd.height;
            var vpx = vp.x * dw;
            var vpy = vp.y * dh;
            var vpw = vp.width * dw;
            var vph = vp.height * dh;

            var nearClip = cameraEntity.camera.nearClip;

            var viewWindow = new pc.Vec2();
            switch (cameraEntity.camera.projection) {
                case pc.scene.PROJECTION_ORTHOGRAPHIC:
                    viewWindow.x = cameraEntity.camera.orthoHeight * cameraEntity.camera.aspectRatio;
                    viewWindow.y = cameraEntity.camera.orthoHeight;
                    break;
                case pc.scene.PROJECTION_PERSPECTIVE:
                    var fov = cameraEntity.camera.fov;
                    viewWindow.y = nearClip * Math.tan(fov * 0.5 * Math.PI / 180);
                    viewWindow.x = viewWindow.y * vpw / vph;
                    break;
                default:
                    break;
            }

            var eye = cameraEntity.getPosition().clone();
            var lookDir = cameraEntity.forward.scale(nearClip);

            var scaleX = viewWindow.x * (((vpw - x) / vpw) * 2 - 1);
            var xOffset = cameraEntity.right.scale(-scaleX);

            var scaleY = viewWindow.y * (((vph - y) / vph) * 2 - 1);
            var yOffset = cameraEntity.up.scale(scaleY);

            return eye.add(lookDir).add(xOffset).add(yOffset);
        }
    };
})();
