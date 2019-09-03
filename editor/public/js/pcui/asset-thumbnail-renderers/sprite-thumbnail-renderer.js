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

    const CENTER_PIVOT = [0.5, 0.5];

    // ImageCacheEntry
    // an item in the ImageCache
    // fires 'loaded' event if the Image element loads after being created
    class ImageCacheEntry extends Events {
        constructor(image) {
            super();

            this.value = image;
            this.status = 'loading';

            image.onload = function () {
                self.status = 'loaded';
                self.emit('loaded', self);
            };
        }
    }

    // ImageCache holds Image objects
    // cached with some key (asset.id)
    class ImageCache {
        constructor() {
            this._items = {};
        }

        // return true if key exists
        has(key) {
            return !!this._items[key];
        }

        // return the ImageCacheEntry at key
        get(key) {
            if (this.has(key)) return this._items[key];
            return null;
        }

        // Insert an Image element into the cache
        // Returns the new ImageCacheEntry
        insert(key, image) {
            var entry = new ImageCacheEntry(image);
            this._items[key] = entry;

            return entry;
        }
    }

    // Cache for holding Image elements used by compressed textures
    const imageCache = new ImageCache();

    function initializeScene() {
        const app = pc.Application.getApplication();

        // material
        scene.material = new pc.StandardMaterial();
        scene.material.useSkybox = false;

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
        scene.previewRoot._enabledInHierarchy = true;
        scene.previewRoot.enabled = true;
        scene.previewRoot.addChild(modelNode);
        scene.previewRoot.addChild(scene.lightEntity);
        scene.previewRoot.addChild(scene.cameraOrigin);
        scene.previewRoot.syncHierarchy();
        scene.previewRoot.enabled = false;

        sceneInitialized = true;
    }

    class SpriteThumbnailRenderer {

        constructor(asset, canvas, assetsList) {
            this._asset = asset;
            this._canvas = canvas;
            this._assets = assetsList;

            this._queueRenderHandler = this._queueRender.bind(this);

            this._watch = editor.call('assets:sprite:watch', {
                asset: asset,
                autoLoad: true,
                callback: this._queueRenderHandler
            });

            this._frame = 0;
            this._animating = false;

            this._queuedRender = false;
            this._frameRequest = null;
        }

        _queueRender() {
            if (this._queuedRender) return;
            this._queuedRender = true;
            this._frameRequest = requestAnimationFrame(() => {
                this.render(this._frame, this._animating);
            });
        }

        render(frame = 0, animating = false) {
            this._queuedRender = false;
            this._frameRequest = null;

            if (!sceneInitialized) {
                initializeScene();
            }

            this._frame = frame;
            this._animating = animating;

            const width = this._canvas.width;
            const height = this._canvas.height;

            const frameKeys = this._asset.get('data.frameKeys');
            if (! frameKeys || ! frameKeys.length) return this._cancelRender();

            const atlasId = this._asset.get('data.textureAtlasAsset');
            if (! atlasId) return this._cancelRender();

            const atlas = this._assets.get(atlasId);
            if (! atlas) return this._cancelRender();

            const frames = atlas.get('data.frames');
            if (! frames) return this._cancelRender();

            frame = frames[frameKeys[frame]];
            if (! frame) return this._cancelRender();

            const ctx = this._canvas.getContext('2d');

            const app = pc.Application.getApplication();

            const engineAtlas = app.assets.get(atlasId);
            if (!engineAtlas || !engineAtlas.resource || !engineAtlas.resource.texture) {
                return this._cancelRender();
            }

            const atlasTexture = engineAtlas.resource.texture;

            let leftBound = Number.POSITIVE_INFINITY;
            let rightBound = Number.NEGATIVE_INFINITY;
            let bottomBound = Number.POSITIVE_INFINITY;
            let topBound = Number.NEGATIVE_INFINITY;

            for (let i = 0; i < frameKeys.length; i++) {
                const f = frames[frameKeys[i]];
                if (! f) continue;

                const pivot = animating ? f.pivot : CENTER_PIVOT;
                const rect = f.rect;

                const left = -rect[2] * pivot[0];
                const right = (1 - pivot[0]) * rect[2];
                const bottom = -rect[3] * pivot[1];
                const top = (1 - pivot[1]) * rect[3];

                leftBound = Math.min(leftBound, left);
                rightBound = Math.max(rightBound, right);
                bottomBound = Math.min(bottomBound, bottom);
                topBound = Math.max(topBound, top);
            }

            const maxWidth = rightBound - leftBound;
            const maxHeight = topBound - bottomBound;

            const x = frame.rect[0];
            // convert bottom left WebGL coord to top left pixel coord
            const y = atlasTexture.height - frame.rect[1] - frame.rect[3];
            const w = frame.rect[2];
            const h = frame.rect[3];

            const canvasRatio = width / height;
            const aspectRatio = maxWidth / maxHeight;

            let widthFactor = width;
            let heightFactor = height;

            if (canvasRatio > aspectRatio) {
                widthFactor = height * aspectRatio;
            } else {
                heightFactor = width / aspectRatio;
            }

            // calculate x and width
            const pivot = animating ? frame.pivot : CENTER_PIVOT;
            const left = -frame.rect[2] * pivot[0];
            let offsetX = widthFactor * (left - leftBound) / maxWidth;
            const targetWidth = widthFactor * frame.rect[2] / maxWidth;

            // calculate y and height
            const top = (1 - pivot[1]) * frame.rect[3];
            let offsetY = heightFactor * (1 - (top - bottomBound) / maxHeight);
            const targetHeight = heightFactor * frame.rect[3] / maxHeight;

            // center it
            offsetX += (width - widthFactor) / 2;
            offsetY += (height - heightFactor) / 2;

            ctx.clearRect(0, 0, width, height);

            ctx.mozImageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;
            ctx.imageSmoothingEnabled = false;

            let img;
            if (atlasTexture._compressed && engineAtlas.file) {
                let entry = imageCache.get(engineAtlas.file.hash);
                if (entry) {
                    if (entry.status === 'loaded') {
                        img = entry.value;
                    } else {
                        entry.once('loaded', function (entry) {
                            editor.call('assets:sprite:watch:trigger', asset);
                        });
                    }

                } else {

                    // create an image element from the asset source file
                    // used in the preview if the texture contains compressed data
                    img = new Image();
                    img.src = engineAtlas.file.url;

                    // insert image into cache which fires an event when the image is loaded
                    entry = imageCache.insert(engineAtlas.file.hash, img);
                    entry.once('loaded', function (entry) {
                        editor.call('assets:sprite:watch:trigger', asset);
                    });
                }
            } else {
                img = atlasTexture.getSource();
            }

            if (!img) {
                return this._cancelRender();
            }

            ctx.drawImage(img, x, y, w, h, offsetX, offsetY, targetWidth, targetHeight);

            return true;
        }

        _cancelRender() {
            this._canvas.getContext('2d').clearRect(0, 0, this._canvas.width, this._canvas.height);
        }

        destroy() {
            if (this._watch) {
                editor.call('assets:sprite:unwatch', this._asset, this._watch);
                this._watch = null;
            }

            if (this._frameRequest) {
                cancelAnimationFrame(this._frameRequest);
                this._frameRequest = null;
            }

            this._asset = null;
            this._canvas = null;
            this._assets = null;
        }
    }

    return {
        SpriteThumbnailRenderer: SpriteThumbnailRenderer
    };
})());
