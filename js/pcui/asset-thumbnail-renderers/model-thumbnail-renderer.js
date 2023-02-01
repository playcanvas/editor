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
        previewRoot: null
    };

    function initializeScene() {
        const app = pc.Application.getApplication();

        // material
        scene.material = new pc.StandardMaterial();
        scene.material.useSkybox = false;
        scene.material.useFog = false;

        scene.aabb = new pc.BoundingBox();

        // model
        const modelNode = new pc.GraphNode();

        const meshSphere = pc.createSphere(app.graphicsDevice, {
            radius: 0,
            latitudeBands: 2,
            longitudeBands: 2
        });

        scene.modelPlaceholder = new pc.Model();
        scene.modelPlaceholder.node = modelNode;
        scene.modelPlaceholder.meshInstances = [new pc.MeshInstance(modelNode, meshSphere, scene.material)];

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
        scene.previewRoot.enabled = true;
        scene.previewRoot.addChild(modelNode);
        scene.previewRoot.addChild(scene.lightEntity);
        scene.previewRoot.addChild(scene.cameraOrigin);
        scene.previewRoot.syncHierarchy();
        scene.previewRoot.enabled = false;

        sceneInitialized = true;
    }

    class ModelThumbnailRenderer {
        constructor(asset, canvas) {
            this._asset = asset;
            this._canvas = canvas;

            this._queueRenderHandler = this.queueRender.bind(this);

            this._watch = editor.call('assets:model:watch', {
                asset: asset,
                autoLoad: true,
                callback: this._queueRenderHandler
            });

            this._rotationX = -15;
            this._rotationY = 45;

            this._queuedRender = false;

            this._frameRequest = null;

            this._evts = {};
            this._materialWatches = {};

            // when any of the mesh instance material mappings change, reload the materials
            this._evts.setMaterialMappingsEvent = this._asset.on('*:set', (path) => {
                if (path.startsWith('data.mapping')) {
                    this.queueRender();
                }
            });
        }

        _watchMaterials() {
            this._unwatchMaterials();

            const mapping = this._asset.get('data.mapping');
            if (!mapping) return;

            for (const key in mapping) {
                const materialId = mapping[key].material;
                if (materialId) {
                    this._watchMaterial(materialId);
                }
            }
        }

        _watchMaterial(id) {
            const material = editor.call('assets:get', id);
            if (material) {
                this._materialWatches[id] = editor.call('assets:material:watch', {
                    asset: material,
                    autoLoad: true,
                    loadMaterial: true,
                    callback: this._queueRenderHandler
                });
            }
        }

        _unwatchMaterial(id) {
            const material = editor.call('assets:get', id);
            if (material) {
                editor.call('assets:material:unwatch', material, this._materialWatches[id]);
            }
            delete this._materialWatches[id];
        }

        _unwatchMaterials() {
            for (const id in this._materialWatches) {
                this._unwatchMaterial(id);
            }
        }

        queueRender() {
            if (this._queuedRender) return;
            if (!this._asset) return;

            this._queuedRender = true;
            this._frameRequest = requestAnimationFrame(() => {
                this.render(this._rotationX, this._rotationY);
            });
        }

        render(rotationX = -15, rotationY = 45) {
            this._queuedRender = false;

            if (!this._asset) return;

            const data = this._asset.get('data');
            if (!data) return;

            const app = pc.Application.getApplication();
            const modelAsset = app.assets.get(this._asset.get('id'));
            if (!modelAsset) return;

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
            scene.previewRoot._notifyHierarchyStateChanged(scene.previewRoot, true);

            scene.cameraEntity.camera.aspectRatio = height / width;
            layer.renderTarget = rt;

            let model = scene.modelPlaceholder;

            if (modelAsset._editorPreviewModel)
                model = modelAsset._editorPreviewModel.clone();

            model.lights = [scene.lightEntity.light.light];

            let first = true;

            const mapping = this._asset.get('data.mapping');
            const mappingIndex = new Set();
            for (const key in mapping) {
                if (mapping[key].material) {
                    mappingIndex.add(mapping[key].material);
                    if (!this._materialWatches[mapping[key].material]) {
                        this._watchMaterial(mapping[key].material);
                    }
                }
            }

            for (const key in this._materialWatches) {
                if (!mappingIndex.has(parseInt(key, 10))) {
                    this._unwatchMaterial(key);
                }
            }

            // generate aabb for model
            for (let i = 0; i < model.meshInstances.length; i++) {
                // initialize any skin instance
                if (model.meshInstances[i].skinInstance) {
                    model.meshInstances[i].skinInstance.updateMatrices(model.meshInstances[i].node);
                }

                let material;
                const materialId = this._asset.get(`data.mapping.${i}.material`);
                if (materialId) {
                    const materialAsset = app.assets.get(materialId);
                    if (materialAsset && materialAsset.resource) {
                        material = materialAsset.resource;
                    }
                }
                if (!material) {
                    material = scene.material;
                }
                model.meshInstances[i].material = material;

                if (first) {
                    first = false;
                    scene.aabb.copy(model.meshInstances[i].aabb);
                } else {
                    scene.aabb.add(model.meshInstances[i].aabb);
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

            layer.addMeshInstances(model.meshInstances);
            layer.addLight(scene.lightEntity.light);
            layer.addCamera(scene.cameraEntity.camera);

            // add camera to layer
            const backupLayers = scene.cameraEntity.camera.layers.slice();
            const newLayers = scene.cameraEntity.camera.layers;
            newLayers.push(layer.id);
            scene.cameraEntity.camera.layers = newLayers;

            // disable fog
            const backupFogType = app.scene.fog;
            app.scene.fog = pc.FOG_NONE;

            app.renderComposition(layerComposition);

            // restore fog settings
            app.scene.fog = backupFogType;

            // restore camera layers
            scene.cameraEntity.camera.layers = backupLayers;

            // read pixels from texture
            var device = app.graphicsDevice;
            device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, rt.impl._glFrameBuffer);
            device.gl.readPixels(0, 0, width, height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, rt.pixels);

            // render to canvas
            const ctx = this._canvas.getContext('2d');
            ctx.putImageData(new ImageData(rt.pixelsClamped, width, height), (this._canvas.width - width) / 2, (this._canvas.height - height) / 2);

            layer.removeLight(scene.lightEntity.light);
            layer.removeCamera(scene.cameraEntity.camera);
            layer.removeMeshInstances(model.meshInstances);
            layer.renderTarget = null;
            scene.previewRoot.enabled = false;

            if (model !== scene.modelPlaceholder) {
                model.destroy();
            }
        }

        destroy() {
            if (this._watch) {
                editor.call('assets:model:unwatch', this._asset, this._watch);
                this._watch = null;
            }

            this._unwatchMaterials();

            for (const key in this._evts) {
                this._evts[key].unbind();
            }
            this._evts = {};

            this._asset = null;
            this._canvas = null;

            if (this._frameRequest) {
                cancelAnimationFrame(this._frameRequest);
                this._frameRequest = null;
            }
        }
    }

    return {
        ModelThumbnailRenderer: ModelThumbnailRenderer
    };
})());
