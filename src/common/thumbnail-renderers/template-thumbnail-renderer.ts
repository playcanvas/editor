import { Asset as EditorAsset } from '@playcanvas/editor-api';
import type { Entity, Layer, Template, Asset, AppBase, WebglGraphicsDevice, MeshInstance, RenderComponent, BoundingBox, AssetReference } from 'playcanvas';

import { ThumbnailRenderer } from './thumbnail-renderer.ts';

function calculateBoundingBoxOfMeshInstances(meshInstances: MeshInstance[]): BoundingBox {
    const aabb = new pc.BoundingBox();
    let first = true;
    for (const meshInstance of meshInstances) {
        if (first) {
            aabb.copy(meshInstance.aabb);
            first = false;
        } else {
            aabb.add(meshInstance.aabb);
        }
    }
    // Nothing there, fall back to a default cube
    if (first) {
        aabb.center.set(0, 0, 0);
        aabb.halfExtents.set(0.1, 0.1, 0.1);
    }
    return aabb;
}


class TemplatePreviewScene extends pc.EventHandler {
    sceneRoot: Entity;

    templateOrigin: Entity;

    templateInstance?: Entity;

    cameraEntity: Entity;

    cameraOrigin: Entity;

    lightEntity: Entity;

    private renderComponents: RenderComponent[] = [];

    meshInstances: MeshInstance[] | null = null;

    materialAssetIds: number[] = [];

    aabb: BoundingBox;

    requiredAssetLoadCount = 0;

    assetLoadedCount = 0;

    isInitialized = false;

    constructor(private readonly app: AppBase) {
        super();
    }

    enableScene() {
        this.sceneRoot.enabled = true;
        // @ts-ignore
        // this.sceneRoot._enabledInHierarchy is false because it has no parent. We need to manually set it to be true
        // with the following line.
        this.sceneRoot._notifyHierarchyStateChanged(this.sceneRoot, true);
    }

    disableScene() {
        // This also sets the `_enabledInHierarchy` to be false to itself and all its descendants.
        this.sceneRoot.enabled = false;
    }

    destroy() {
        this.sceneRoot.destroy();
    }

    initializePlaceholderScene() {
        // Camera
        this.cameraEntity = new pc.Entity();
        this.cameraOrigin = new pc.Entity();
        this.cameraEntity.addComponent('camera', {
            nearClip: 0.1,
            farClip: 32,
            clearColor: new pc.Color(41 / 255, 53 / 255, 56 / 255, 0.0),
            frustumCulling: false,
            layers: []
        });
        this.cameraEntity.setLocalPosition(0, 0, 1.35);
        this.cameraOrigin.addChild(this.cameraEntity);
        // Light
        this.lightEntity = new pc.Entity();
        this.lightEntity.addComponent('light', {
            type: 'directional',
            layers: []
        });
        this.lightEntity.setLocalEulerAngles(45, 135, 0);

        // Just a placeholder for the template origin
        this.templateOrigin = new pc.Entity();

        // Root for calculating the transformation etc.
        this.sceneRoot = new pc.Entity();
        this.sceneRoot.addChild(this.cameraOrigin);
        this.sceneRoot.addChild(this.lightEntity);
        this.sceneRoot.addChild(this.templateOrigin);

        // _enabled must be true for syncHierarchy to work
        this.sceneRoot.enabled = true;
        this.sceneRoot.syncHierarchy();
    }

    instantiateTemplate(template: Template) {
        this.isInitialized = false;
        if (this.templateInstance) {
            this.templateOrigin.removeChild(this.templateInstance);
            this.templateInstance.destroy();
        }

        this.meshInstances = null;
        this.materialAssetIds = [];
        this.templateInstance = template.instantiate();
        this.templateOrigin.addChild(this.templateInstance);

        this.renderComponents = (this.templateInstance.findComponents('render') as RenderComponent[]);

        // Filtering out Render components that are disabled in the hierarchy
        // We need the .enabled() to be correct, this can only be true, if "fake" set the root's _enabledInHierarchy to true.
        this.enableScene();
        this.renderComponents = this.renderComponents.filter(rc => rc.entity.enabled);
        this.disableScene();

        // TODO: Start a timer and probably just abandon if it's taking too long to load.
        this.assetLoadedCount = this.requiredAssetLoadCount = 0;

        this.renderComponents.forEach((component) => {
            // Some components do not have an asset (e.g. spheres)
            if (component.asset) {
                this.queueAssetLoad(component.asset);
            }
            if (component.materialAssets) {
                component.materialAssets.forEach((assetId) => {
                    if (assetId) {
                        this.materialAssetIds.push(assetId);
                        this.queueAssetLoad(assetId);
                    }
                });
            }
        });
    }

