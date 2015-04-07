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

    var time;
    var rect = new pc.Vec4(0, 0, 1, 1);

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

        var context = this;
        context.assets._prefix = '../../api/';

        this.gizmos = {
            translate: new pc.GizmoTranslate(context),
            rotate: new pc.GizmoRotate(context),
            scale: new pc.GizmoScale(context)
        };

        for (var key in this.gizmos) {
            this.gizmos[key].initialize();
        }

        this.activeGizmo = this.gizmos.translate;

        for (var key in context.systems) {
            if (context.systems.hasOwnProperty(key)) {
                context.systems[key]._inTools = true;
            }
        }

        context.designer = {}; // TODO: remove this it should not be required by the engine

        this.grid = null;
        this.setDesignerSettings(options.designerSettings);

        this.picker = new pc.scene.Picker(this.graphicsDevice, 1, 1);
        this.shading = pc.RENDERSTYLE_SOLID;

        this.cameras = this._createCameras();
        this.activeCamera = null;
        this.setActiveCamera(this.cameras[0].getGuid());

        // Insert a command into the draw call queue to clear the depth buffer immediately before the gizmos are rendered
        var clearOptions = {
            flags: pc.CLEARFLAG_DEPTH
        };
        var command = new pc.scene.Command(pc.LAYER_GIZMO, pc.BLEND_NONE, function () {
            context.graphicsDevice.clear(clearOptions);
        });
        context.scene.drawCalls.push(command);

        // Draw immediately
        this.redraw = true;

        this.lastMouseEvent = null;
        this.selectedEntity = null;
        this.lastMouseX = -1;
        this.lastMouseY = -1;
        this.clickedCanvas = false;

        // handle mouse / keyboard
        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    };

    Designer = pc.inherits(Designer, pc.Application);

    Designer.prototype._createCameras = function () {
        // perspective
        var perspective = new pc.Entity();
        perspective.name = 'Perspective';
        perspective.addComponent('camera', {
            fov: 45,
            orthoHeight: 100,
            projection: 0,
            enabled: true,
            nearClip: 0.1,
            farClip: 10000,
            priority: 0,
            clearColorBuffer: true,
            clearDepthBuffer: true
        });
        this.root.addChild(perspective);
        perspective.setPosition(100, 50, 100);
        perspective.setEulerAngles(-20, 45, 0);

        // top
        var top = new pc.Entity();
        top.name = 'Top';
        top.addComponent('camera', {
            fov: 45,
            orthoHeight: 80,
            projection: 1,
            farClip: 100000,
            nearClip: 0.1,
            enabled: true,
            priority: 0,
            clearColorBuffer: true,
            clearDepthBuffer: true
        });
        this.root.addChild(top);
        top.setPosition(0, 1000, 0);
        top.setEulerAngles(-90, 0, 0);
        top.enabled = false;

        // bottom
        var bottom = new pc.Entity();
        bottom.name = 'Bottom';
        bottom.addComponent('camera', {
            fov: 45,
            orthoHeight: 80,
            projection: 1,
            farClip: 100000,
            nearClip: 0.1,
            enabled: true,
            priority: 0,
            clearColorBuffer: true,
            clearDepthBuffer: true
        });
        this.root.addChild(bottom);
        bottom.setPosition(0, -1000, 0);
        bottom.setEulerAngles(90, 0, 0);
        bottom.enabled = false;

        // front
        var front = new pc.Entity();
        front.name = 'Front';
        front.addComponent('camera', {
            fov: 45,
            orthoHeight: 80,
            projection: 1,
            farClip: 100000,
            nearClip: 0.1,
            enabled: true,
            priority: 0,
            clearColorBuffer: true,
            clearDepthBuffer: true
        });
        this.root.addChild(front);
        front.setPosition(0, 0, 1000);
        front.setEulerAngles(0, 0, 0);
        front.enabled = false;

        // back
        var back = new pc.Entity();
        back.name = 'Back';
        back.addComponent('camera', {
            fov: 45,
            orthoHeight: 80,
            projection: 1,
            farClip: 100000,
            nearClip: 0.1,
            enabled: true,
            priority: 0,
            clearColorBuffer: true,
            clearDepthBuffer: true
        });
        this.root.addChild(back);
        back.setPosition(0, 0, -1000);
        back.setEulerAngles(-180, 0, -180);
        back.enabled = false;

        // left
        var left = new pc.Entity();
        left.name = 'Left';
        left.addComponent('camera', {
            fov: 45,
            orthoHeight: 80,
            projection: 1,
            farClip: 100000,
            nearClip: 0.1,
            enabled: true,
            priority: 0,
            clearColorBuffer: true,
            clearDepthBuffer: true
        });
        this.root.addChild(left);
        left.setPosition(-1000, 0, 0);
        left.setEulerAngles(0, -90, 0);
        left.enabled = false;

        // right
        var right = new pc.Entity();
        right.name = 'Right';
        right.addComponent('camera', {
            fov: 45,
            orthoHeight: 80,
            projection: 1,
            farClip: 100000,
            nearClip: 0.1,
            enabled: true,
            priority: 0,
            clearColorBuffer: true,
            clearDepthBuffer: true
        });
        this.root.addChild(right);
        right.setPosition(1000, 0, 0);
        right.setEulerAngles(0, 90, 0);
        right.enabled = false;

        return [perspective, top, bottom, front, back, left, right];
    };

    Designer.prototype._createCamera = function () {
        var camera = new pc.Entity();

        camera.addComponent('camera', {
            fov: 45,
            orthoHeight: 100,
            projection: 0,
            enabled: true,
            nearClip: 0.1,
            farClip: 10000,
            priority: 0
        });

        this.root.addChild(camera);
        camera.setPosition(100, 50, 100);
        camera.setEulerAngles(-20, 45, 0);

        return camera;
    };

    Designer.prototype.getCamera = function (pathOrGuid) {
        return this.root.findByPath(pathOrGuid) || this.root.findByGuid(pathOrGuid);
    };

    /**
     * @name pc.designer.Designer#render
     * @description Render a frame to the graphics device. For the designer this is only called when necessary, not every frame like in a game application
     */
    Designer.prototype.render = function () {
        var self = this;

        var context = this;
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

        var cameraEntity = this.activeCamera;
        if (cameraEntity && cameraEntity.camera) {
            var cameraNode = cameraEntity.camera.camera;
            // Link the named camera to the relevant viewport
            cameraNode.setRenderTarget(null);

            // set camera properties defined in designer settings
            if (!this.isUserCamera(cameraEntity)) {
                var clearColor = this.designerSettings.camera_clear_color;
                cameraEntity.camera.clearColor = new pc.Color(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
                if (cameraEntity === this.cameras[0]) {
                    cameraEntity.camera.nearClip = this.designerSettings.camera_near_clip;
                    cameraEntity.camera.farClip = this.designerSettings.camera_far_clip;
                }
            }

            cameraEntity.camera.rect = rect;

            cameraEntity.camera.frameBegin();
            setRenderStyle(this.shading);
            renderer.render(context.scene, cameraNode);
            cameraEntity.camera.frameEnd();
        }
    };

    Designer.prototype.getDt = function () {
        var now = (window.performance && window.performance.now) ? performance.now() : Date.now();
        var dt = (now - (time || now)) / 1000.0;
        dt = pc.math.clamp(dt, 0, 0.1); // Maximum delta is 0.1s or 10 fps.
        time = now;
        return dt;
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

            var dt = this.getDt();
            var keepRendering = editor.call('viewport:keepRendering');

            // Perform ComponentSystem update
            pc.ComponentSystem.fire('toolsUpdate', dt);

            this.activeGizmo.render();

            this.render();

            this.redraw = keepRendering;
        }

        // Submit a request to queue up a new animation frame immediately
        requestAnimationFrame(this.tick.bind(this), this.graphicsDevice.canvas);

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

    Designer.prototype.setActiveCamera = function (guid) {
        var camera = this.root.findByGuid(guid);
        if (camera) {
            this._activateCamera(camera);
            this.redraw = true;
        }
    };

    Designer.prototype.isUserCamera = function (camera) {
        return this.cameras && this.cameras.indexOf(camera) < 0;
    };

    Designer.prototype._activateCamera = function (cameraEntity) {
        var prev = this.activeCamera;
        if (this.activeCamera && this.activeCamera !== cameraEntity) {
            if (this.activeCamera.script) {
                this.activeCamera.removeComponent('script');
            }

            // re-add the camera's debug shape if needed
            if (this.isUserCamera(this.activeCamera) && this.activeCamera.camera) {
                var entity = editor.call('entities:get', this.activeCamera.getGuid());
                if (entity) {
                    this.activeCamera.enabled = entity.get('enabled');
                    if (this.activeCamera.enabled && !this.scene.containsModel(this.activeCamera.camera.model)) {
                        this.scene.addModel(this.activeCamera.camera.model);
                    }
                }
            }
        }

        this.activeCamera = cameraEntity;

        cameraEntity.enabled = true;

        if (!cameraEntity.script) {
            cameraEntity.addComponent('script', {
                scripts: [{
                    url: '/editor/scene/js/framework/camera/designer_camera.js'
                }],
                runInTools: true
            });
        }

        for (var key in this.gizmos) {
            this.gizmos[key].setCamera(cameraEntity);
        }

        // remove the active camera's debug shape
        // TODO: fix issue in engine where disabling/re-enabling active camera
        // re-adds the debug shape
        this.scene.removeModel(cameraEntity.camera.model);
    };


    Designer.prototype.setActiveGizmoType = function (gizmoType) {
        var entity = this.activeGizmo.entity;
        this.activeGizmo.deactivate();

        this.activeGizmo = this.gizmos[gizmoType];
        if (entity) {
            this.activeGizmo.activate(entity);
        }

        this.redraw = true;
    };

    Designer.prototype.toggleGizmoInteraction = function (toggle) {
        for (var key in this.gizmos) {
            this.gizmos[key].disableInteraction = !toggle;
        }
    };

    Designer.prototype.setGizmoCoordinateSystem = function (system) {
        for (var key in this.gizmos) {
            this.gizmos[key].setCoordinateSystem(system);
        }

        this.redraw = true;
    };

    Designer.prototype.setSnapToClosestIncrement = function (snap) {
        for (var key in this.gizmos) {
            this.gizmos[key].setSnap(snap);
        }
    };

    Designer.prototype.setDesignerSettings = function (settings) {
        this.designerSettings = settings;

        this.gizmos.translate.setSnapIncrement(settings.snap_increment);
        this.gizmos.scale.setSnapIncrement(settings.snap_increment);

        if (this.grid) {
            this.scene.removeModel(this.grid.model);
            this.grid.destroy();
        }

        this.grid = new pc.Grid(this.graphicsDevice, settings.grid_divisions * settings.grid_division_size, settings.grid_divisions);
        this.scene.addModel(this.grid.model);

        this.redraw = true;
    };

    Designer.prototype.selectEntity = function (resourceId) {
        this.selectedEntity = this.root.findByGuid(resourceId);
        if (this.selectedEntity && editor.call('permissions:write'))
            this.activeGizmo.activate(this.selectedEntity);

        this.redraw = true;
    };

    Designer.prototype.deselectEntity = function () {
        this.selectedEntity = null;
        this.activeGizmo.deactivate();
        this.redraw = true;
    };

    Designer.prototype.frameSelection = function () {
        if (this.selectedEntity) {
            this.activeCamera.script.designer_camera.frameSelection(this.selectedEntity);
            this.redraw = true;
        }
    };

    /**
     * @name pc.designer.Designer#handleMouseDown
     * @description Handle a mousedown event from the web application
     * @param {MouseEvent} A DOM MouseEvent
     */
    Designer.prototype.handleMouseDown = function (event) {
        // wrap mouseevent with PlayCanvas version which adds cross-browser properties
        var e = new pc.input.MouseEvent(this.mouse, event);

        // Mouse click XY with reference to top left corner of canvas
        this.lastMouseX = e.x;
        this.lastMouseY = e.y;

        // Pass mousedown on to Gizmo
        this.activeGizmo.handleMouseDown(e);

        this.clickedCanvas = true;

        this.redraw = true;
    };

    Designer.prototype._getMeshInstanceSelection = function (selectedNode, pickedInstances) {
        var result = null;

        if (selectedNode.model && selectedNode.model.type === 'asset' && selectedNode.model.model) {
            var meshInstances = selectedNode.model.model.meshInstances;
            for (var i = 0; i < meshInstances.length; i++) {
                var instance = meshInstances[i];
                if (instance === pickedInstances[0]) {

                    var materialId = null;
                    var modelAsset = this.assets.getAssetById(selectedNode.model.asset);
                    if (modelAsset.data.mapping) {
                        materialId = modelAsset.data.mapping[i].material;
                    }

                    result = {
                        modelId: selectedNode.model.asset,
                        meshInstanceIndex: i,
                        materialId: materialId
                    };

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
        if (event.button === pc.input.MOUSEBUTTON_LEFT) {
            this.clickedCanvas = false;
        }

        if (event.target === this.graphicsDevice.canvas) {

            // wrap mouseevent wiht PlayCanvas version which adds cross-browser properties
            var e = new pc.input.MouseEvent(this.mouse, event);
            var x = e.x;
            var y = e.y;

            if (Math.abs(this.lastMouseX - x) < 5 && Math.abs(this.lastMouseY -= y) < 5) {
                if (!this.activeGizmo.isDragging) {
                    var picker = this.picker;
                    picker.prepare(this.activeCamera.camera.camera, this.scene);

                    var picked = picker.getSelection({
                        x: x,
                        y: this.graphicsDevice.canvas.height - y
                    });

                    if (picked.length > 0) {
                        var selectedNode = picked[0].node;
                        while (!(selectedNode instanceof pc.Entity) && selectedNode !== null && selectedNode !== this.activeGizmo.node) {
                            selectedNode = selectedNode.getParent();
                        }

                        // if we selected something from the active gizmo then it's like selecting the entity
                        if (selectedNode === this.activeGizmo.node) {
                            if (e.button === pc.input.MOUSEBUTTON_RIGHT) {
                                selectedNode = this.activeGizmo.entity;
                            } else {
                                selectedNode = null;
                            }
                        }

                        if (selectedNode) {
                            var selectedEntity = editor.call('entities:get', selectedNode.getGuid());
                            if (selectedEntity) {
                                if (this.selectedEntity !== selectedNode) {
                                    // We've selected a new entity
                                    editor.call('selector:add', 'entity', selectedEntity);

                                    if (e.button === pc.input.MOUSEBUTTON_RIGHT) {
                                        // show context menu for selected entity
                                        editor.call('viewport:contextmenu', event.x, event.y, selectedEntity);
                                    }
                                } else {
                                    if (e.button === pc.input.MOUSEBUTTON_LEFT) {
                                        // We've selected the same entity again so try to find the selected mesh instance
                                        var meshSelection = this._getMeshInstanceSelection(selectedNode, picked);
                                        if (meshSelection) {
                                            // deselect entity and select model
                                            editor.call('selector:add', 'asset', editor.call('assets:get', meshSelection.modelId));

                                            setTimeout(function () {
                                                var node = editor.call('attributes.rootPanel').element.querySelector('.field-asset.node-' + meshSelection.meshInstanceIndex);
                                                node.classList.add('active');
                                                node.focus();
                                            });
                                        }
                                    } else if (e.button === pc.input.MOUSEBUTTON_RIGHT) {
                                        // show context menu for selected entity
                                        editor.call('viewport:contextmenu', event.x, event.y, selectedEntity);
                                    }
                                }
                            }
                        }
                    } else {
                        editor.call('selector:clear');
                    }
                }
            }
        }

        // pass mouseup on to the gizmo
        this.activeGizmo.handleMouseUp(event);

        if (event.target !== this.graphicsDevice.canvas) {
            this.activeGizmo.setActiveAxis(null);
        }

        this.redraw = true;
    };

    /**
     * @name pc.designer.Designer#handleMouseMove
     * @description Handle a mousemove event from the web application
     * @param {MouseEvent} A DOM MouseEvent
     */
    Designer.prototype.handleMouseMove = function (event) {
        if (event.target === this.graphicsDevice.canvas) {
            // wrap mouseevent with PlayCanvas version which adds cross-browser properties
            this.lastMouseEvent = new pc.input.MouseEvent(this.mouse, event);
            this.redraw = true;
        }

        if (this.clickedCanvas) {
            event.preventDefault(); // stop text selection
            return false;
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
