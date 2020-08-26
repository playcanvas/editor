Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = [
        {
            label: 'Activate',
            path:  'components.anim.activate',
            type: 'boolean'
        },
        {
            label: 'Speed',
            path: 'components.anim.speed',
            type: 'slider',
            args: {
                precision: 3,
                step: 0.1,
                sliderMin: 0,
                sliderMax: 2
            }
        },
        {
            type: 'divider',
        },
        {
            label: 'State Graph',
            path: 'components.anim.stateGraphAsset',
            type: 'asset',
            args: {
                assetType: 'animstategraph'
            }
        }
    ];

    ATTRIBUTES.forEach(attr => {
        if (!attr.path || attr.alias) return;
        const parts = attr.path ? attr.path.split('.') : attr.alias.split('.');
        attr.reference = `anim:${parts[parts.length - 1]}`;
    });

    const CLASS_ROOT = 'anim-component';
    const CLASS_LAYER = CLASS_ROOT + '-layer';
    const CLASS_STATE = CLASS_ROOT + '-state';

    class AnimComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'anim';

            super(args);

            this._args = args;
            this._assets = args.assets;

            this._stateGraphAssetId = null;
            this._stateGraphAsset = null;
            this._entities = null;

            this._attributesInspector = new pcui.AttributesInspector({
                assets: args.assets,
                history: args.history,
                attributes: ATTRIBUTES,
                templateOverridesInspector: this._templateOverridesInspector
            });
            this.append(this._attributesInspector);
        }

        _addAnimationAssetSlots() {
            if (this._layersContainer) {
                this.remove(this._layersContainer);
            }
            if (!this._entities) return;

            const stateGraph = this._assets.get(this._stateGraphAssetId);
            if (!stateGraph) return;
            const layers = stateGraph.get('data.layers');
            this._layersContainer = new pcui.Container();
            for (var layerId in layers) {
                const layer = layers[layerId];
                const layerPanel = new pcui.Panel({
                    headerText: `Layer: ${layer.name}`,
                    class: CLASS_LAYER,
                    collapsible: true
                });
                const layerPlayAll = new pcui.Button({
                    text: 'PLAY ALL',
                    icon: 'E131'
                });
                layerPanel.header.append(layerPlayAll);
                layer.states.forEach(stateId => {
                    const state = stateGraph.get(`data.states.${stateId}`);
                    if (!state) return;
                    if (!['START', 'END'].includes(state.name)) {
                        if (!this._entities[0].get(`components.anim.animationAssets.${layer.name}:${state.name}`)) {
                            const prevHistoryEnabled = this._entities[0].history.enabled;
                            this._entities[0].history.enabled = false;
                            this._entities[0].set(`components.anim.animationAssets.${layer.name}:${state.name}`, {
                                asset: null
                            });
                            this._entities[0].history.enabled = prevHistoryEnabled;
                        }
                        const stateAsset = new pcui.AssetInput({
                            text: state.name,
                            assetType: 'animation',
                            assets: this._assets,
                            binding: new pcui.BindingTwoWay({
                                history: this._args.history
                            })
                        });
                        const statePanel = new pcui.Panel({
                            collapsible: true,
                            class: CLASS_STATE,
                            headerText: state.name
                        });
                        const statePlay = new pcui.Button({
                            icon: 'E131'
                        });
                        statePanel.header.append(statePlay);
                        statePanel.content.append(stateAsset);
                        stateAsset.link(this._entities, `components.anim.animationAssets.${layer.name}:${state.name}.asset`);
                        layerPanel.append(statePanel);
                    }
                });
                this._layersContainer.append(layerPanel);
            };
            this.append(this._layersContainer);

        }

        link(entities) {
            super.link(entities);
            this._entities = entities;

            this._attributesInspector.link(entities);
            const stateGraphField = this._attributesInspector.getField('components.anim.stateGraphAsset');
            stateGraphField.on('change', value => {
                if (!value) {
                    const prevHistoryEnabled = this._entities[0].history.enabled;
                    this._entities[0].history.enabled = false;
                    this._entities[0].set('components.anim.animationAssets', {});
                    this._entities[0].history.enabled = prevHistoryEnabled;
                }
            });

            this._stateGraphAssetId = this._entities[0].get('components.anim.stateGraphAsset');
            if (this._stateGraphAssetId) {
                this._stateGraphAsset = this._args.assets.get(this._stateGraphAssetId);
                this._stateGraphAsset.on('*:set', (path) => {
                    this._addAnimationAssetSlots();
                });
                this._addAnimationAssetSlots();
            }
            this._entities[0].on('components.anim.stateGraphAsset:set', () => {
                this._stateGraphAssetId = this._entities[0].get('components.anim.stateGraphAsset');
                this._addAnimationAssetSlots();
            })
        }

        unlink() {
            super.unlink();
            if (this._entities) {
                this._entities = null;
                this._stateGraphAssetId = null;
                this._stateGraphAsset = null;
                if (this._layersContainer) {
                    this.remove(this._layersContainer);
                }
                this._attributesInspector.unlink();
            }
        }
    }

    return {
        AnimComponentInspector: AnimComponentInspector
    };
})());
