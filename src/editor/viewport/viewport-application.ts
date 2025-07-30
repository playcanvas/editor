let time;
const rect = new pc.Vec4(0, 0, 1, 1);

class ViewportApplication extends pc.Application {
    constructor(canvas, options) {
        super(canvas, options);

        this._inTools = true;
        for (const system of this.systems.list) {
            system._inTools = true;
        }

        this.setEditorSettings(options.editorSettings);
        this.sceneSettingsObserver = options.sceneSettingsObserver;

        // Draw immediately
        this.redraw = true;

        // define the tick method
        this.tick = this.makeTick();

        this.systems.on('toolsUpdate', this.systems.particlesystem.onUpdate, this.systems.particlesystem);
        this.systems.on('toolsUpdate', this.systems.animation.onUpdate, this.systems.animation);
        this.systems.on('toolsUpdate', this.systems.layoutgroup._onPostUpdate, this.systems.layoutgroup);
    }

    render() {
        // render current camera
        const cameraEntity = editor.call('camera:current');
        if (cameraEntity && cameraEntity.camera) {
            let showFog = true;

            if (cameraEntity.__editorCamera) {
                const clearColor = this.editorSettings.cameraClearColor;
                cameraEntity.camera.clearColor = new pc.Color(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
                if (cameraEntity.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                    cameraEntity.camera.nearClip = this.editorSettings.cameraNearClip || 0.0001;
                    cameraEntity.camera.farClip = this.editorSettings.cameraFarClip;
                    cameraEntity.camera.toneMapping = this.editorSettings.cameraToneMapping;
                    cameraEntity.camera.gammaCorrection = this.editorSettings.cameraGammaCorrection;
                }
                showFog = this.editorSettings.showFog;
            }

            this.scene.fog.type = showFog ? this.sceneSettingsObserver.get('render.fog') : pc.FOG_NONE;
            cameraEntity.camera.rect = rect;
        }

        super.render();
    }

    getDt() {
        const now = (window.performance && window.performance.now) ? performance.now() : Date.now();
        let dt = (now - (time || now)) / 1000.0;
        dt = pc.math.clamp(dt, 0, 0.1); // Maximum delta is 0.1s or 10 fps.
        time = now;
        return dt;
    }

    makeTick() {
        const app = this;
        return function () {
            requestAnimationFrame(app.tick);

            pc.app = app;

            const dt = app.getDt();

            if (app.redraw) {
                app.redraw = editor.call('viewport:keepRendering');

                app.graphicsDevice.updateClientRect();

                // Perform ComponentSystem update
                editor.emit('viewport:preUpdate', dt);
                editor.emit('viewport:update', dt);
                app.systems.fire('toolsUpdate', dt);
                editor.emit('viewport:postUpdate', dt);

                editor.emit('viewport:gizmoUpdate', dt);

                app.render();

                editor.emit('viewport:postRender');
            }
        };
    }

    setEditorSettings(settings) {
        this.editorSettings = settings;
        this.redraw = true;
    }
}

export { ViewportApplication };
