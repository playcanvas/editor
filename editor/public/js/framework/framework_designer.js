/**
 * @namespace All code related to integrating the PlayCanvas Designer tool with the engine.
 * @name pc.designer
 * @private
 * @preserve PlayCanvas Designer Framework
 * http://playcanvas.com
 * Copyright 2011-2015 PlayCanvas Ltd. All rights reserved.
 * Do not distribute.
 */
pc.designer = pc.designer || {};
pc.extend(pc.designer, function() {
    // Private members

    // Public Interface
    /**
     * @name pc.designer.Designer
     * @class The {@link pc.Application} that runs the 3D view in the Designer. Often referred to as the 'runtime application' as opposed to the 'web application'
     * @param {Object} canvas
     * @param {Object} options
     * @extends pc.Designer
     * @private
     */
    var Designer = function (canvas, options) {
        this._inTools = true;

        var context = this.context;

        this.gizmos = {
            translate: new pc.GizmoTranslate(context),
            rotate: new pc.GizmoRotate(context),
            scale: new pc.GizmoScale(context)
        };

        for (var key in this.gizmos) {
            this.gizmos[key].initialize();
        }

        this.activeGizmo = this.gizmos.rotate;

        for (var key in context.systems) {
            if (context.systems.hasOwnProperty(key)) {
                context.systems[key]._inTools = true;
            }
        }

        context.designer = {
            livelink: this._link,
            selection: [] // Currently selected entities
        };

        this.grid = null;
        this.setDesignerSettings(options.designerSettings);

        this.picker = new pc.scene.Picker(this.graphicsDevice, 1, 1);
        this.shading = pc.RENDERSTYLE_SOLID;

        this.cameraEntity = this._createCamera();
        this._activateCamera();

        // Insert a command into the draw call queue to clear the depth buffer immediately before the gizmos are rendered
        var clearOptions = {
            flags: pc.gfx.CLEARFLAG_DEPTH
        };
        var command = new pc.scene.Command(pc.LAYER_GIZMO, pc.BLEND_NONE, function () {
            context.graphicsDevice.clear(clearOptions);
        });
        context.scene.drawCalls.push(command);

        // Draw immediately
        this.redraw = true;

        this.lastMouseEvent = null;
    };

    Designer = pc.inherits(Designer, pc.Application);


    Designer.prototype._createCamera = function () {
        var camera = new pc.Entity();
        this.context.systems.camera.addComponent(camera, {
            fov: 45,
            orthoHeight: 100,
            projection: 0,
            enabled: true,
            nearClip: 0.1,
            farClip: 10000,
            priority: 0
        });

        this.context.root.addChild(camera);
        camera.setPosition(100, 50, 100);
        camera.setEulerAngles(-20, 45, 0);

        return camera;
    };

    Designer.prototype.getCamera = function (pathOrGuid) {
        return this.context.root.findByPath(pathOrGuid) || this.context.root.findByGuid(pathOrGuid);
    };

    /**
     * @name pc.designer.Designer#render
     * @description Render a frame to the graphics device. For the designer this is only called when necessary, not every frame like in a game application
     */
    Designer.prototype.render = function () {
        var self = this;

        var context = this.context;
        var renderer = this.renderer;

        var root = context.root;
        context.root.syncHierarchy();

        var device = this.graphicsDevice;
        var dw = device.width;
        var dh = device.height;

        // Give viewport(s) a grey border
        device.setRenderTarget(null);
        device.updateBegin();
        device.setViewport(0, 0, dw, dh);
        device.setScissor(0, 0, dw, dh);
        device.clear({
            color: [0.5, 0.5, 0.5, 1],
            flags: pc.gfx.CLEARFLAG_COLOR
        });
        device.updateEnd();

        var setRenderStyle = function (style) {
            var drawCalls = context.scene.drawCalls;
            for (var i = 0; i < drawCalls.length; i++) {
                if (!drawCalls[i].command) {
                    var meshInstance = drawCalls[i];
                    if (typeof meshInstance.mesh.primitive[style] !== 'undefined') {
                        meshInstance.renderStyle = style;
                    }
                }
            }
        };

        // FIXME: This breaks if the user has created entities with the same names as the default cameras
        var cameraEntity = this.cameraEntity;
        if (cameraEntity) {
            var camera = cameraEntity.camera.camera;
            // Link the named camera to the relevant viewport
            camera.setRenderTarget(null);
            // set camera properties defined in designer settings
            var clearColor = this.designerSettings.camera_clear_color;
            cameraEntity.camera.clearColor = new pc.Color(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
            cameraEntity.camera.nearClip = this.designerSettings.camera_near_clip;
            cameraEntity.camera.farClip = this.designerSettings.camera_far_clip;

            camera.setRect(0, 0, 1, 1);

            cameraEntity.camera.frameBegin();
            setRenderStyle(this.shading);
            renderer.render(context.scene, camera);
            cameraEntity.camera.frameEnd();
        }
    };

    /**
     * @name pc.designer.Designer#tick
     * @description Custom tick function that constantly checks to see if the app has invalidated the 3d view.
     */
    Designer.prototype.tick = function () {
        if (this.redraw) {
            if (this.lastMouseEvent) {
                // pass mousemove on to gizmo system
                this.activeGizmo.handleMouseMove(this.lastMouseEvent);
                this.lastMouseEvent = null;
            }

            pc.ComponentSystem.update(0, this.context, true);

            this.activeGizmo.render();

            this.render();
            this.redraw = false;
        }

        // Submit a request to queue up a new animation frame immediately
        requestAnimationFrame(this.tick.bind(this), this.canvas);
    };

    /**
     * @name pc.designer.Designer#resize
     * @description Resize the canvas
     */
    Designer.prototype.resize = function (w, h) {
        this.graphicsDevice.width = w;
        this.graphicsDevice.height = h;
        this.picker.resize(w, h);
        this.redraw = true;
    };

    /**
     * @name pc.designer.Designer#setActiveViewportShading
     * @description Sets the render style of the active viewport to be 'normal' or wireframe.
     */
    Designer.prototype.setActiveViewportShading = function (shading) {
        this.shading = shading;
        this.redraw = true;
    };

    Designer.prototype._deactivateCurrentCamera = function () {
        if (this.cameraEntity.script) {
            this.context.systems.script.removeComponent(this.cameraEntity);
        }
    };

    Designer.prototype._activateCamera = function () {
        var camera = this.cameraEntity;

        if (!camera.script) {
            this.context.systems.script.addComponent(camera, {
                scripts: [{
                    url: '/editor/scene/js/framework/camera/designer_camera.js'
                }],
                runInTools: true
            });
        }

        for (var key in this.gizmos) {
            this.gizmos[key].setCamera(camera);
        }

        this.context.scene.removeModel(camera.camera.model);
    };


    Designer.prototype.setActiveGizmoType = function (gizmoType) {
        this.activeGizmo = this.gizmos[gizmoType];
    };

    Designer.prototype.setGizmoCoordinateSystem = function (system) {
        for (var key in this.gizmos) {
            this.gizmos.setCoordinateSystem(system);
        }
    };

    Designer.prototype.setSnapToClosestIncrement = function (snap) {
        for (var key in this.gizmos) {
            this.gizmos.setSnap(snap);
        }
    };

    Designer.prototype.setDesignerSettings = function (settings) {
        this.designerSettings = settings;

        this.gizmos.translate.setSnapIncrement(settings.snap_increment);
        this.gizmos.scale.setSnapIncrement(settings.snap_increment);

        if (this.grid) {
            this.context.scene.removeModel(this.grid.model);
            this.grid.destroy();
        }

        this.grid = new pc.Grid(this.graphicsDevice, settings.grid_divisions * settings.grid_division_size, settings.grid_divisions);
        this.context.scene.addModel(this.grid.model);

        this.redraw = true;
    };

    Designer.prototype.selectEntity = function (resourceId) {
        var actualEntity = this.context.root.findByGuid(resourceId);
        if (actualEntity) {
            this.activeGizmo.activate(actualEntity);
        }

        this.redraw = true;
    };

    Designer.prototype.deselectEntity = function () {
        this.activeGizmo.deactivate();
        this.redraw = true;
    };

    Designer.prototype.frameSelection = function () {
        var cameraName = this.quadView[this.activeViewport.name].cameraName;
        var cameraEntity = this.getCamera(cameraName);
        if (cameraEntity && cameraEntity.script) {
            cameraEntity.script.designer_camera.frameSelection();
        }
    };

    /**
     * @name pc.designer.Designer#handleMouseDown
     * @description Handle a mousedown event from the web application
     * @param {MouseEvent} A DOM MouseEvent
     */
    Designer.prototype.handleMouseDown = function (event) {
        // prevent default behaviour which is to start text selection
        event.preventDefault();

        // wrap mouseevent with PlayCanvas version which adds cross-browser properties
        var e = new pc.input.MouseEvent(this.context.mouse, event);

        // Mouse click XY with reference to top left corner of canvas
        var x = e.x;
        var y = e.y;

        var meshSelection;

        if (!e.altKey) {
            // Pass mousedown on to Gizmo
            this.activeGizmo.handleMouseDown(e);

            if (!this.activeGizmo.isDragging) {
                var picker = this.picker;
                picker.prepare(this.cameraEntity.camera.camera, this.context.scene);

                var picked = picker.getSelection({
                    x: x,
                    y: this.canvas.height - y
                });

                if (picked.length > 0) {
                    var selectedNode = picked[0].node;
                    while (!(selectedNode instanceof pc.Entity) && (selectedNode !== null)) {
                        selectedNode = selectedNode.getParent();
                    }

                    if (selectedNode) {
                        var selectedEntity = editor.call('entities:get', selectedNode.getGuid());
                        if (!selectedEntity) {
                            return;
                        }

                        if (e.button !== pc.input.MOUSEBUTTON_RIGHT) {
                            if (this.context.designer.selection.indexOf(selectedNode) < 0) {
                                // We've selected a new entity
                                editor.call('selector:add', 'entity', selectedEntity);
                            } else {
                                // We've selected the same entity again so try to find the selected mesh instance
                                meshSelection = this._getMeshInstanceSelection(selectedNode, picked);
                                if (meshSelection) {
                                    pc.designer.api.setMeshInstanceSelection(
                                        meshSelection.model,
                                        meshSelection.material,
                                        meshSelection.meshInstanceIndex,
                                        meshSelection.entityId
                                    );
                                }
                            }
                        } else {
                            // select the entity
                            editor.call('selector:add', 'entity', selectedEntity);

                            // set the selected mesh instance
                            meshSelection = this._getMeshInstanceSelection(selectedNode, picked);
                            if (meshSelection) {
                                pc.designer.api.setContextMeshInstanceSelection(
                                    meshSelection.model,
                                    meshSelection.material,
                                    meshSelection.meshInstanceIndex,
                                    meshSelection.entityId
                                );

                            }

                        }
                    }
                } else {
                    editor.call('selector:clear');
                }
            }
        }

        this.redraw = true;
    };

    Designer.prototype._getMeshInstanceSelection = function (selectedNode, pickedInstances) {
        var result = null;

        if (selectedNode.model && selectedNode.model.model) {
            var meshInstances = selectedNode.model.model.meshInstances;
            for (var i = 0; i < meshInstances.length; i++) {
                var instance = meshInstances[i];
                if (instance === pickedInstances[0]) {
                    var materialId = null;

                    // got the instance
                    // get the material with the same index
                    if (selectedNode.model.type === 'asset') {
                        var modelAsset = this.context.assets.getAssetById(selectedNode.model.asset);
                        if (modelAsset.data.mapping) {
                            materialId = modelAsset.data.mapping[i].material;
                        }

                        result = {
                            model: selectedNode.model.asset,
                            material: materialId,
                            meshInstanceIndex: i,
                            entityId: selectedNode.getGuid()
                        }

                    } else {
                        result = {
                            model: null,
                            material: selectedNode.model.data.materialAsset,
                            meshInstanceIndex: i,
                            entityId: selectedNode.getGuid()
                        }
                    }

                    break;
                }
            }
        }

        return result;
    };

    /**
     * @name pc.designer.Designer#handleMouseUp
     * @description Handle a mouseup event from the web application
     * @param {MouseEvent} A DOM MouseEvent
     */
    Designer.prototype.handleMouseUp = function (event) {
        // wrap mouseevent wiht PlayCanvas version which adds cross-browser properties
        var e = new pc.input.MouseEvent(this.context.mouse, event);

        // pass mouseup on to the gizmo
        this.activeGizmo.handleMouseUp(e);
        this.redraw = true;
    };

    /**
     * @name pc.designer.Designer#handleMouseMove
     * @description Handle a mousemove event from the web application
     * @param {MouseEvent} A DOM MouseEvent
     */
    Designer.prototype.handleMouseMove = function (event) {
        // wrap mouseevent wiht PlayCanvas version which adds cross-browser properties
        this.lastMouseEvent = new pc.input.MouseEvent(this.context.mouse, event);
        this.redraw = true;
    };


    /**
     * @private
     * @name pc.designer.Designer#_handleMessage
     * @description Handle an incoming LiveLink message from a window (usually the current window)
     */
    Designer.prototype._handleMessage = function (msg) {
        // Call parent message handler
        pc.designer.Designer._super._handleMessage.call(this, msg);

        switch(msg.type) {
            case pc.LiveLinkMessageType.UPDATE_ENTITY_TRANSFORM:
                var entity = this.context.root.findByGuid(msg.content.id);
                if (entity) {
                    entity._$position = msg.content.position;
                    entity._$rotation = msg.content.rotation;
                    entity._$scale = msg.content.scale;
                }
                break;
            case pc.LiveLinkMessageType.OPEN_PACK:
                var patch = function (entity, data) {
                    if (entity) {
                        entity._$position = data['position'];
                        entity._$rotation = data['rotation'];
                        entity._$scale = data['scale'];
                    }
                    var i, entities = entity.getChildren();
                    var children = data['children'];
                    var len = children.length;
                    for (i = 0; i < len; i++) {
                        patch(entities[i], children[i]);
                    }
                }
                var root = this.context.root.findByGuid(msg.content.pack.hierarchy['resource_id']);
                patch(root, msg.content.pack.hierarchy);
                this._linkUpdatePackSettings(msg.content.pack.settings);
                break;
            case pc.LiveLinkMessageType.OPEN_ENTITY:
                // Add translate, rotate, scale properties to all the entities for the gizmos, while in the designer,
                if (msg.content.entity) {
                    var patch = function (entity, data) {
                        if (entity) {
                            entity._$position = data['position'];
                            entity._$rotation = data['rotation'];
                            entity._$scale = data['scale'];
                        }
                        var i, entities = entity.getChildren();
                        var children = data['children'];
                        var len = children.length;
                        for (i = 0; i < len; i++) {
                            patch(entities[i], children[i]);
                        }
                    }
                    var root = this.context.root.findByGuid(msg.content.entity['resource_id']);
                    patch(root, msg.content.entity);

                } else {
                    var models = msg.content.models;
                    if (!models) {
                        models = [msg.content.model];
                    }

                    var i, len = models.length;
                    for (i = 0; i < len; i++) {
                        var entity = this.context.root.findByGuid(models[i]['resource_id']);
                        if (entity) {
                            entity._$position = models[i]['position'];
                            entity._$rotation = models[i]['rotation'];
                            entity._$scale = models[i]['scale'];
                        }
                    }
                }
                break;
            case pc.LiveLinkMessageType.CLOSE_ENTITY:
                var cameraEntity = this.getCamera(this.quadView[this.activeViewport.name].cameraName);
                // if the camera no longer exists then activate the perspective camera
                if (!cameraEntity) {
                    this.setActiveViewportCamera(this.designerCamerasPath + 'Perspective');
                }
                break;
            case pc.LiveLinkMessageType.REPARENT_ENTITY:
                // if the active camera is reparented then reset it
                if (this.cameraEntity && this.cameraEntity.getGuid() === msg.content.id) {
                    var newPath = this.context.root.findByGuid(msg.content.id).getPath();
                    this.setActiveViewportCamera(newPath);
                }
                break;
            case pc.LiveLinkMessageType.UPDATE_COMPONENT:
                // if the script component of the active camera
                // has changed then reactive the camera - this will remove / re-add the
                // script component only with the designer camera script
                if (this.cameraEntity &&
                    this.cameraEntity.getGuid() === msg.content.id &&
                    msg.content.component === 'script') {
                    this._activateCamera();
                }
                break;
            case pc.LiveLinkMessageType.SELECTION_UPDATED:
                this.select(msg.content.guids);
                break;
            case pc.LiveLinkMessageType.UPDATE_ASSETCACHE:
                // Removed as this is done in framework_application.js - DWE 29/6
                // this.context.assets.update(msg.content);
                break;
            case pc.LiveLinkMessageType.UPDATE_DESIGNER_SETTINGS:
                this.setDesignerSettings(msg.content.settings);
                break;
        }
    };

    return {
        /**
        * @name pc.designer.user
        * @description Details of the currently authenticated user
        */
        user: null,
        /**
        * @name pc.designer.owner
        * @description Details of the owner of the depot that is being edited
        */
        owner: null,
        /**
        * @name pc.designer.depot
        * @description Details of the depot that is being edited
        */
        depot: null,
        Designer: Designer
    };
}());
