Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ANIMSTATEGRAPH = 'asset-animstategraph-inspector';
    const CLASS_ANIMSTATEGRAPH_STATE = CLASS_ANIMSTATEGRAPH + '-state';
    class AnimstategraphState extends pcui.Container {
        constructor(args, view) {
            super(args);
            this._args = args;
            this._view = view;
            this._assets = null;

            this._linkedEntitiesPanel = new pcui.Panel({
                headerText: 'LINKED ENTITIES',
                collapsible: true,
                history: ''
            });
            this.append(this._linkedEntitiesPanel);
        }

        link(assets, layer, path) {
            this.unlink();
            this.parent.headerText = 'STATE';

            this._assets = assets;
            this._layer = layer;
            this._path = path;

            const layerName = this._assets[0].get(`data.layers.${layer}.name`);
            const state = this._assets[0].get(path);
            if (!state) return;
            this._stateName = state.name;
            const enabled = ![
                this._view.ANIM_SCHEMA.NODE.START_STATE,
                this._view.ANIM_SCHEMA.NODE.ANY_STATE,
                this._view.ANIM_SCHEMA.NODE.END_STATE
            ].includes(state.nodeType);

            this._enabled = enabled;

            const attributes = [
                {
                    label: 'Name',
                    path: `${path}.name`,
                    type: 'string',
                    args: {
                        renderChanges: false
                    }
                }
            ];
            if (enabled) {
                attributes.push({
                    label: 'Speed',
                    path: `${path}.speed`,
                    type: 'number'
                });
                attributes.push({
                    label: 'Loop',
                    path: `${path}.loop`,
                    type: 'boolean'
                });
            }
            this._stateInspector = new pcui.AttributesInspector({
                assets: this._args.assets,
                history: this._args.history,
                attributes: attributes
            });
            this.prepend(this._stateInspector);

            this._stateInspector.link(this._assets);

            this._linkedEntitiesPanel.hidden = false;
            this.disabled = false;

            // disable editing for start, end and any states
            if (!enabled) {
                this.disabled = true;
                this._linkedEntitiesPanel.hidden = true;
                return;
            }

            this._linkedEntitiesList = [];
            this._args.entities.forEach(entityObserver => {
                if (entityObserver.entity.anim && entityObserver.entity.anim.stateGraphAsset && entityObserver.entity.anim.stateGraphAsset === this._assets[0].get('id')) {
                    const entityPanel = new pcui.Panel({
                        class: CLASS_ANIMSTATEGRAPH_STATE,
                        headerText: entityObserver.entity.name,
                        collapsible: true
                    });
                    const viewEntityButton = new pcui.Button({icon: 'E117'});
                    entityPanel.header.append(viewEntityButton);
                    viewEntityButton.on('click', () => {
                        editor.call('selector:add', 'entity', entityObserver);
                    });
                    const entityAnimationAsset = new pcui.AssetInput({
                        assets: this._args.assets,
                        assetType: 'animation',
                        allowDragDrop: true,
                        binding: new pcui.BindingTwoWay({
                            history: this._args.history
                        })
                    });
                    entityAnimationAsset.link([entityObserver], `components.anim.animationAssets.${layerName}:${state.name}.asset`);
                    entityPanel.content.append(entityAnimationAsset);

                    this._linkedEntitiesList.push(entityPanel);
                    this._linkedEntitiesPanel.append(entityPanel);
                    this._linkedEntitiesPanel.hidden = false;
                }
            });
        }

        unlink() {
            super.unlink();
            if (this._assets) {
                this._assets = null;
                this.remove(this._stateInspector);
                if (this._stateInspector) {
                    this._stateInspector.unlink();
                }
            }
            if (this._linkedEntitiesList) {
                this._linkedEntitiesList.forEach(panel => {
                    this._linkedEntitiesPanel.remove(panel);
                });
                this._linkedEntitiesList = [];
                this._linkedEntitiesPanel.hidden = true;
            }

            this.parent.headerText = 'INSPECTOR';
            this._enabled = false;
        }
    }

    return {
        AnimstategraphState: AnimstategraphState
    };
})());