    private queueAssetLoad(assetId: number) {
        if (!assetId) {
            console.warn('Asset ID not provided');
            return;
        }
        this.requiredAssetLoadCount++;
        const asset = this.app.assets.get(assetId);

        asset.ready(this.handleAssetLoad.bind(this));
        this.app.assets.load(asset);
    }

    private handleAssetLoad(asset: Asset) {
        this.assetLoadedCount++;

        if (asset.type === 'render') {
            // @ts-ignore
            const containerAssetId = asset.data.containerAsset;
            if (containerAssetId) {
                this.queueAssetLoad(containerAssetId);
            }
        }

        if (asset.type === 'material') {
            const material = asset.resource;
            if (material instanceof pc.StandardMaterial) {
                for (const key in material._assetReferences) {
                    const value = material._assetReferences[key] as AssetReference;
                    const asset = value.asset;
                    if (asset instanceof pc.Asset) {
                        this.queueAssetLoad(asset.id);
                    }
                }
            }
        }

        // There might be some other types that we might want to wait on, but for now it should cover
        // most cases.

        if (this.assetLoadedCount >= this.requiredAssetLoadCount) {
            // Now we should be able to have all mesh instances and we can load.
            this.initializeMeshInstances();
            this.isInitialized = true;
            this.fire('loaded');
        }
    }

    initializeMeshInstances() {
        // Already initialised
        if (this.meshInstances !== null) {
            return;
        }

        this.meshInstances = [];
        // We need to load the materials and render assets in case it is not here
        this.renderComponents.forEach((renderComponent) => {
            // Detach this component from the app.scene.layers
            // If we don't do this, we have "ghost" mesh instances lingering in app.scene.layers
            renderComponent.layers = [];
            this.meshInstances.push(...renderComponent.meshInstances);
        });
        this.aabb = calculateBoundingBoxOfMeshInstances(this.meshInstances);
    }
}


export class TemplateThumbnailRenderer extends ThumbnailRenderer {
    private scene: TemplatePreviewScene;

    private templateAsset: Asset;

    private readonly app: AppBase;

    private requestFrameId: number | null = null;

    private rotationX: number = -20;

    private rotationY: number = 25;

    private materialWatches: Map<number, number> = new Map();

    private readonly handleQueueRender: () => void;

    private readonly handleTemplateAssetLoad: (asset: Asset) => void;

    private readonly handleTemplateAssetChange: (asset: Asset) => void;

    constructor(editorAsset: EditorAsset,
                private _canvas: HTMLCanvasElement) {
        super();
        this.app = pc.Application.getApplication();

        this.scene = new TemplatePreviewScene(this.app);
        this.scene.initializePlaceholderScene();
        this.handleQueueRender = this.queueRender.bind(this);
        this.handleTemplateAssetLoad = this.onTemplateAssetLoad.bind(this);
        this.handleTemplateAssetChange = this.onTemplateAssetChange.bind(this);

        this.templateAsset = this.app.assets.get(editorAsset.get('id'));

        if (this.templateAsset?.type === 'template') {
            this.templateAsset.on('change', this.handleTemplateAssetChange);
            this.templateAsset.ready(this.handleTemplateAssetLoad);
            this.app.assets.load(this.templateAsset);
        } else {
            console.error('No template asset was passed into the thumbnail renderer');
        }
    }

    queueRender() {
        if (this.requestFrameId !== null) {
            return;
        }
        this.requestFrameId = requestAnimationFrame(() => {
            this.render(this.rotationX, this.rotationY);
        });
    }

    private onTemplateAssetChange(_asset: Asset, type: string) {
        if (type === 'data') {
            // It's not patched yet. The 'change' event gets fired before the patch in the asset registry happens.
            requestAnimationFrame(() => {
                this.handleTemplateAssetLoad(this.templateAsset);
                this.queueRender();
            });
        }
    }

    private onTemplateAssetLoad(engineAsset: Asset) {
        this.scene.instantiateTemplate(engineAsset.resource as Template);
        this.watchDependencies();
    }

    // The template visual can change even without applying an override. This happens when the texture of a material changes.
    private watchDependencies() {
        this.unwatchDependencies();

        const materialAssetIds = this.scene.materialAssetIds;
        materialAssetIds.forEach(id => this._watchMaterial(id));
    }

