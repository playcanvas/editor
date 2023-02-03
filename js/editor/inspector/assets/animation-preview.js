import { Panel } from '@playcanvas/pcui';

Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-asset-animation-inspector-preview';

    class AnimationAssetInspectorPreview extends pcui.AssetInspectorPreviewBase {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'META';
            args.class = CLASS_ROOT;
            args.ignoreParent = true;

            super(args);

            setTimeout(() => {
                this._app = editor.call('viewport:app');
                this._animViewer = new pcui.AnimViewer({
                    app: this._app,
                    class: 'animstategraph-view-anim-viewer'
                });
                this.prepend(this._animViewer);

                this._controlsContainer = new Panel({
                    headerText: 'PREVIEW OPTIONS'
                });
                const layoutAttributes = editor.call('layout.attributes');
                layoutAttributes.on('resize', () => {
                    this._animViewer._canvas.width = layoutAttributes.dom.offsetWidth - 8;
                });
                this.append(this._controlsContainer);

                const ATTRIBUTES = [
                    {
                        label: 'Show Skeleton',
                        alias: 'showSkeleton',
                        type: 'boolean',
                        args: {
                            value: true
                        }
                    },
                    {
                        label: 'Show Model',
                        alias: 'showModel',
                        type: 'boolean',
                        args: {
                            value: true
                        }
                    },
                    {
                        label: 'Preview Asset',
                        alias: 'previewAsset',
                        type: 'asset',
                        args: {
                            assetType: ['template', 'model'],
                            allowDragDrop: false,
                            assets: editor.call('assets:raw'),
                            validateAssetFn: (asset) => {
                                return asset.get('type') === 'model' || asset.get('type') === 'template';
                            }
                        }
                    }
                ];
                this._attributesInspector = new pcui.AttributesInspector({
                    history: args.history,
                    attributes: ATTRIBUTES
                });
                this._controlsContainer.append(this._attributesInspector);

                this._attributesInspector.getField('previewAsset').on('change', (value) => {
                    if (Number.isFinite(value)) {
                        sessionStorage.setItem(`animation-asset-${this._asset.get('id')}-model-id`, value);
                        const asset = this._app.assets.get(value);
                        if (asset.type === 'model') {
                            this.loadWithModel(asset);
                        } else if (asset.type === 'template') {
                            this.loadWithTemplate(asset);
                        }
                    } else {
                        this._animViewer.displayMessage('Select a template / model to preview this animation.');
                    }
                });
                this._attributesInspector.getField('showSkeleton').on('change', (value) => {
                    this._animViewer.showSkeleton = value;
                });

                this._attributesInspector.getField('showModel').on('change', (value) => {
                    this._animViewer.showModel = value;
                });

                this._endPreviewPanel = new Panel({
                    headerText: 'ANIMATION'
                });
                this.append(this._endPreviewPanel);
            }, 50);
        }

        createAssetPromise(asset) {
            return new Promise((resolve) => {
                if (asset.loaded) {
                    resolve(true);
                    return;
                }
                asset.once('load', () => {
                    resolve(true);
                });
                this._app.assets.load(asset);
            });
        }

        loadWithModel(modelAsset) {
            const entity = new pc.Entity('entity');
            entity.addComponent('model', {
                type: 'asset'
            });
            Promise.all([this._animTrackAsset, modelAsset].map((asset) => {
                return this.createAssetPromise(asset);
            })).then(() => {
                entity.model.asset = modelAsset.id;
                this._animViewer.loadView(this._animTrackAsset.resource, entity);
            });
        }

        loadWithTemplate(templateAsset) {
            Promise.all([this._animTrackAsset, templateAsset].map((asset) => {
                return this.createAssetPromise(asset);
            })).then(() => {
                this._animViewer.loadView(this._animTrackAsset.resource, templateAsset.resource.instantiate());
            });
        }

        loadWithEntity(entity) {
            Promise.all([this._animTrackAsset].map((asset) => {
                return this.createAssetPromise(asset);
            })).then(() => {
                this._animViewer.loadView(this._animTrackAsset.resource, entity.clone());
            });
        }

        link(assets) {
            this.unlink();
            this._asset = assets[0];
            const animTrackAsset = this._app.assets.get(this._asset.get('id'));
            this._animTrackAsset = animTrackAsset;

            this._attributesInspector.getField('showSkeleton').value = true;
            this._attributesInspector.getField('showModel').value = true;

            const sessionEntityId = sessionStorage.getItem(`animation-preview-entity-id`);
            sessionStorage.removeItem(`animation-preview-entity-id`);
            const entity = editor.entities.get(sessionEntityId);
            if (entity) {
                const rootBoneEntity = editor.entities.get(entity.get('components.anim.rootBone'));
                if (rootBoneEntity) {
                    this.loadWithEntity(rootBoneEntity._observer.entity);
                } else {
                    this.loadWithEntity(entity._observer.entity);
                }
                return;
            }

            const sessionAssetId = sessionStorage.getItem(`animation-asset-${this._asset.get('id')}-model-id`);
            if (sessionAssetId) {
                this._attributesInspector.getField('previewAsset').value = null;
                this._attributesInspector.getField('previewAsset').value = Number(sessionAssetId);
                return;
            }


            const sourceAssetId = this._asset.get('source_asset_id');
            const modelAssetObserver = editor.assets.findOne(a => a.get('source_asset_id') === sourceAssetId && a.get('type') === 'model');
            const containerAssetObserver = editor.assets.findOne(a => a.get('source_asset_id') === sourceAssetId && a.get('type') === 'container');
            let templateAssetObserver;
            if (containerAssetObserver) templateAssetObserver = editor.assets.findOne(a => a.get('meta.containerAsset') === containerAssetObserver.get('id') && a.get('type') === 'template');

            if (modelAssetObserver) {
                this._attributesInspector.getField('previewAsset').value = null;
                this._attributesInspector.getField('previewAsset').value = modelAssetObserver.get('id');
            } else if (templateAssetObserver) {
                this._attributesInspector.getField('previewAsset').value = null;
                this._attributesInspector.getField('previewAsset').value = templateAssetObserver.get('id');
            } else {
                this._attributesInspector.getField('previewAsset').value = null;
                this._animViewer.displayMessage('Select a template / model to preview this animation.');
            }
        }

        unlink() {
            super.unlink();
            this._animTrackAsset = null;
            this._asset = null;
        }
    }

    return {
        AnimationAssetInspectorPreview: AnimationAssetInspectorPreview
    };
})());
