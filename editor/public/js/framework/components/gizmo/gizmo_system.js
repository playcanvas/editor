pc.extend(pc.designer, function() {
    var DRAG_SCALE_FACTOR = 0.5;

    var GizmoComponentSystem = function GizmoComponentSystem(context) {
        this.id = 'gizmo'
        this.context.systems.add(this.id, this);

        this.ComponentType = pc.designer.GizmoComponent;
        this.DataType = pc.designer.GizmoComponentData;

        this.schema = [{
            name: 'gizmoType',
            expose: false
        }, {
            name: 'activeAxis',
            expose: false
        }];

        // Set decent enough picker resolution for accuracy
        this.picker = new pc.scene.Picker(context.graphicsDevice, 1024, 1024);
        this.gizmoScene = new pc.scene.Scene();

        this.selection = []; // list of currently selected entities
        this.activeGizmo = null; // the active entity
        this.currentType = pc.designer.GizmoComponentSystem.GizmoType.TRANSLATE; // current transformation mode
        this.currentCoordSys = pc.designer.GizmoComponentSystem.GizmoCoordSys.WORLD; // current transformation mode

        this.renderable = new pc.designer.graphics.Gizmo(context); // graphics object used to render the current gizmo

        // Store state data if an gizmo is being dragged
        this.draggingState = null;

        // Controls snap to increment
        this.snapEnabled = false;
        this.snapEnabledOverride = false;
        this.snapTranslationIncrement = 1;
        this.snapRotationIncrement = 5;
        this.snapScaleIncrement = 1;

        // If the mouse is hovering over a gizmo this will store the {entity, axis};
        this.hoveredGizmo = {
            entity: null,
            axis: -1
        };
        // If the mouse if hovering over an entity this will store the entity;
        this.clickedEntity = null;

        // Rendering methods
        this.renders = {};
        this.renders[pc.designer.GizmoComponentSystem.GizmoType.TRANSLATE] = this._renderTranslateGizmo;
        this.renders[pc.designer.GizmoComponentSystem.GizmoType.ROTATE] = this._renderRotateGizmo;
        this.renders[pc.designer.GizmoComponentSystem.GizmoType.SCALE] = this._renderScaleGizmo;

        this.disabledPickerShapes = {};

        pc.fw.ComponentSystem.bind('toolsUpdate', this.onUpdate.bind(this));
        this.bind('remove', this.onRemove.bind(this));
    };
    GizmoComponentSystem = pc.inherits(GizmoComponentSystem, pc.fw.ComponentSystem);

    GizmoComponentSystem.GizmoType = {
        TRANSLATE: 'position',
        ROTATE: 'rotation',
        SCALE: 'scale'
    };

    GizmoComponentSystem.GizmoCoordSys = {
        WORLD: 'world',
        LOCAL: 'local'
    };

    pc.extend(GizmoComponentSystem.prototype, {
        initializeComponentData: function (component, data, properties) {
            // Add a pick component to the gizmo
            this.context.systems.pick.addComponent(component.entity, {});
            component.entity.pick.layer = 'gizmo';

            // initialize
            properties = ['gizmoType']
            GizmoComponentSystem._super.initializeComponentData.call(this, component, data, properties);
        },

        onRemove: function (entity, data) {
            // remove the pick component
            this.context.systems.pick.removeComponent(entity);
        },

        onUpdate: function (dt) {
            var id, components = this.store;
            for (id in components) {
                if (components.hasOwnProperty(id)) {
                    var entity = components[id].entity;

                    this.renders[this.currentType].call(this, entity);
                }
            }
        },

        _renderTranslateGizmo: function (entity) {
            // Get the world transformation matrix of the gizmo
            var position = entity.getPosition();
            var rotation = entity.getRotation();
            var wtm = new pc.Mat4();
            var x,y,z;

            if (this.currentCoordSys === GizmoComponentSystem.GizmoCoordSys.WORLD) {
                wtm.setTRS(position, pc.Quat.IDENTITY, pc.Vec3.ONE);
            } else {
                wtm.setTRS(position, rotation, pc.Vec3.ONE);
            }

            // Update the gizmo scale to stay a constant size on screen
            var scaleFactor = this._calculateGizmoScale(position);
            var gizmoScale = new pc.Mat4().setScale(scaleFactor, scaleFactor, scaleFactor);

            var transform = new pc.Mat4().mul2(wtm, gizmoScale);

            // Get the shapes from the Pick Component
            var shapes = entity.pick.shapes;

            // Update the transforms of all shapes in the Pick Component to stay a constant size on screen
            var scale = new pc.Mat4().setScale(scaleFactor * 1.3, scaleFactor * 0.15, scaleFactor * 0.15);
            var translate = new pc.Mat4().setTranslate(scaleFactor * 0.65, 0, 0);
            translate.mul2(wtm, translate);
            shapes[0].shape.transform.mul2(translate, scale);

            scale.setScale(scaleFactor * 0.15, scaleFactor * 1.3, scaleFactor * 0.15);
            translate.setTranslate(0, scaleFactor * 0.65,0);
            translate.mul2(wtm, translate);
            shapes[1].shape.transform.mul2(translate, scale);

            scale.setScale(scaleFactor * 0.15, scaleFactor * 0.15, scaleFactor * 1.3);
            translate.setTranslate(0, 0, scaleFactor * 0.65);
            translate.mul2(wtm, translate);
            shapes[2].shape.transform.mul2(translate, scale);

            var planeSize = 0.4;

            var temp = new pc.Vec3();

            var axes = [
                transform.getX().normalize(),
                transform.getY().normalize(),
                transform.getZ().normalize()
            ];

            // update the shapes of the multi-axis planes depending on where we're looking from
            var lookDir = transform.getTranslation().sub(this.camera.getPosition()).normalize();
            var isUnderZ = temp.cross(lookDir, axes[0]).dot(axes[2]) < 0;
            var isLeftOfX = temp.cross(lookDir, axes[0]).dot(axes[1]) > 0;
            var isLeftOfZ = temp.cross(lookDir, axes[2]).dot(axes[1]) > 0;

            scale = (new pc.Mat4).setScale(scaleFactor * planeSize, scaleFactor * planeSize, scaleFactor * planeSize * 0.1);

            x = isLeftOfZ ? 1 : -1;
            y = isUnderZ ? -1 : 1;
            translate = new pc.Mat4().setTranslate(x * scaleFactor * planeSize*0.5, y * scaleFactor * planeSize*0.5, 0);
            translate.mul2(wtm, translate);
            shapes[3].shape.transform.mul2(translate, scale);

            scale = (new pc.Mat4).setScale(scaleFactor * planeSize * 0.1, scaleFactor * planeSize, scaleFactor * planeSize);

            y = isUnderZ ? -1 : 1;
            z = isLeftOfX ? -1 : 1;
            translate = new pc.Mat4().setTranslate(0, y * scaleFactor * planeSize*0.5, z * scaleFactor * planeSize*0.5);
            translate.mul2(wtm, translate);
            shapes[4].shape.transform.mul2(translate, scale);

            scale = (new pc.Mat4).setScale(scaleFactor * planeSize, scaleFactor * planeSize * 0.1, scaleFactor * planeSize);
            x = isLeftOfZ ? 1 : -1;
            z = isLeftOfX ? -1 : 1;
            translate = new pc.Mat4().setTranslate(x * scaleFactor * planeSize*0.5, 0, z * scaleFactor * planeSize*0.5);
            translate.mul2(wtm, translate);
            shapes[5].shape.transform.mul2(translate, scale);

            // Update model transforms
            for (var i = 0; i < 6; i++) {
                shapes[i].model.getGraph().getWorldTransform().copy(shapes[i].shape.transform);
            }

            this.renderable.render(
                pc.designer.graphics.GizmoMode.TRANSLATE,
                transform,
                entity.gizmo.activeAxis,
                this.camera.getWorldTransform()
            );

            // disable shapes that correspond to disabled gizmo meshes
            for (var i=0; i<shapes.length; i++) {
                delete this.disabledPickerShapes[shapes[i].shapeName];
            }

            var indices = this.renderable.getIndicesOfDisabledGizmoMeshes(pc.designer.graphics.GizmoMode.TRANSLATE);
            for (var i=0; i<indices.length; i++) {
                var index = indices[i];
                if (index < shapes.length) {
                    this.disabledPickerShapes[shapes[index].shapeName] = true;
                }
            }
        },

        _renderRotateGizmo: function (entity) {
            // Get the world transformation matrix of the gizmo
            var position = entity.getPosition();
            var rotation = entity.getRotation();
            var wtm = new pc.Mat4();

            if (this.currentCoordSys === GizmoComponentSystem.GizmoCoordSys.WORLD) {
                wtm.setTRS(position, pc.Quat.IDENTITY, pc.Vec3.ONE);
            } else {
                wtm.setTRS(position, rotation, pc.Vec3.ONE);
            }

            // Update the gizmo scale to stay a constant size on screen
            var scaleFactor = this._calculateGizmoScale(position);
            var gizmoScale = new pc.Mat4().setScale(scaleFactor, scaleFactor, scaleFactor);

            // Get the shapes from the Pick Component
            var shapes = entity.pick.shapes;

            // x
            var rotate = new pc.Mat4().setFromAxisAngle(pc.Vec3.BACK, 90);
            rotate.mul2(wtm, rotate);
            shapes[0].shape.transform.mul2(rotate, gizmoScale);

            // y
            shapes[1].shape.transform.mul2(wtm, gizmoScale);

            // z
            rotate.setFromAxisAngle(pc.Vec3.RIGHT, 90);
            rotate.mul2(wtm, rotate);
            shapes[2].shape.transform.mul2(rotate, gizmoScale);

            // Update model transforms
            for (var i = 0; i < 3; i++) {
                shapes[i].model.getGraph().getWorldTransform().copy(shapes[i].shape.transform);
            }

            this.renderable.render(
                pc.designer.graphics.GizmoMode.ROTATE,
                shapes[1].shape.transform,
                entity.gizmo.activeAxis,
                this.camera.getWorldTransform()
            );

            // disable shapes that correspond to disabled gizmo meshes
            for (var i=0; i<shapes.length; i++) {
                delete this.disabledPickerShapes[shapes[i].shapeName];
            }

            var indices = this.renderable.getIndicesOfDisabledGizmoMeshes(pc.designer.graphics.GizmoMode.ROTATE);
            for (var i=0; i<indices.length; i++) {
                var index = indices[i];
                if (index < shapes.length) {
                    this.disabledPickerShapes[shapes[index].shapeName] = true;
                }
            }
        },

        _renderScaleGizmo: function (entity) {
            // Get the world transformation matrix of the gizmo
            var position = entity.getPosition();
            var rotation = entity.getRotation();
            var wtm = new pc.Mat4();
            wtm.setTRS(position, rotation, pc.Vec3.ONE);

            // Update the gizmo scale to stay a constant size on screen
            var scaleFactor = this._calculateGizmoScale(position);
            var gizmoScale = new pc.Mat4().setScale(scaleFactor, scaleFactor, scaleFactor);

            // Get the shapes from the Pick Component
            var shapes = entity.pick.shapes;

            // Update the transforms of all shapes in the Pick Component to stay a constant size on screen
            var scale = new pc.Mat4().setScale(scaleFactor * 1.1, scaleFactor * 0.15, scaleFactor * 0.15);
            var translate = new pc.Mat4().setTranslate(scaleFactor * 0.7, 0, 0);
            translate.mul2(wtm, translate);
            shapes[0].shape.transform.mul2(translate, scale);

            scale.setScale(scaleFactor * 0.15, scaleFactor * 1.1, scaleFactor * 0.15);
            translate.setTranslate(0, scaleFactor * 0.7,0);
            translate.mul2(wtm, translate);
            shapes[1].shape.transform.mul2(translate, scale);

            scale.setScale(scaleFactor * 0.15, scaleFactor * 0.15, scaleFactor * 1.1);
            translate.setTranslate(0, 0, scaleFactor * 0.7);
            translate.mul2(wtm, translate);
            shapes[2].shape.transform.mul2(translate, scale);

            scale.setScale(scaleFactor * 0.3, scaleFactor * 0.3, scaleFactor * 0.3);
            translate.setTranslate(0,0,0);
            translate.mul2(wtm, translate);
            shapes[3].shape.transform.mul2(translate, scale);

            // Update model transforms
            for (var i = 0; i < 4; i++) {
                shapes[i].model.getGraph().getWorldTransform().copy(shapes[i].shape.transform);
            }

            var transform = new pc.Mat4().mul2(wtm, gizmoScale);

            this.renderable.render(
                pc.designer.graphics.GizmoMode.SCALE,
                transform,
                entity.gizmo.activeAxis,
                this.camera.getWorldTransform()
            );

            // disable shapes that correspond to disabled gizmo meshes
            for (var i=0; i<shapes.length; i++) {
                delete this.disabledPickerShapes[shapes[i].shapeName];
            }

            var indices = this.renderable.getIndicesOfDisabledGizmoMeshes(pc.designer.graphics.GizmoMode.SCALE);
            for (var i=0; i<indices.length; i++) {
                var index = indices[i];
                if (index < shapes.length) {
                    this.disabledPickerShapes[shapes[index].shapeName] = true;
                }
            }
        }
    });

    GizmoComponentSystem.prototype.setSelection = function (selection) {
        var i;
        var length;

        length = this.selection.length;
        for(i = 0 ; i < length ; ++i) {
            this.deselectEntity(this.selection[i]);
        }

        this.selection = selection;
        length = selection.length;
        for(i = 0; i < length; ++i) {
            this.selectEntity(this.selection[i]);
        }
    }

    /**
     * @name pc.designer.GizmoComponentSystem#setCurrentGizmoType
     * @description Set the type (translate, rotate, scale) of the current gizmo
     * @param {pc.designer.GizmoComponentSystem.GizmoType} type The type of the gizmo
     */
    GizmoComponentSystem.prototype.setCurrentGizmoType = function (type) {
        this.currentType = type;
        this.activeGizmo.gizmo.gizmoType = this.currentType;
    };

    /**
     * @name pc.designer.GizmoComponentSystem#setCurrentGizmoType
     * @description Set the type (translate, rotate, scale) of the current gizmo
     * @param {pc.designer.GizmoComponentSystem.GizmoType} type The type of the gizmo
     */
    GizmoComponentSystem.prototype.setCurrentGizmoCoordSys = function (coordSys) {
        this.currentCoordSys = coordSys;
    };

    /**
     * @name pc.designer.GizmoComponentSystem#setActiveGizmoCoordSys
     * @description Sets the currently active gizmo type to either translate, rotate or scale.
     */
    GizmoComponentSystem.prototype.setActiveGizmoCoordSys = function (coordSys) {
        this.context.systems.gizmo.setCurrentGizmoCoordSys(coordSys);
    };

    /**
     * @name pc.designer.GizmoComponentSystem#setSnapToClosestIncrement
     * @description Enables / disables snap to closest increment mode for gizmos
     */
    GizmoComponentSystem.prototype.setSnapToClosestIncrement = function (snap) {
        this.snapEnabled = snap;
    };

    /**
     * @name pc.designer.GizmoComponentSystem#setTranslationSnapIncrement
     * @description Set the increment for snap to closest increment mode when translating
     */
    GizmoComponentSystem.prototype.setTranslationSnapIncrement = function (increment) {
        this.snapTranslationIncrement = increment;
    };

    /**
     * @name pc.designer.GizmoComponentSystem#setRotationSnapIncrement
     * @description Set the increment for snap to closest increment mode when rotating
     */
    GizmoComponentSystem.prototype.setRotationSnapIncrement = function (increment) {
        this.snapRotationIncrement = increment;
    };

    /**
     * @name pc.designer.GizmoComponentSystem#setScalingSnapIncrement
     * @description Set the increment for snap to closest increment mode when scaling
     */
    GizmoComponentSystem.prototype.setScalingSnapIncrement = function (increment) {
        this.snapScaleIncrement = increment;
    };

    /**
     * @name pc.designer.GizmoComponentSystem#selectEntity
     * @description Make an entity the currently selected one, by adding a gizmo Component and setting it to be the activeGizmo
     * @param {pc.fw.Entity} entity The entity to select
     */
    GizmoComponentSystem.prototype.selectEntity = function (entity) {
        if(!entity.gizmo) {
            this.addComponent(entity, {gizmoType: this.currentType});
            this.activeGizmo = entity;
        }
    };

    /**
     * @name pc.designer.GizmoComponentSystem#deselectEntity
     * @description Stop an entity being the active Entity by deleting the gizmo Component and setting the activeGizmo to null
     * @param {pc.fw.Entity} entity The entity to deselect
     */
    GizmoComponentSystem.prototype.deselectEntity = function(entity) {
        if(entity.gizmo) {
            this.renderable.destroy();
            this.removeComponent(entity);
            this.activeGizmo = null;
        }
    };

    GizmoComponentSystem.prototype.setCamera = function (camera) {
        this.camera = camera;
    };

    GizmoComponentSystem.prototype.handleUpdateMessage = function (entity, name, value) {
        if (this.hasComponent(entity)) {
            this.entityState[name] = value;
        }
    };

    GizmoComponentSystem.prototype.handleMouseDown = function (event) {
        if(event.button === pc.input.MOUSEBUTTON_LEFT) {
            if(this.hoveredGizmo.entity) {
                // prevent default event which causes selection of text
                event.event.preventDefault();
                this.startDrag(this.hoveredGizmo.entity, event.x, event.y, this.hoveredGizmo.axis);
            }
        }
    };

    GizmoComponentSystem.prototype.handleMouseUp = function (event) {
        if(event.button === pc.input.MOUSEBUTTON_LEFT) {
            if(this.draggingState) {
                this.endDrag();
            }
            this.clickedEntity = null;
        }
    };

    GizmoComponentSystem.prototype.handleMouseMove = function (event) {
        if (this.draggingState) {
            // Dragging
            if(this.draggingState.entity) {
                this.snapEnabledOverride = event.shiftKey;
                this.dragGizmo(event.x, event.y);
                return;
            }
        } else if (event.event) { // check to see if the mouse is over the canvas still.
            // Click coordinates are with reference to a top left origin, so
            // convert to a bottom left origin that PlayCanvas (and WebGL) uses.
            var coords = {
                x: event.x,
                y: event.element.height - event.y
            };

            var cameraEntity = this.camera;
            if (cameraEntity) {
                var camera = cameraEntity.camera.camera;
                var vp = camera.getRect();
                var gd = this.context.graphicsDevice;
                var dw = gd.width;
                var dh = gd.height;
                var vpx = vp.x * dw;
                var vpy = vp.y * dh;
                var vpw = vp.width * dw;
                var vph = vp.height * dh;

                // Ignore if we're hovering outside the active viewport
                if ((coords.x >= vpx) && (coords.x < (vpx + vpw)) &&
                    (coords.y >= vpy) && (coords.y < (vpy + vph))) {
                    // Check we've got a current camera set on the view model (a pack must be loaded)
                    if ((vpw !== this.picker.width) || (vph !== this.picker.height)) {
                        this.picker.resize(vpw, vph);
                    }

                    var gizmoModels = this.context.systems.pick.getLayerModels('gizmo');
                    if (gizmoModels) {
                        for (var i = 0; i < gizmoModels.length; i++) {
                            this.gizmoScene.addModel(gizmoModels[i]);
                        }

                        this.picker.prepare(camera, this.gizmoScene);
                        var selection = this.picker.getSelection({ x: coords.x - vpx, y: coords.y - vpy });
                        var idx = -1;

                        if (selection.length > 0) {
                            var idx = -1;
                            var shapes = selection[0]._entity.pick.shapes;
                            for (var i = 0; i < shapes.length; i++) {
                                if (this.disabledPickerShapes[shapes[i].shapeName]) {
                                    continue;
                                }

                                if (selection[0] === shapes[i].model.meshInstances[0]) {
                                    if (shapes[i].shapeName === 'X') {
                                        idx = 0;
                                    } else if (shapes[i].shapeName === 'Y') {
                                        idx = 1;
                                    } else if (shapes[i].shapeName === 'Z') {
                                        idx = 2;
                                    } else if (shapes[i].shapeName === 'XY' || shapes[i].shapeName === 'C') {
                                        idx = 3;
                                    } else if (shapes[i].shapeName === 'YZ') {
                                        idx = 4;
                                    } else if (shapes[i].shapeName === 'ZX') {
                                        idx = 5;
                                    }
                                }
                            }
                        }

                        if (idx >= 0) {
                            this.hoveredGizmo = {
                                entity: selection[0]._entity,
                                axis: idx
                            };
                            if (this.hoveredGizmo.entity) {
                                this.hoveredGizmo.entity.gizmo.activeAxis = idx;
                                //this.set(this.hoveredGizmo.entity, 'activeAxis', idx);
                            }
                        } else {
                            if (this.hoveredGizmo.entity && this.hoveredGizmo.entity.gizmo) {
                                this.hoveredGizmo.entity.gizmo.activeAxis = -1;
                                //this.set(this.hoveredGizmo.entity, 'activeAxis', -1);
                            }
                            this.hoveredGizmo = {
                                entity: null,
                                axis: -1
                            }
                        }

                        for (var i = 0; i < gizmoModels.length; i++) {
                            this.gizmoScene.removeModel(gizmoModels[i]);
                        }
                    }
                }
            }
        }
    };

    GizmoComponentSystem.prototype.startDrag = function (entity, x, y, axis) {
        // runtime designer application stores transform components on the entity object for the tools
        var original = entity['_$' + this.currentType];

        if (!original) {
            logERROR("Transform Components ('_$position', '_$rotation', '_$scale') not found on entity object, Gizmo Component will not work.");
        }

        // Store dragging state
        this.draggingState = {
            startX: x,
            startY: y,
            type: this.currentType,
            axis: axis,
            entity: entity,
            originalTransform: entity.getWorldTransform().clone(),
            original: new pc.Vec3(original[0], original[1], original[2]),
            current: new pc.Vec3(original[0], original[1], original[2])
        };
    };

    GizmoComponentSystem.prototype.dragGizmo = function (x, y) {
        switch(this.currentType) {
            case GizmoComponentSystem.GizmoType.TRANSLATE: {
                this._dragTranslateStyleControl(x, y, this.snapTranslationIncrement);
                break;
            };
            case GizmoComponentSystem.GizmoType.ROTATE: {
                this._dragRotateStyleControl(x, y, this.snapRotationIncrement);
                break;
            };
            case GizmoComponentSystem.GizmoType.SCALE: {
                this._dragScaleStyleControl(x, y, this.snapScaleIncrement);
                break;
            };
        }
    };

    GizmoComponentSystem.prototype.endDrag = function () {
        // Send final transform back to web application, include the original transform to use as the base for undo.
        var undoable = true;

        var newValue = this.draggingState.current;
        var oldValue = this.draggingState.original;
        pc.designer.api.setEntityTransformComponent(this.draggingState.entity, this.draggingState.type, newValue, undoable, oldValue);

        // clear dragging state
        this.draggingState = null;
    };

    GizmoComponentSystem.prototype._isSnapEnabled = function () {
        return this.snapEnabled !== this.snapEnabledOverride;
    };

    /**
     * @private
     * @name pc.designer.GizmoComponentSystem#_dragTranslateStyleControl
     * @description Update from a mousemove event, processes dragging the translate gizmo
     * @param {Number} x The x coord of the mouse
     * @param {Number} y The y coord of the mouse
     * @param {Number} snapIncrement The closest increment to snap the world coordinates to
     */
    GizmoComponentSystem.prototype._dragTranslateStyleControl = function (x, y, snapIncrement) {
        var cameraEntity = this.camera;
        var entityWtm = this.draggingState.originalTransform;

        // Calculate the world space coordinate of the click coordinate in the camera's projection plane
        var currentNearClipCoord = this._screenToNearClipCoord(x, y);
        var initialNearClipCoord = this._screenToNearClipCoord(this.draggingState.startX, this.draggingState.startY);

        // Setup our axes depending on the current coordinate system
        var refWorld = (this.currentCoordSys === GizmoComponentSystem.GizmoCoordSys.WORLD);
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

        var planeNormal;
        var lookDir = cameraEntity.forward;

        // Get the normal for the plane that constitutes the plane of movement for the gizmo
        var axis = this.draggingState.axis;
        if (axis == 0) {
            planeNormal = (Math.abs(axes[1].dot(lookDir)) > Math.abs(axes[2].dot(lookDir))) ? axes[1] : axes[2];
        } else if (axis == 1) {
            planeNormal = (Math.abs(axes[0].dot(lookDir)) > Math.abs(axes[2].dot(lookDir))) ? axes[0] : axes[2];
        } else if (axis == 2) {
            planeNormal = (Math.abs(axes[0].dot(lookDir)) > Math.abs(axes[1].dot(lookDir))) ? axes[0] : axes[1];
        } else if (axis == 3) {
            planeNormal = axes[2];
        } else if (axis == 4) {
            planeNormal = axes[0];
        } else if (axis == 5) {
            planeNormal = axes[1];
        }

        var entityPosition = entityWtm.getTranslation();

        var plane = new pc.shape.Plane(entityPosition, planeNormal);

        // Find the intersection point from the camera position to the plane for the initial mouse position and the current position
        var eyePosition = cameraEntity.getPosition();
        if (cameraEntity.camera.projection === pc.scene.Projection.PERSPECTIVE) {
            var currentIntersection = plane.intersectPosition(eyePosition, currentNearClipCoord);
            var initialIntersection = plane.intersectPosition(eyePosition, initialNearClipCoord);
        } else {
            var temp = currentNearClipCoord.clone().add(lookDir);
            var currentIntersection = plane.intersectPosition(currentNearClipCoord, temp);
            temp.add2(initialNearClipCoord, lookDir);
            var initialIntersection = plane.intersectPosition(initialNearClipCoord, temp);
        }

        // the difference of those two points is the translation that we want to apply
        var translate = currentIntersection.clone().sub(initialIntersection);

        // if we're only moving on one axis then project the translation vector on that axis
        if (axis <= 2) {
            translate.project(axes[axis]);
        }

        // Snap the translation to the closest increment if necessary
        if (this._isSnapEnabled() && snapIncrement > 0) {
            // if we're only moving on 1 axis then snap the length of the translation vector
            if (axis <= 2) {
                var amount = translate.length();

                if (amount > 0) {
                    var scale = Math.round(amount / snapIncrement) * snapIncrement / amount;
                    translate.scale(scale);
                }
            } else {
                // if we're moving on multiple axes then snap to
                // the horizontal and vertical components of the active axes
                var horizontal, vertical;
                switch (axis) {
                    case 3:
                        horizontal = axes[0]; vertical = axes[1];
                        break;
                    case 4:
                        horizontal = axes[1]; vertical = axes[2];
                        break;
                    case 5:
                        horizontal = axes[0]; vertical = axes[2];
                        break;
                }

                var h = translate.clone().project(horizontal);
                var amount = h.length();
                if (amount > 0) {
                    h.scale(Math.round(amount / snapIncrement) * snapIncrement / amount);
                }

                var v = translate.clone().project(vertical);
                amount = v.length();
                if (amount > 0) {
                    v.scale(Math.round(amount / snapIncrement) * snapIncrement / amount);
                }

                translate.add2(h, v);
            }
        }

        // Send new position back to the web application
        var undoable = false; // Don't want to flood the undo stack with dragging data
        var updatedTransform = new pc.Mat4().setTranslate(translate.x, translate.y, translate.z).mul(this.draggingState.originalTransform);
        var inverseParentWtm = this.draggingState.entity.getParent().getWorldTransform().clone().invert();
        updatedTransform.mul2(inverseParentWtm, updatedTransform);

        var newValue = updatedTransform.getTranslation();

        this.draggingState.current = newValue;

        pc.designer.api.setEntityTransformComponent(this.draggingState.entity, GizmoComponentSystem.GizmoType.TRANSLATE, newValue, undoable);
    };

    /**
     * @private
     * @name pc.designer.GizmoComponentSystem#_dragTranslateStyleControl
     * @description Update from a mousemove event, processes dragging the scale gizmo
     * @param {Number} x The x coord of the mouse
     * @param {Number} y The y coord of the mouse
     * @param {Number} snapIncrement The closest increment to snap the world coordinates to
     */
    GizmoComponentSystem.prototype._dragScaleStyleControl = function (x, y, snapIncrement) {
        var cameraEntity = this.camera;
        var entityWtm = this.draggingState.originalTransform;

        // Calculate the world space coordinate of the click coordinate in the camera's projection plane
        var currentNearClipCoord = this._screenToNearClipCoord(x, y);
        var initialNearClipCoord = this._screenToNearClipCoord(this.draggingState.startX, this.draggingState.startY);

        // Setup our axes depending on the current coordinate system
        var axes = []
        axes[0] = entityWtm.getX().normalize();
        axes[1] = entityWtm.getY().normalize();
        axes[2] = entityWtm.getZ().normalize();

        var planeNormal;
        var lookDir = cameraEntity.forward;

        // Get the normal for the plane that constitutes the plane of movement for the gizmo
        var axis = this.draggingState.axis;
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
        if (cameraEntity.camera.projection === pc.scene.Projection.PERSPECTIVE) {
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
            axisToProjectOn = this.draggingState.original.clone().normalize();
        } else {
            axisToProjectOn = axes[axis];
        }

        // Project the scale vector on the axis we're moving on
        scale.project(axisToProjectOn);

        // transform the scale vector to the entity's local space
        if (axis < 3) {
            var entityRotation = this.draggingState.entity.getRotation();
            // use a transformation matrix with scaling equal to [1,1,1]
            // so that it doesn't affect the scaling speed of the gizmo
            var inverseEntityWtm = new pc.Mat4().setTRS(entityPosition, entityRotation, pc.Vec3.ONE).invert();
            inverseEntityWtm.transformVector(scale, scale);
        }

        // Snap the translation to the closest increment if necessary
        if (this._isSnapEnabled() && snapIncrement > 0) {
            if (axis < 3) {
                var amount = scale.length();
                if (amount > 0) {
                    scale.scale(Math.round(amount / snapIncrement) * snapIncrement / amount);
                }
            } else {
                for (var i=0; i<3; i++) {
                    scale.data[i] = Math.round(scale.data[i] / snapIncrement) * snapIncrement;
                }
            }
        }

        // Send new position back to the web application
        var undoable = false; // Don't want to flood the undo stack with dragging data
        var newValue = this.draggingState.original.clone().add(scale);

        this.draggingState.current = newValue;

        pc.designer.api.setEntityTransformComponent(this.draggingState.entity, GizmoComponentSystem.GizmoType.SCALE, newValue, undoable);
    };

    GizmoComponentSystem.prototype._dragRotateStyleControl = function (x, y, snapIncrement) {
        // STEP 1: Calculate the world space coordinate of the click coordinate in the camera's projection plane
        var currentNearClipCoord = this._screenToNearClipCoord(x, y);
        var initialNearClipCoord = this._screenToNearClipCoord(this.draggingState.startX, this.draggingState.startY);

        // STEP 2: Calculate the world space intersection point of click 'ray' and the plane
        // that constitutes the plane of movement for the gizmo
        var cameraEntity = this.camera;
        var eyePosition = cameraEntity.getPosition();
        var lookDir = cameraEntity.forward;
        var entityWtm = this.draggingState.originalTransform;
        var temp = new pc.Vec3();

        var refWorld = (this.currentCoordSys === GizmoComponentSystem.GizmoCoordSys.WORLD);
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
        var planeNormal = axes[this.draggingState.axis];
        var plane = new pc.shape.Plane(planePoint, planeNormal);

        if (cameraEntity.camera.projection === pc.scene.Projection.PERSPECTIVE) {
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

        // STEP 4: Snap to closest increment
        if (this._isSnapEnabled() && snapIncrement > 0) {
            angle = Math.round(angle / snapIncrement) * snapIncrement;
        }

        var entity = this.draggingState.entity;
        var rot = new pc.Mat4().setFromAxisAngle(planeNormal, angle);
        var updatedTransform = new pc.Mat4().mul2(rot, entityWtm);
        var inverseParentWtm = entity.getParent().getWorldTransform().clone().invert();
        updatedTransform.mul2(inverseParentWtm, updatedTransform);

        var newValue = updatedTransform.getEulerAngles();

        // send rotation back to designer web application
        var undoable = false; // Don't want to flood the undo stack with dragging data
        this.draggingState.current = newValue;

        pc.designer.api.setEntityTransformComponent(entity, GizmoComponentSystem.GizmoType.ROTATE, newValue, undoable);
    };

    /**
     * @private
     * @name pc.designer.GizmoComponentSystem#_calculateGizmoScale
     * @description Work out the scale value for the gizmo in relation to the current camera, so that the gizmo
     * will always render at the same size
     */
    GizmoComponentSystem.prototype._calculateGizmoScale = function (position) {
        var scale = 1;

        var cameraEntity = this.camera;
        var cameraTransform = cameraEntity.getWorldTransform();

        if (cameraEntity.camera.projection === pc.scene.Projection.PERSPECTIVE) {
            var fov = cameraEntity.camera.fov;
            var cameraPosition = cameraEntity.getPosition();
            var distance = new pc.Vec3();
            var denom = 0;
            var width = 1024;
            var height = 768;

            distance.sub2(position, cameraPosition);
            distance = -distance.dot(cameraTransform.getZ());

            denom = Math.sqrt( width * width + height * height ) * Math.tan( fov * pc.math.DEG_TO_RAD );

            scale = Math.max(0.0001, (distance / denom) * 150);
        } else {
            var vwy = cameraEntity.camera.orthoHeight;
            scale = vwy / 3;
        }

        return scale;
    };

    GizmoComponentSystem.prototype._screenToNearClipCoord = function (x, y) {
        var cameraEntity = this.camera;
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
            case pc.scene.Projection.ORTHOGRAPHIC:
                viewWindow.x = cameraEntity.camera.orthoHeight * cameraEntity.camera.aspectRatio;
                viewWindow.y = cameraEntity.camera.orthoHeight;
                break;
            case pc.scene.Projection.PERSPECTIVE:
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
    };

    return {
        GizmoComponentSystem: GizmoComponentSystem
    };
}());
