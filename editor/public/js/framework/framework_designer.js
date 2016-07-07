editor.once('load', function() {
    var time;
    var rect = new pc.Vec4(0, 0, 1, 1);

    var Designer = function (canvas, options) {
        this._inTools = true;
        pc.app = this;

        this.assets._prefix = '../../api/';

        if (! this.scene)
            this.scene = new pc.Scene();

        for (var key in this.systems) {
            if (this.systems.hasOwnProperty(key))
                this.systems[key]._inTools = true;
        }

        this.grid = null;
        this.setDesignerSettings(options.designerSettings);

        this.picker = new pc.scene.Picker(this.graphicsDevice, 1, 1);
        this.shading = pc.RENDERSTYLE_SOLID;

        // Draw immediately
        this.redraw = true;

        // define the tick method
        this.tick = this._tick.bind(this);
    };

    editor.method('viewport:designer', function() {
        return Designer;
    });

    Designer = pc.inherits(Designer, pc.Application);

    Designer.prototype.render = function () {
        var self = this;

        var context = this;
        var renderer = this.renderer;

        var root = context.root;
        context.root.syncHierarchy();

        this.fire('prerender', null);
        editor.emit('viewport:preRender');

        var device = this.graphicsDevice;
        var dw = device.width;
        var dh = device.height;

        // Give viewport(s) a grey border
        device.setRenderTarget(null);
        device.updateBegin();
        device.setViewport(0, 0, dw, dh);
        device.setScissor(0, 0, dw, dh);
        device.clear({
            color: [ 0.5, 0.5, 0.5, 1 ],
            flags: pc.gfx.CLEARFLAG_COLOR
        });
        device.updateEnd();

        // render current camera
        var cameraEntity = editor.call('camera:current');
        if (cameraEntity && cameraEntity.camera) {
            var cameraNode = cameraEntity.camera.camera;

            cameraNode.setRenderTarget(null);

            if (cameraEntity.__editorCamera) {
                var clearColor = this.designerSettings.camera_clear_color;
                cameraEntity.camera.clearColor = new pc.Color(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
                if (cameraEntity.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                    cameraEntity.camera.nearClip = this.designerSettings.camera_near_clip;
                    cameraEntity.camera.farClip = this.designerSettings.camera_far_clip;
                }
            }

            cameraEntity.camera.rect = rect;

            cameraEntity.camera.frameBegin();
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

    Designer.prototype._tick = function () {
        pc.app = this;

        if (this.redraw) {
            var dt = this.getDt();
            this.redraw = editor.call('viewport:keepRendering');

            this.graphicsDevice.updateClientRect();

            // Perform ComponentSystem update
            editor.emit('viewport:preUpdate', dt);
            editor.emit('viewport:update', dt);
            pc.ComponentSystem.fire('toolsUpdate', dt);
            editor.emit('viewport:postUpdate', dt);
            editor.emit('viewport:gizmoUpdate', dt);

            this.render();
        }

        // Submit a request to queue up a new animation frame immediately
        requestAnimationFrame(this.tick, this.graphicsDevice.canvas);
    };

    Designer.prototype.resize = function (w, h) {
        this.graphicsDevice.width = w;
        this.graphicsDevice.height = h;
        this.picker.resize(w, h);
        this.redraw = true;
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
});