    private unwatchDependencies() {
        this.materialWatches.forEach((handle, id) => {
            const asset = editor.call('assets:get', id) as EditorAsset;
            if (asset && handle) {
                editor.call('assets:material:unwatch', asset, handle);
            }
        });
        this.materialWatches.clear();
    }

    private _watchMaterial(id: number) {
        const asset = editor.call('assets:get', id) as EditorAsset;
        if (!asset) {
            return;
        }
        this.materialWatches.set(id, editor.call('assets:material:watch', {
            asset: asset,
            loadMaterial: true,
            autoLoad: true,
            callback: this.handleQueueRender
        }));
    }

    render(rotationX = 0, rotationY = 0) {
        this.requestFrameId = null;

        // Save the rotation settings in case we need to queue it again
        this.rotationX = rotationX;
        this.rotationY = rotationY;

        if (!this.scene.isInitialized) {
            this.scene.once('loaded', this.handleQueueRender);
            return;
        }

        const layerComposition = super.layerComposition;
        const layer = super.layer as Layer;

        const width = this._canvas.width;
        const height = this._canvas.height;

        this.scene.enableScene();

        const renderTarget = this.getRenderTarget(this.app.graphicsDevice, width, height);

        const aabb = this.scene.aabb;

        // Camera settings specific to render settings
        this.scene.cameraEntity.camera.aspectRatio = width / height;
        this.scene.cameraEntity.camera.renderTarget = renderTarget;
        this.scene.cameraOrigin.setLocalEulerAngles(rotationX, rotationY, 0);

        // Set Camera Position based on AABB of the mesh instances
        const boundingRadius = aabb.halfExtents.length();

        // Default (vertical) FOV = 45 Degrees.
        // Radius/Distance = tan(FOV/2)
        // Distance = Radius/tan(22.5) = Radius * 2.414
        const cameraDistance = boundingRadius * 2.414 * 1.05;
        this.scene.cameraEntity.setLocalPosition(0, 0, cameraDistance);
        this.scene.cameraEntity.camera.farClip = cameraDistance * 2.0;

        this.scene.cameraOrigin.setLocalPosition(aabb.center);
        this.scene.cameraOrigin.syncHierarchy();

        this.scene.lightEntity.setLocalRotation(this.scene.cameraOrigin.getLocalRotation());
        this.scene.lightEntity.rotateLocal(90, 0, 0);

        this.scene.lightEntity.light.intensity = 1.0 / (Math.min(1.0, this.app.scene.exposure) || 0.01);

        this.scene.cameraEntity.camera.layers = [layer.id];

        // Finally add everything to the layer (composition)
        this.scene.sceneRoot.enabled = true;
        this.scene.sceneRoot.syncHierarchy();

        if (this.scene.meshInstances.length > 0) {
            layer.addMeshInstances(this.scene.meshInstances);
        }
        layer.addCamera(this.scene.cameraEntity.camera);
        layer.addLight(this.scene.lightEntity.light);

        // TODO: Neutralise scene settings, FOG, AmbientLight, etc.
        this.app.renderComposition(layerComposition);

        const device = this.app.graphicsDevice as WebglGraphicsDevice;
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, renderTarget.impl._glFrameBuffer);
        device.gl.readPixels(0, 0, width, height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, renderTarget.pixels);

        // Read the rendered data and write into the Canvas DOM element
        const ctx = this._canvas.getContext('2d');
        ctx.putImageData(new ImageData(renderTarget.pixelsClamped, width, height), (this._canvas.width - width) / 2, (this._canvas.height - height) / 2);

        // Cleanup after rendering into this Singleton layer shared across all ThumbnailRenderers
        layer.removeLight(this.scene.lightEntity.light);
        layer.removeCamera(this.scene.cameraEntity.camera);
        layer.removeMeshInstances(this.scene.meshInstances);

        this.scene.disableScene();
    }

    destroy() {
        if (this.requestFrameId !== null) {
            cancelAnimationFrame(this.requestFrameId);
            this.requestFrameId = 0;
        }

        this.scene.off('loaded', this.queueRender, this);

        this.unwatchDependencies();

        if (this.templateAsset && this.handleTemplateAssetLoad) {
            this.templateAsset.off('load', this.handleTemplateAssetLoad);
            this.templateAsset.off('change', this.handleTemplateAssetChange);
        }

        if (this.scene) {
            this.scene.destroy();
            this.scene = null;
        }

        this.templateAsset = null;
        this._canvas = null;
    }
}
