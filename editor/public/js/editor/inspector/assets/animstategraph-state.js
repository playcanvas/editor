Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ANIMSTATEGRAPH = 'asset-animstategraph-inspector';
    const CLASS_ANIMSTATEGRAPH_STATE = CLASS_ANIMSTATEGRAPH + '-state';
    const CLASS_ANIMSTATEGRAPH_STATE_TRANSITION = CLASS_ANIMSTATEGRAPH_STATE + '-transition';
    class AnimstategraphState extends pcui.Container {
        constructor(args, view) {
            super(args);
            this._args = args;
            this._view = view;
            this._assets = null;
            this._assetEvents = [];

            this._transitionsPanel = new pcui.Panel({
                headerText: 'TRANSITIONS',
                collapsible: true
            });
            this.append(this._transitionsPanel);

            this._linkedEntitiesPanel = new pcui.Panel({
                headerText: 'LINKED ENTITIES',
                collapsible: true,
                history: ''
            });
            this.append(this._linkedEntitiesPanel);
        }

        _loadTransitions() {
            const state = this._assets[0].get(this._path);
            this._transitionsPanel.clear();
            let hasTransitions = false;
            const data = this._assets[0].get('data');
            data.layers[this._layer].transitions.sort((a, b) => {
                const stateA = data.states[data.transitions[a].to];
                const stateB = data.states[data.transitions[b].to];
                if (!stateA || !stateB) return 1;
                return stateA.name > stateB.name ? 1 : -1;
            }).forEach(transitionId => {
                const transition = data.transitions[transitionId];
                if (transition.from !== state.id) return;
                hasTransitions = true;
                const toStateName = data.states[transition.to].name;
                const transitionLabel = new pcui.Label({
                    text: `${toStateName}`,
                    class: CLASS_ANIMSTATEGRAPH_STATE_TRANSITION,
                    ignoreParent: true
                });
                this._transitionsPanel.append(transitionLabel);
                this._assetEvents.push(transitionLabel.on('click', () => {
                    this._view.selectEdgeEvent(transition, transition.id);
                }));
            });
            this._transitionsPanel.hidden = !hasTransitions;
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
                attributes: attributes,
                enabled: !this._view.parent.readOnly
            });
            this.prepend(this._stateInspector);

            this._stateInspector.link(this._assets);

            this._stateInspector.getField(`${path}.name`).onValidate = value => {
                if (value === '') return false;
                const nameExists = this._assets[0].get(`data.layers.${this._layer}.states`)
                .filter(key => key !== state.id)
                .map(key => this._assets[0].get(`data.states.${key}.name`))
                .includes(value);
                return !nameExists;
            };

            this._loadTransitions();
            this._assetEvents.push(this._assets[0].on('*:set', (path) => {
                if (path.startsWith('data.transitions')) {
                    this._loadTransitions();
                }
            }));

            this._linkedEntitiesPanel.hidden = false;
            this.disabled = false;

            // disable editing for start, end and any states
            if (!enabled) {
                this.disabled = true;
                this._linkedEntitiesPanel.hidden = true;
                return;
            }

            this._linkedEntitiesList = [];
            this._linkedEntities = [];
            this._linkedEntityAssets = [];
            this._args.entities.forEach(entityObserver => {
                if (entityObserver.entity.anim && entityObserver.entity.anim.stateGraphAsset && entityObserver.entity.anim.stateGraphAsset === this._assets[0].get('id')) {
                    const entityPanel = new pcui.Panel({
                        class: CLASS_ANIMSTATEGRAPH_STATE,
                        headerText: entityObserver.entity.name,
                        collapsible: true
                    });
                    const viewEntityButton = new pcui.Button({ icon: 'E117' });
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
                        }),
                        enabled: !this._view.parent.readOnly
                    });
                    entityAnimationAsset.link([entityObserver], `components.anim.animationAssets.${layerName}:${state.name}.asset`);
                    entityPanel.content.append(entityAnimationAsset);

                    this._linkedEntities.push(entityObserver);
                    this._linkedEntityAssets.push(entityAnimationAsset);
                    this._linkedEntitiesList.push(entityPanel);
                    this._linkedEntitiesPanel.append(entityPanel);
                    this._linkedEntitiesPanel.hidden = false;
                }

                this._linkEntitiesEvent = this._assets[0].on(`${path}.name:set`, (value) => {
                    this._linkedEntities.forEach((entity, i) => {
                        this._linkedEntityAssets[i].link([entity], `components.anim.animationAssets.${layerName}:${value}.asset`);
                    });
                });
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
            if (this._linkEntitiesEvent) {
                this._linkEntitiesEvent.unbind();
                this._linkEntitiesEvent = null;
            }

            this._assetEvents.forEach(event => event.unbind());
            this._assetEvents.length = 0;

            this.parent.headerText = 'INSPECTOR';
            this._enabled = false;
        }
    }

    return {
        AnimstategraphState: AnimstategraphState
    };
})());
