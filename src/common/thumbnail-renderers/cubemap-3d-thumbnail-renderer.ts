import { ThumbnailRenderer } from './thumbnail-renderer.ts';
import { LAYERID_SKYBOX } from '../../core/constants.ts';

const scene = {
    scene: null,
    cameraEntity: null,
    lightEntity: null,
    previewRoot: null,
    layerComposition: null,
    layer: null
};

let sceneInitialized = false;

function initializeScene(graphicsDevice) {
    scene.layer = new pc.Layer({
        id: LAYERID_SKYBOX,
        enabled: true,
        opaqueSortMode: 0
    });

    scene.layerComposition = new pc.LayerComposition('cubemap-thumbnail-renderer');
    scene.layerComposition.push(scene.layer);

    scene.scene = new pc.Scene(graphicsDevice);
    scene.scene.layers = scene.layerComposition;

    scene.cameraEntity = new pc.Entity();
    scene.cameraEntity.setLocalPosition(0, 0, 0);
    scene.cameraEntity.addComponent('camera', {
        nearClip: 1,
        farClip: 32,
        clearColor: [0, 0, 0, 1],
        fov: 75,
        frustumCulling: false,
        layers: []
    });

    scene.lightEntity = new pc.Entity();
    scene.lightEntity.addComponent('light', {
        type: 'directional'
    });

    scene.previewRoot = new pc.Entity();
    scene.previewRoot.enabled = true;
    scene.previewRoot.addChild(scene.cameraEntity);
    scene.previewRoot.addChild(scene.lightEntity);
    scene.previewRoot.syncHierarchy();
    scene.previewRoot.enabled = false;

    sceneInitialized = true;
}

class Cubemap3dThumbnailRenderer extends ThumbnailRenderer {
    constructor(asset, canvas, sceneSettings) {
        super();

        this._asset = asset;
        this._canvas = canvas;

        this._queueRenderHandler = this.queueRender.bind(this);

        this._rotationX = 0;
        this._rotationY = 0;
        this._mipLevel = 0;

        this._watch = editor.call('assets:cubemap:watch', {
            asset: asset,
            autoLoad: true,
            callback: this._queueRenderHandler
        });

        this._sceneSettings = sceneSettings || editor.call('sceneSettings');
        this._evtSceneSettings = this._sceneSettings.on('*:set', this._queueRenderHandler);

        this._queuedRender = false;
        this._frameRequest = null;
    }

    queueRender() {
        if (this._queuedRender) return;
        if (!this._asset) return;

        this._queuedRender = true;
        this._frameRequest = requestAnimationFrame(() => {
            this.render(this._rotationX, this._rotationY, this._mipLevel);
        });
    }

    render(rotationX = 0, rotationY = 0, mipLevel = 0) {
        this._queuedRender = false;

        if (!this._asset) return;

        const app = pc.Application.getApplication();
        const device = app.graphicsDevice;

        if (!sceneInitialized) {
            initializeScene(app.graphicsDevice);
        }

        this._rotationX = rotationX;
        this._rotationY = rotationY;
        this._mipLevel = mipLevel;

        let width = this._canvas.width;
        let height = this._canvas.height;

        if (width > height) {
            width = height;
        } else {
            height = width;
        }

        const rt = this.getRenderTarget(app.graphicsDevice, width, height);

        scene.previewRoot.enabled = true;
        scene.previewRoot._notifyHierarchyStateChanged(scene.previewRoot, true);

        scene.cameraEntity.camera.aspectRatio = height / width;
        scene.cameraEntity.camera.renderTarget = rt;

        scene.cameraEntity.setLocalEulerAngles(rotationX, rotationY, 0);

        const engineAsset = app.assets.get(this._asset.get('id'));

        if (engineAsset && engineAsset.resources) {
            if (scene.scene.skybox !== engineAsset.resources[0]) {
                scene.scene.setSkybox(engineAsset.resources);

                if (engineAsset.file) {
                    scene.scene.skyboxMip = mipLevel;
                } else {
                    scene.scene.skyboxMip = 0;
                }
            }

        } else {
            scene.scene.setSkybox(null);
        }

        const settings = this._sceneSettings.json();
        scene.scene.ambientLight.set(settings.render.global_ambient[0], settings.render.global_ambient[1], settings.render.global_ambient[2]);
        scene.cameraEntity.gammaCorrection = settings.render.gamma_correction;
        scene.cameraEntity.toneMapping = settings.render.tonemapping;
        scene.scene.exposure = settings.render.exposure;
        scene.scene.skyboxIntensity = settings.render.skyboxIntensity === undefined ? 1 : settings.render.skyboxIntensity;

        scene.scene._updateSkyMesh();

        scene.layer.addCamera(scene.cameraEntity.camera);
        scene.layer.addLight(scene.lightEntity.light);

        // add camera to layer
        const backupLayers = scene.cameraEntity.camera.layers.slice();
        const newLayers = scene.cameraEntity.camera.layers;
        newLayers.push(scene.layer.id);
        scene.cameraEntity.camera.layers = newLayers;

        app.renderComposition(scene.layerComposition);

        // restore camera layers
        scene.cameraEntity.camera.layers = backupLayers;

        // read pixels from texture
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, rt.impl._glFrameBuffer);
        device.gl.readPixels(0, 0, width, height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, rt.pixels);

        // render to canvas
        const ctx = this._canvas.getContext('2d');
        ctx.putImageData(new ImageData(rt.pixelsClamped, width, height), (this._canvas.width - width) / 2, (this._canvas.height - height) / 2);

        scene.layer.removeLight(scene.lightEntity.light);
        scene.layer.removeCamera(scene.cameraEntity.camera);
        scene.previewRoot.enabled = false;
    }

    destroy() {
        if (this._watch) {
            editor.call('assets:cubemap:unwatch', this._asset, this._watch);
            this._watch = null;
        }

        if (this._evtSceneSettings) {
            this._evtSceneSettings.unbind();
            this._evtSceneSettings = null;
        }

        if (this._frameRequest) {
            cancelAnimationFrame(this._frameRequest);
            this._frameRequest = null;
        }

        this._asset = null;
        this._sceneSettings = null;
        this._canvas = null;
    }
}

export { Cubemap3dThumbnailRenderer };
