pc.editor = pc.editor || {};
pc.extend(pc.editor, function() {

    var time;
    var rect = new pc.Vec4(0, 0, 1, 1);

    var Designer = function (canvas, options) {
        this._inTools = true;

        var context = this;
        context.assets._prefix = '../../api/';

        this.scene = new pc.Scene();

        for (var key in context.systems) {
            if (context.systems.hasOwnProperty(key)) {
                context.systems[key]._inTools = true;
            }
        }

        this.grid = null;
        this.setDesignerSettings(options.designerSettings);

        this.picker = new pc.scene.Picker(this.graphicsDevice, 1, 1);
        this.shading = pc.RENDERSTYLE_SOLID;

        this.cameras = this._createCameras();
        this.activeCamera = null;
        this.setActiveCamera(this.cameras[0].getGuid());

        // Draw immediately
        this.redraw = true;
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
        perspective.setPosition(9.2, 7, 9);
        perspective.setEulerAngles(-25, 45, 0);

        // top
        var top = new pc.Entity();
        top.name = 'Top';
        top.addComponent('camera', {
            fov: 45,
            orthoHeight: 5,
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
            orthoHeight: 5,
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
            orthoHeight: 5,
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
            orthoHeight: 5,
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
            orthoHeight: 5,
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
            orthoHeight: 5,
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
     * @name pc.editor.Designer#render
     * @description Render a frame to the graphics device. For the designer this is only called when necessary, not every frame like in a game application
     */
    Designer.prototype.render = function () {
        var self = this;

        var context = this;
        var renderer = this.renderer;

        var root = context.root;
        context.root.syncHierarchy();

        this.fire('preRender', null);

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
     * @name pc.editor.Designer#tick
     * @description Custom tick function that constantly checks to see if the app has invalidated the 3d view.
     */
    Designer.prototype.tick = function () {
        if (this.redraw) {
            var dt = this.getDt();
            var keepRendering = editor.call('viewport:keepRendering');
            this.redraw = keepRendering;

            // Perform ComponentSystem update
            pc.ComponentSystem.fire('toolsUpdate', dt);
            editor.emit('viewport:update', dt);

            // this.activeGizmo.render();

            this.render();
        }

        // Submit a request to queue up a new animation frame immediately
        requestAnimationFrame(this.tick.bind(this), this.graphicsDevice.canvas);
    };

    /**
     * @name pc.editor.Designer#resize
     * @description Resize the canvas
     */
    Designer.prototype.resize = function (w, h) {
        this.graphicsDevice.width = w;
        this.graphicsDevice.height = h;
        this.picker.resize(w, h);
        this.redraw = true;
    };

    /**
     * @name pc.editor.Designer#setActiveViewportShading
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

        if (cameraEntity.script) {
            cameraEntity.removeComponent('script');
        }

        cameraEntity.addComponent('script', {
            scripts: [{
                url: '/editor/scene/js/framework/camera/designer_camera.js'
            }],
            runInTools: true
        });

        // remove the active camera's debug shape
        // TODO: fix issue in engine where disabling/re-enabling active camera
        // re-adds the debug shape
        this.scene.removeModel(cameraEntity.camera.model);
    };

    Designer.prototype.setDesignerSettings = function (settings) {
        this.designerSettings = settings;

        if (this.grid) {
            this.scene.removeModel(this.grid.model);
            this.grid.destroy();
        }

        settings.grid_divisions = parseInt(settings.grid_divisions, 10);
        if (settings.grid_divisions > 0) {
            this.grid = new pc.Grid(this.graphicsDevice, settings.grid_divisions * settings.grid_division_size, settings.grid_divisions);
            this.scene.addModel(this.grid.model);
        }

        this.redraw = true;
    };

    // Redraw when we set the skybox
    Designer.prototype._setSkybox = function (cubemaps) {
        Designer._super._setSkybox.call(this, cubemaps);
        this.redraw = true;
    };

    return {
        /**
        * @name pc.editor.user
        * @description Details of the currently authenticated user
        */
        user: null,
        /**
        * @name pc.editor.owner
        * @description Details of the owner of the depot that is being edited
        */
        owner: null,
        /**
        * @name pc.editor.depot
        * @description Details of the depot that is being edited
        */
        depot: null,
        Designer: Designer
    };
}());
