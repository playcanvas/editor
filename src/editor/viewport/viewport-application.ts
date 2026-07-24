import { Application, Color, FOG_NONE, math, PROJECTION_PERSPECTIVE, Vec4 } from 'playcanvas';

let time;
const rect = new Vec4(0, 0, 1, 1);

class ViewportApplication extends Application {
    editorSettings!: Record<string, unknown>;

    redraw = false;

    constructor(
        canvas: HTMLCanvasElement,
        options: ConstructorParameters<typeof Application>[1] & { editorSettings?: Record<string, unknown> }
    ) {
        super(canvas, options);

        this._inTools = true;
        for (const system of this.systems.list) {
            system._inTools = true;
        }

        this.setEditorSettings(options.editorSettings);

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
                cameraEntity.camera.clearColor = new Color(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
                if (cameraEntity.camera.projection === PROJECTION_PERSPECTIVE) {
                    cameraEntity.camera.nearClip = this.editorSettings.cameraNearClip || 0.0001;
                    cameraEntity.camera.farClip = this.editorSettings.cameraFarClip;
                    cameraEntity.camera.toneMapping = this.editorSettings.cameraToneMapping;
                    cameraEntity.camera.gammaCorrection = this.editorSettings.cameraGammaCorrection;
                }
                showFog = this.editorSettings.showFog as boolean;
            }

            this.scene.fog.type = showFog ? (editor.call('sceneSettings')?.get('render.fog') ?? FOG_NONE) : FOG_NONE;
            cameraEntity.camera.rect = rect;
        }

        super.render();
    }

    getDt() {
        const now = window.performance && window.performance.now ? performance.now() : Date.now();
        let dt = (now - (time || now)) / 1000.0;
        dt = math.clamp(dt, 0, 0.1); // Maximum delta is 0.1s or 10 fps.
        time = now;
        return dt;
    }

    makeTick() {
        return () => {
            requestAnimationFrame(this.tick);

            const dt = this.getDt();

            // the engine's own tick fires 'framerender' every frame, even when no frame is
            // rendered. unified gsplat rendering depends on it: the gsplat system advances its
            // streaming from this event (LOD loading and turning gsplat placement changes into
            // a new world state). this tick replaces the engine's, so fire it here too —
            // without it, adding/removing/toggling gsplat components after the first one is
            // never picked up and the viewport renders a stale set of splats.
            this.fire('framerender');

            if (this.redraw) {
                this.redraw = editor.call('viewport:keepRendering');

                this.graphicsDevice.updateClientRect();

                // Perform ComponentSystem update
                editor.emit('viewport:preUpdate', dt);
                editor.emit('viewport:update', dt);
                this.systems.fire('toolsUpdate', dt);
                editor.emit('viewport:postUpdate', dt);

                editor.emit('viewport:gizmoUpdate', dt);

                editor.emit('viewport:preRender');
                this.render();
                editor.emit('viewport:postRender');
            }
        };
    }

    setEditorSettings(settings: Record<string, unknown>) {
        this.editorSettings = settings;
        this.redraw = true;
    }
}

export { ViewportApplication };
