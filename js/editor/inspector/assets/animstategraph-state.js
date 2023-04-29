import { Panel, Label, Button, BindingTwoWay } from '@playcanvas/pcui';
import { AttributesInspector } from '../attributes.js';

Object.assign(pcui, (function () {
    const CLASS_ANIMSTATEGRAPH = 'asset-animstategraph-inspector';
    const CLASS_ANIMSTATEGRAPH_STATE = CLASS_ANIMSTATEGRAPH + '-state';
    const CLASS_ANIMSTATEGRAPH_STATE_VIEW_BUTTON = CLASS_ANIMSTATEGRAPH_STATE + '-view-button';
    const CLASS_ANIMSTATEGRAPH_STATE_TRANSITION = CLASS_ANIMSTATEGRAPH_STATE + '-transition';
    class AnimstategraphState extends Panel {
        constructor(args, view) {
            args.headerText = 'STATE';
            super(args);
            this._args = args;
            this._view = view;
            this._assets = null;
            this._evts = [];
            this._suppressOnNameChange = false;

            this._transitionsPanel = new Panel({
                headerText: 'TRANSITIONS',
                collapsible: true
            });
            this.append(this._transitionsPanel);

            this._linkedEntitiesPanel = new Panel({
                headerText: 'LINKED ENTITIES',
                collapsible: true,
                history: ''
            });
            this.append(this._linkedEntitiesPanel);
        }

        _previewEntity(entityObserver) {
            const animationAssetId = entityObserver.get(`components.anim.animationAssets.${this._layerName}:${this._stateName}.asset`);
            if (animationAssetId) {
                const animationAsset = pc.app.assets.get(animationAssetId).resource;
                const rootBoneEntity = editor.entities.get(entityObserver.get('components.anim.rootBone'));
                if (rootBoneEntity) {
                    this._view._parent._animViewer.loadView(animationAsset, rootBoneEntity._observer.entity.clone());
                } else {
                    this._view._parent._animViewer.loadView(animationAsset, entityObserver.entity.clone());
                }
            } else {
                this._view._parent._animViewer.displayMessage('No animation asset assigned to the selected entity.');
            }
        }

        _loadTransitions() {
            const state = this._assets[0].get(this._path);
            if (!state) return;
            this._transitionsPanel.clear();
            let hasTransitions = false;
            const data = this._assets[0].get('data');
            data.layers[this._layer].transitions.sort((a, b) => {
                const stateA = data.states[data.transitions[a].to];
                const stateB = data.states[data.transitions[b].to];
                if (!stateA || !stateB) return 1;
                return stateA.name > stateB.name ? 1 : -1;
            }).forEach((transitionId) => {
                const transition = data.transitions[transitionId];
                if (transition.from !== state.id || transition.to === undefined) return;
                hasTransitions = true;
                const toStateName = data.states[transition.to].name;
                const transitionLabel = new Label({
                    text: `${toStateName}`,
                    class: CLASS_ANIMSTATEGRAPH_STATE_TRANSITION,
                    ignoreParent: true
                });
                this._transitionsPanel.append(transitionLabel);
                this._evts.push(transitionLabel.on('click', () => {
                    this._view.selectEdgeEvent(transition, transition.id);
                }));
            });
            this._transitionsPanel.hidden = !hasTransitions;
        }

        static validateStateName(stateId, value, asset) {
            if (!value.match('^[A-Za-z0-9 ]*$')) return false;
            if (value === '') return false;
            let nameExists = false;
            const layers = asset.get(`data.layers`);
            Object.keys(layers).forEach((layerKey) => {
                const layer = layers[layerKey];
                layer.states.forEach((layerStateId) => {
                    if (layerStateId === stateId) {
                        const nameInLayer = layer.states
                        .filter(key => key !== stateId)
                        .map(key => asset.get(`data.states.${key}.name`))
                        .includes(value);
                        if (nameInLayer) {
                            nameExists = true;
                        }
                    }
                });
            });
            return !nameExists;
        }

        static updateAnimationAssetName(observer, layerName, prevState, newState) {
            AnimstategraphState.createAnimationAsset(observer, layerName, prevState);
            const historyEnabled = observer.history.enabled;
            observer.history.enabled = false;
            const prevAsset = observer.get(`components.anim.animationAssets.${layerName}:${prevState}`);
            observer.unset(`components.anim.animationAssets.${layerName}:${prevState}`);
            observer.set(`components.anim.animationAssets.${layerName}:${newState}`, prevAsset);
            observer.history.enabled = historyEnabled;
        }

        static createAnimationAsset(observer, layerName, stateName) {
            if (!observer.get(`components.anim.animationAssets.${layerName}:${stateName}`)) {
                const historyEnabled = observer.history.enabled;
                observer.history.enabled = false;
                observer.set(`components.anim.animationAssets.${layerName}:${stateName}`, {
                    asset: null
                });
                observer.history.enabled = historyEnabled;
            }
        }

        link(assets, layer, path) {
            this.unlink();
            this.parent.headerText = 'STATE';

            this._assets = assets;
            this._layer = layer;
            this._path = path;

            const layerName = this._assets[0].get(`data.layers.${layer}.name`);
            this._layerName = layerName;
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
                    alias: `${path}.name`,
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
            this._stateInspector = new AttributesInspector({
                assets: this._args.assets,
                history: this._args.history,
                attributes: attributes,
                enabled: !this._view.parent.readOnly
            });
            this.prepend(this._stateInspector);

            this._stateInspector.link(this._assets);

            this._stateInspector.getField(`${path}.name`).onValidate = (value) => {
                return AnimstategraphState.validateStateName(state.id, value, this._assets[0]);
            };

            this._loadTransitions();
            this._evts.push(this._assets[0].on('*:set', (assetPath, value) => {
                if (assetPath.startsWith('data.transitions')) {
                    this._loadTransitions();
                }
                if (assetPath === `${path}.name`) {
                    this._suppressOnNameChange = true;
                    this._stateInspector.getField(`${path}.name`).value = value;
                    this._suppressOnNameChange = false;
                    this._stateName = value;
                }
            }));

            this._linkedEntitiesPanel.hidden = false;
            this.disabled = false;
            this.header.hidden = false;

            // disable editing for start, end and any states
            if (!enabled) {
                this.disabled = true;
                this._linkedEntitiesPanel.hidden = true;
                this.header.hidden = true;
                return;
            }

            this._linkedEntitiesList = [];
            this._linkedEntities = [];
            this._linkedEntityAssets = [];

            this._args.entities.forEach((entityObserver) => {

                if (entityObserver.get('components.anim.stateGraphAsset') === this._assets[0].get('id')) {
                    const entityPanel = new Panel({
                        class: CLASS_ANIMSTATEGRAPH_STATE,
                        headerText: entityObserver.entity.name,
                        collapsible: true
                    });
                    const viewEntityButton = new Button({
                        icon: 'E117',
                        class: CLASS_ANIMSTATEGRAPH_STATE_VIEW_BUTTON
                    });
                    entityPanel.header.append(viewEntityButton);
                    viewEntityButton.on('click', () => {
                        if (this._view._selectedEntity !== entityObserver) {
                            this._view._selectedEntity = entityObserver;
                            if (this._view._selectedEntityViewButton) {
                                this._view._selectedEntityViewButton.class.remove('active');
                            }
                            this._view._selectedEntityViewButton = viewEntityButton;
                            viewEntityButton.class.add('active');
                            this._previewEntity(entityObserver);
                        }
                    });
                    const openEntityButton = new Button({
                        icon: 'E188',
                        class: CLASS_ANIMSTATEGRAPH_STATE_VIEW_BUTTON
                    });
                    entityPanel.header.append(openEntityButton);
                    openEntityButton.on('click', () => {
                        editor.call('selector:add', 'entity', entityObserver);
                    });
                    const entityAnimationAsset = new pcui.AssetInput({
                        assets: this._args.assets,
                        assetType: 'animation',
                        allowDragDrop: true,
                        binding: new BindingTwoWay({
                            history: this._args.history
                        }),
                        enabled: !this._view.parent.readOnly
                    });
                    entityAnimationAsset.link([entityObserver], `components.anim.animationAssets.${layerName}:${state.name}.asset`);
                    entityPanel.content.append(entityAnimationAsset);

                    AnimstategraphState.createAnimationAsset(entityObserver, layerName, state.name);

                    this._linkedEntities.push(entityObserver);
                    this._linkedEntityAssets.push(entityAnimationAsset);
                    this._linkedEntitiesList.push(entityPanel);
                    this._linkedEntitiesPanel.append(entityPanel);
                    this._linkedEntitiesPanel.hidden = false;

                    if (!this._view._selectedEntity) {
                        this._view._selectedEntity = entityObserver;
                        this._view._selectedEntityViewButton = viewEntityButton;
                        viewEntityButton.class.add('active');
                    } else if (this._view._selectedEntity.get('resource_id') === entityObserver.get('resource_id')) {
                        this._view._selectedEntityViewButton = viewEntityButton;
                        viewEntityButton.class.add('active');
                    }
                }

                this._linkEntitiesEvent = this._assets[0].on(`${path}.name:set`, (value) => {
                    this._linkedEntities.forEach((entity, i) => {
                        this._linkedEntityAssets[i].link([entity], `components.anim.animationAssets.${layerName}:${value}.asset`);
                    });
                });

                this._evts.push(entityObserver.on(`*:set`, (p) => {
                    if (entityObserver === this._view._selectedEntity && p === `components.anim.animationAssets.${this._layerName}:${this._stateName}.asset`) {
                        this._previewEntity(entityObserver);
                    }
                }));

                if (this._linkedEntities.length === 0) {
                    this._view._parent._animViewer.displayMessage('Add this anim state graph to an entity\'s anim component to preview it here.');
                }
            });

            this._stateInspector.getField(`${path}.name`).on('change', (value) => {
                const prevName = this._stateName;
                const newName = value;
                if (prevName === newName || this._suppressOnNameChange) return;
                const action = {
                    redo: () => {
                        this._linkedEntities.forEach((entityObserver) => {
                            AnimstategraphState.updateAnimationAssetName(entityObserver, this._layerName, prevName, newName);
                        });
                        const historyEnabled = this._assets[0].history.enabled;
                        this._assets[0].history.enabled = false;
                        this._assets[0].set(`data.states.${state.id}.name`, newName);
                        this._assets[0].history.enabled = historyEnabled;
                        this._stateName = newName;
                    },
                    undo: () => {
                        this._linkedEntities.forEach((entityObserver) => {
                            AnimstategraphState.updateAnimationAssetName(entityObserver, this._layerName, newName, prevName);
                        });
                        const historyEnabled = this._assets[0].history.enabled;
                        this._assets[0].history.enabled = false;
                        this._assets[0].set(`data.states.${state.id}.name`, prevName);
                        this._assets[0].history.enabled = historyEnabled;
                        this._stateName = prevName;
                    },
                    name: 'update name'
                };
                this._view.parent.history.add(action);
                action.redo();
            });
            this._stateInspector.getField(`${path}.name`).value = this._stateName;

            this._view._parent._animViewer.hidden = false;
            if (this._view._selectedEntity) {
                this._previewEntity(this._view._selectedEntity);
            }
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
                this._linkedEntitiesList.forEach((panel) => {
                    this._linkedEntitiesPanel.remove(panel);
                });
                this._linkedEntitiesList = [];
                this._linkedEntitiesPanel.hidden = true;
            }
            if (this._linkEntitiesEvent) {
                this._linkEntitiesEvent.unbind();
                this._linkEntitiesEvent = null;
            }

            this._evts.forEach(e => e.unbind());
            this._evts.length = 0;

            this.parent.headerText = 'INSPECTOR';
            this._enabled = false;

            this._view._parent._animViewer.hidden = true;
            this._view._selectedEntityViewButton = null;
        }
    }

    return {
        AnimstategraphState: AnimstategraphState
    };
})());
