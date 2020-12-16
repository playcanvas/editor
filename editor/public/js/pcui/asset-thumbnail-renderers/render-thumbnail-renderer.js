Object.assign(pcui, (function () {
    'use strict';

    let sceneInitialized = false;

    const scene = {
        cameraEntity: null,
        cameraOrigin: null,
        lightEntity: null,
        material: null,
        aabb: null,
        modelPlaceholder: null,
        previewRoot: null,
        renderEntity: null
    };

    function initializeScene() {
        const app = pc.Application.getApplication();

        // material
        scene.material = new pc.StandardMaterial();
        scene.material.useSkybox = false;
        scene.material.useFog = false;

        scene.aabb = new pc.BoundingBox();

        // render entity
        // don't set rootBone, this renders the mesh wthout skinning (and does not need the hierarchy)
        scene.renderEntity = new pc.Entity('previewRenderEntity');
        scene.renderEntity.addComponent('render', {
            type: 'asset'
        });

        // light
        scene.lightEntity = new pc.Entity();
        scene.lightEntity.addComponent('light', {
            type: 'directional',
            layers: []
        });
        scene.lightEntity.setLocalEulerAngles(45, 135, 0);


        // camera
        scene.cameraOrigin = new pc.Entity();

        scene.cameraEntity = new pc.Entity();
        scene.cameraEntity.addComponent('camera', {
            nearClip: 0.01,
            farClip: 32,
            clearColor: new pc.Color(41 / 255, 53 / 255, 56 / 255, 0.0),
            frustumCulling: false,
            layers: []
        });
        scene.cameraEntity.setLocalPosition(0, 0, 1.35);
        scene.cameraOrigin.addChild(scene.cameraEntity);

        // All preview objects live under this root
        scene.previewRoot = new pc.Entity();
        scene.previewRoot._enabledInHierarchy = true;
        scene.previewRoot.enabled = true;
        scene.previewRoot.addChild(scene.renderEntity);
        scene.previewRoot.addChild(scene.lightEntity);
        scene.previewRoot.addChild(scene.cameraOrigin);
        scene.previewRoot.syncHierarchy();
        scene.previewRoot.enabled = false;

        sceneInitialized = true;
    }

    class RenderThumbnailRenderer {

        constructor(asset, canvas) {
            this._asset = asset;
            this._canvas = canvas;

            this._queueRenderHandler = this.queueRender.bind(this);

            this._watch = editor.call('assets:render:watch', {
                asset: asset,
                autoLoad: true,
                callback: this._queueRenderHandler
            });

            this._rotationX = -15;
            this._rotationY = 45;

            this._queuedRender = false;

            this._frameRequest = null;
        }

        queueRender() {
            if (this._queuedRender) return;
            this._queuedRender = true;
            this._frameRequest = requestAnimationFrame(() => {
                this.render(this._rotationX, this._rotationY);
            });
        }

        render(rotationX = -15, rotationY = 45) {
            this._queuedRender = false;

            const data = this._asset.get('data');
            if (! data) return;

            const app = pc.Application.getApplication();
            const renderAsset = app.assets.get(this._asset.get('id'));
            if (! renderAsset) return;

            if (!sceneInitialized) {
                initializeScene();
            }

            this._rotationX = rotationX;
            this._rotationY = rotationY;

            const layerComposition = pcui.ThumbnailRendererUtils.layerComposition;
            const layer = pcui.ThumbnailRendererUtils.layer;

            let width = this._canvas.width;
            let height = this._canvas.height;

            if (width > height) {
                width = height;
            } else {
                height = width;
            }

            const rt = pcui.ThumbnailRendererUtils.getRenderTarget(app, width, height);

            scene.previewRoot.enabled = true;

            scene.cameraEntity.camera.aspectRatio = height / width;
            layer.renderTarget = rt;

            scene.renderEntity.render.asset = renderAsset;
            scene.renderEntity.render.material = scene.material;

            let first = true;

            // generate aabb for render
            var meshInstances = scene.renderEntity.render.meshInstances;
            for (let i = 0; i < meshInstances.length; i++) {
                // initialize any skin instance
                if (meshInstances[i].skinInstance) {
                    meshInstances[i].skinInstance.updateMatrices(meshInstances[i].node);
                }

                if (first) {
                    first = false;
                    scene.aabb.copy(meshInstances[i].aabb);
                } else {
                    scene.aabb.add(meshInstances[i].aabb);
                }
            }

            if (first) {
                scene.aabb.center.set(0, 0, 0);
                scene.aabb.halfExtents.set(0.1, 0.1, 0.1);
            }

            scene.material.update();

            const max = scene.aabb.halfExtents.length();
            scene.cameraEntity.setLocalPosition(0, 0, max * 2.5);

            scene.cameraOrigin.setLocalPosition(scene.aabb.center);
            scene.cameraOrigin.setLocalEulerAngles(rotationX, rotationY, 0);
            scene.cameraOrigin.syncHierarchy();

            scene.lightEntity.setLocalRotation(scene.cameraOrigin.getLocalRotation());
            scene.lightEntity.rotateLocal(90, 0, 0);

            scene.cameraEntity.camera.farClip = max * 5.0;

            scene.lightEntity.light.intensity = 1.0 / (Math.min(1.0, app.scene.exposure) || 0.01);

            if (meshInstances.length) {
                layer.addMeshInstances(meshInstances);
            }
            layer.addLight(scene.lightEntity.light);
            layer.addCamera(scene.cameraEntity.camera);

            app.renderer.renderComposition(layerComposition);

            // read pixels from texture
            var device = app.graphicsDevice;
            device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, rt._glFrameBuffer);
            device.gl.readPixels(0, 0, width, height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, rt.pixels);

            // render to canvas
            const ctx = this._canvas.getContext('2d');
            ctx.putImageData(new ImageData(rt.pixelsClamped, width, height), (this._canvas.width - width) / 2, (this._canvas.height - height) / 2);

            layer.removeLight(scene.lightEntity.light);
            layer.removeCamera(scene.cameraEntity.camera);
            layer.removeMeshInstances(scene.renderEntity.render.meshInstances);
            layer.renderTarget = null;
            scene.previewRoot.enabled = false;
        }

        destroy() {
            if (this._watch) {
                editor.call('assets:render:unwatch', this._asset, this._watch);
                this._watch = null;
            }

            this._asset = null;
            this._canvas = null;

            if (this._frameRequest) {
                cancelAnimationFrame(this._frameRequest);
                this._frameRequest = null;
            }
        }
    }

    return {
        RenderThumbnailRenderer: RenderThumbnailRenderer
    };
})());
