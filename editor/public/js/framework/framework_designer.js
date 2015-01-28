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
        var gizmo;

        this._inTools = true;

        // Create systems that are only used by the Designer
        gizmo = new pc.designer.GizmoComponentSystem(this.context);

        for (var key in this.context.systems) {
            if (this.context.systems.hasOwnProperty(key)) {
                this.context.systems[key]._inTools = true;
            }
        }

        this.context.designer = {
            livelink: this._link,
            selection: [] // Currently selected entities
        };

        this.grid = null;
        this.setDesignerSettings(options.designerSettings);

        this.picker = new pc.scene.Picker(this.graphicsDevice, 1, 1);
        this.shading = pc.RENDERSTYLE_SOLID;

        this.cameraEntity = new pc.Entity();
        this.context.systems.camera.addComponent(this.cameraEntity, {
            fov: 45,
            orthoHeight: 100,
            projection: 0,
            enabled: true,
            nearClip: 0.1,
            farClip: 10000,
            priority: 0
        });

        this.context.root.addChild(this.cameraEntity);
        this.cameraEntity.setPosition(100, 50, 100);
        this.cameraEntity.setEulerAngles(-20, 45, 0);

        this._activateCamera();

        // Draw immediately
        this.redraw = true;

        this.lastMouseEvent = null;
    };

    Designer = pc.inherits(Designer, pc.Application);

    Designer.prototype.init = function () {
    };

    Designer.prototype.createCamera = function () {

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
                this.context.systems.gizmo.handleMouseMove(this.lastMouseEvent);
                this.lastMouseEvent = null;
            }

            pc.ComponentSystem.update(0, this.context, true);
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
                    url: '/editor/js/framework/camera/designer_camera.js'
                }],
                runInTools: true
            });
        }

        this.context.systems.gizmo.setCamera(camera);

        this.context.scene.removeModel(camera.camera.model);
    };


    /**
     * @name pc.designer.Designer#setActiveGizmoType
     * @description Sets the currently active gizmo type to either translate, rotate or scale.
     */
    Designer.prototype.setActiveGizmoType = function (gizmoType) {
        this.context.systems.gizmo.setCurrentGizmoType(gizmoType);
    };

    /**
     * @name pc.designer.Designer#setActiveGizmoCoordSys
     * @description Sets the currently active gizmo type to either translate, rotate or scale.
     */
    Designer.prototype.setActiveGizmoCoordSys = function (coordSys) {
        this.context.systems.gizmo.setCurrentGizmoCoordSys(coordSys);
    };

    /**
     * @name pc.designer.Designer#setSnapToClosestIncrement
     * @description Enables / disables snap to closest increment mode for gizmos
     */
    Designer.prototype.setSnapToClosestIncrement = function (snap) {
        this.context.systems.gizmo.setSnapToClosestIncrement(snap);
    };

    Designer.prototype.setDesignerSettings = function (settings) {
        this.designerSettings = settings;

        this.context.systems.gizmo.setTranslationSnapIncrement(settings.snap_increment);
        this.context.systems.gizmo.setScalingSnapIncrement(settings.snap_increment);

        if (this.grid) {
            this.context.scene.removeModel(this.grid.model);
            this.grid.destroy();
        }

        this.grid = new pc.designer.graphics.Grid(this.graphicsDevice, settings.grid_divisions * settings.grid_division_size, settings.grid_divisions);
        this.context.scene.addModel(this.grid.model);

        this.redraw = true;
    };

    /**
     * Called when one or more entities are selected
     * @param {Object} entities List of entity guids
     * @private
     */
    Designer.prototype.select = function (entities) {
        var index, length = entities.length;
        var selection = [];

        for (index = 0; index < length; index++) {
            var e = this.context.root.findByGuid(entities[index]);
            if (e) {
                selection.push(e);
            }
        }
        if (!pc.config.readOnly) {
            this.context.systems.gizmo.setSelection(selection);
        }
        this.context.designer.selection = selection;
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
            // Pass mousedown on to Gizmo system
            this.context.systems.gizmo.handleMouseDown(e);

            // Probably better to add a function to the gizmo component to query current dragging state
            if (!this.context.systems.gizmo.draggingState) {
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

        // pass mouseup on to gizmo system
        this.context.systems.gizmo.handleMouseUp(e);
    };

    /**
     * @name pc.designer.Designer#handleMouseMove
     * @description Handle a mousemove event from the web application
     * @param {MouseEvent} A DOM MouseEvent
     */
    Designer.prototype.handleMouseMove = function (event) {
        // wrap mouseevent wiht PlayCanvas version which adds cross-browser properties
        this.lastMouseEvent = new pc.input.MouseEvent(this.context.mouse, event);
    };

    Designer.prototype.loadEntity = function (data) {
        var entity = new pc.Entity();

        var p = data.position;
        var r = data.rotation;
        var s = data.scale;

        entity.setName(data.name);
        entity.setGuid(data.resource_id);
        entity.setLocalPosition(p[0], p[1], p[2]);
        entity.setLocalEulerAngles(r[0], r[1], r[2]);
        entity.setLocalScale(s[0], s[1], s[2]);
        entity._enabled = data.enabled !== undefined ? data.enabled : true;
        entity._enabledInHierarchy = entity._enabled;

        if (data.labels) {
            data.labels.forEach(function (label) {
                entity.addLabel(label);
            });
        }

        // set additional properties to
        // patch the hierarchy later
        entity.__parent = data.parent;
        entity.__children = data.children;
        entity.__components = data.components;

        entity.template = data.template;

        return entity;
    };

    Designer.prototype.loadScene = function (entities) {
        var e;
        var hierarchy = {};
        var context = this.context;

        entities.forEach(function (data) {
            e = this.loadEntity(data);
            hierarchy[data.resource_id] = e;
        }.bind(this));

        function openEntityHierarchy (entity) {
            if (entity.__parent) {
                hierarchy[entity.__parent].addChild(entity);
            } else {
                context.root.addChild(entity);
            }

            if (entity.__children) {
                for (var i = 0, len = entity.__children.length; i < len; i++) {
                    openEntityHierarchy(hierarchy[entity.__children[i]]);
                }
            }

            delete entity.__parent;
            delete entity.__children;

            return entity;
        }

        function openComponentData (entity) {
            // Create Components in order
            var systems = context.systems.list();
            var i, len = systems.length;
            var data = entity.__components;
            if (data) {
                for (i = 0; i < len; i++) {
                    var componentData = data[systems[i].id];
                    if (componentData) {
                        context.systems[systems[i].id].addComponent(entity, componentData);
                    }
                }
            }

            // Recurse for children
            var children = entity.getChildren();
            var length = children.length;
            for (i = 0; i < length; i++) {
                openComponentData(children[i]);
            }
        }

        // initialize hierarchy
        for (var guid in hierarchy) {
            if (hierarchy.hasOwnProperty(guid)) {
                var entity = hierarchy[guid];
                if (!entity.getParent() && !entity.getChildren().length) {

                    openEntityHierarchy(entity);
                }
            }
        }

        context.root.syncHierarchy();

        // initialize components
        openComponentData(context.root);
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
