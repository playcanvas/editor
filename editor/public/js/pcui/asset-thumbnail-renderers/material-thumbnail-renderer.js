Object.assign(pcui, (function () {
    'use strict';

    const PREFILTERED_CUBEMAP_PROPERTIES = [
        'prefilteredCubeMap128',
        'prefilteredCubeMap64',
        'prefilteredCubeMap32',
        'prefilteredCubeMap16',
        'prefilteredCubeMap8',
        'prefilteredCubeMap4'
    ];

    let material, materialParser, sphere, box, lightEntity, cameraOrigin, cameraEntity, previewRoot;
    let sceneInitialized = false;

    function initializeScene() {
        // material parser
        materialParser = new pc.JsonStandardMaterialParser();

        // material
        material = new pc.StandardMaterial();

        // sphere
        sphere = new pc.Entity();
        sphere.addComponent('model', {
            type: 'sphere',
            layers: []
        });
        sphere.model.material = material;

        // box
        box = new pc.Entity();
        box.addComponent('model', {
            type: 'box',
            layers: []
        });
        box.setLocalScale(0.6, 0.6, 0.6);
        box.model.material = material;

        // light
        lightEntity = new pc.Entity();
        lightEntity.addComponent('light', {
            type: 'directional',
            layers: []
        });
        lightEntity.setLocalEulerAngles(45, 45, 0);

        // camera
        cameraOrigin = new pc.GraphNode();

        cameraEntity = new pc.Entity();
        cameraEntity.addComponent('camera', {
            nearClip: 0.1,
            farClip: 32,
            clearColor: new pc.Color(41 / 255, 53 / 255, 56 / 255, 0.0),
            frustumCulling: false,
            layers: []
        });
        cameraEntity.setLocalPosition(0, 0, 1.35);
        cameraOrigin.addChild(cameraEntity);

        // All preview objects live under this root
        previewRoot = new pc.Entity();
        previewRoot._enabledInHierarchy = true;
        previewRoot.enabled = true;
        previewRoot.addChild(box);
        previewRoot.addChild(sphere);
        previewRoot.addChild(lightEntity);
        previewRoot.addChild(cameraOrigin);
        previewRoot.syncHierarchy();
        previewRoot.enabled = false;

        sceneInitialized = true;
    }

    class MaterialThumbnailRenderer {

        constructor(asset, canvas, sceneSettings) {
            this._asset = asset;
            this._canvas = canvas;

            this._queueRenderHandler = this.queueRender.bind(this);

            this._watch = editor.call('assets:material:watch', {
                asset: asset,
                autoLoad: true,
                callback: this._queueRenderHandler
            });

            this._skyboxWatchHandle = null;

            this._queuedRender = false;

            this._rotationX = 0;
            this._rotationY = 0;
            this._model = 'sphere';

            this._evtSceneSettingsSet = null;

            this._skybox = null;
            this._evtAddSkybox = null;
            this._evtChangeSkybox = null;

            if (!sceneSettings) {
                sceneSettings = editor.call('sceneSettings');
            }

            if (sceneSettings) {
                this._evtChangeSkybox = sceneSettings.on('render.skybox:set', (value) => {
                    this._unwatchSkybox();

                    if (value) {
                        this._watchSkybox(value);
                    }
                });

                const skybox = sceneSettings.get('render.skybox');
                if (skybox) {
                    this._watchSkybox(skybox);
                }

                this._evtSceneSettingsSet = sceneSettings.on('*:set', this._queueRenderHandler);
            }

            this._frameRequest = null;
        }

        _unwatchSkybox() {
            if (this._skybox) {
                editor.call('assets:cubemap:unwatch', this._skybox, this._skyboxWatchHandle);
                this._skybox = null;
                this._skyboxWatchHandle = null;
            }

            if (this._evtAddSkybox) {
                this._evtAddSkybox.unbind();
                this._evtAddSkybox = null;
            }
        }

        _watchSkybox(id) {
            const asset = editor.call('assets:get', id);
            if (asset) {
                this._skybox = asset;

                this._skyboxWatchHandle = editor.call('assets:cubemap:watch', {
                    asset: asset,
                    autoLoad: true,
                    callback: this._queueRenderHandler
                });
            } else {
                this._evtAddSkybox = editor.once(`assets:add[${id}]`, () => {
                    this._watchSkybox(id);
                });
            }
        }

        queueRender() {
            if (this._queuedRender) return;
            if (!this._asset) return;

            this._queuedRender = true;

            this._frameRequest = requestAnimationFrame(() => {
                this.render(this._rotationX, this._rotationY, this._model);
            });
        }

        render(rotationX = 0, rotationY = 0, model = 'sphere') {
            this._queuedRender = false;

            if (!this._asset) return;

            this._rotationX = rotationX;
            this._rotationY = rotationY;
            this._model = model;

            var data = this._asset.get('data');
            if (! data) return;

            if (!sceneInitialized) initializeScene();

            const app = pc.Application.getApplication();
            const layerComposition = pcui.ThumbnailRendererUtils.layerComposition;
            const layer = pcui.ThumbnailRendererUtils.layer;

            let width = this._canvas.width;
            let height = this._canvas.height;

            if (width > height)
                width = height;
            else
                height = width;

            const rt = pcui.ThumbnailRendererUtils.getRenderTarget(app, width, height);

            previewRoot.enabled = true;

            cameraEntity.camera.aspectRatio = height / width;

            layer.renderTarget = rt;

            if (model === 'box') {
                sphere.enabled = false;
                box.enabled = true;
            } else {
                sphere.enabled = true;
                box.enabled = false;
            }

            cameraOrigin.setLocalEulerAngles(rotationX, rotationY, 0);

            lightEntity.light.intensity = 1.0 / (Math.min(1.0, app.scene.exposure) || 0.01);

            // migrate material data
            const migrated = materialParser.migrate(data);

            // convert asset references to engine resources

            // first handle texture assets
            for (let i = 0; i < pc.StandardMaterial.TEXTURE_PARAMETERS.length; i++) {
                const name = pc.StandardMaterial.TEXTURE_PARAMETERS[i];
                if (! migrated.hasOwnProperty(name) || ! migrated[name]) continue;

                const engineAsset = app.assets.get(migrated[name]);
                if (! engineAsset || ! engineAsset.resource) {
                    migrated[name] = null;
                    if (engineAsset) {
                        app.assets.load(engineAsset);
                    }
                } else {
                    migrated[name] = engineAsset.resource;
                }
            }

            // then handle cubemap assets
            for (let i = 0; i < pc.StandardMaterial.CUBEMAP_PARAMETERS.length; i++) {
                const name = pc.StandardMaterial.CUBEMAP_PARAMETERS[i];
                if (! migrated.hasOwnProperty(name) || ! migrated[name]) continue;

                const engineAsset = app.assets.get(migrated[name]);
                if (! engineAsset) {
                    migrated[name] = null;
                } else {
                    if (engineAsset.resource) {
                        migrated[name] = engineAsset.resource;
                        if (engineAsset.file && engineAsset.resources && engineAsset.resources.length === 7) {
                            for (var j = 0; j < 6; j++) {
                                migrated[PREFILTERED_CUBEMAP_PROPERTIES[j]] = engineAsset.resources[i + 1];
                            }
                        }
                    }

                    if (migrated.shadingModel === pc.SPECULAR_PHONG) {
                        // phong based - so ensure we load individual faces
                        engineAsset.loadFaces = true;
                        app.assets.load(engineAsset);
                    }
                }
            }

            // re-initialize material with migrated properties
            material.reset();
            materialParser.initialize(material, migrated);
            material.useFog = false;

            // set up layer
            layer.addCamera(cameraEntity.camera);
            layer.addLight(lightEntity.light);
            layer.addMeshInstances(sphere.enabled ? sphere.model.meshInstances : box.model.meshInstances);

            // add camera to layer
            let backupLayers = cameraEntity.camera.layers.slice();
            let newLayers = cameraEntity.camera.layers;
            newLayers.push(layer.id);
            cameraEntity.camera.layers = newLayers;

            // render
            app.renderer.renderComposition(layerComposition);

            // restore camera layers
            cameraEntity.camera.layers = backupLayers;

            // read pixels from texture
            var device = app.graphicsDevice;
            device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, rt._glFrameBuffer);
            device.gl.readPixels(0, 0, width, height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, rt.pixels);

            // render to canvas
            const ctx = this._canvas.getContext('2d');
            ctx.putImageData(new ImageData(rt.pixelsClamped, width, height), (this._canvas.width - width) / 2, (this._canvas.height - height) / 2);

            // clean up
            layer.renderTarget = null;
            layer.removeCamera(cameraEntity.camera);
            layer.removeLight(lightEntity.light);
            layer.removeMeshInstances(sphere.enabled ? sphere.model.meshInstances : box.model.meshInstances);
            previewRoot.enabled = false;
        }

        destroy() {
            if (this._watch) {
                editor.call('assets:material:unwatch', this._asset, this._watch);
                this._watch = null;
            }

            if (this._evtSceneSettingsSet) {
                this._evtSceneSettingsSet.unbind();
                this._evtSceneSettingsSet = null;
            }

            this._unwatchSkybox();

            if (this._frameRequest) {
                cancelAnimationFrame(this._frameRequest);
                this._frameRequest = null;
            }

            this._asset = null;
            this._canvas = null;
        }
    }

    return {
        MaterialThumbnailRenderer: MaterialThumbnailRenderer
    };
})());
