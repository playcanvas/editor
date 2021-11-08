Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ANIMSTATEGRAPH = 'asset-animstategraph-inspector';
    const CLASS_ANIMSTATEGRAPH_LAYER = CLASS_ANIMSTATEGRAPH + '-layer';
    const CLASS_ANIMSTATEGRAPH_LAYER_SELECT = CLASS_ANIMSTATEGRAPH_LAYER + '-select';

    const ANIM_SCHEMA = {
        NODE: {
            STATE: 0,
            DEFAULT_STATE: 1,
            START_STATE: 3,
            ANY_STATE: 4,
            END_STATE: 5
        },
        EDGE: {
            TRANSITION_DEFAULT: 0,
            TRANSITION: 1,
            TRANSITION_FROM_ANY: 3
        }
    };

    class AnimstategraphLayers extends pcui.Panel {
        constructor(parent, args) {
            args = Object.assign({ enabled: !parent.readOnly }, args);
            super(args);
            this._parent = parent;
            this._args = args;
            this._assets = null;
            this._assetEvents = [];

            this._addNewLayerButton = new pcui.Button({ text: 'LAYER', icon: 'E120' });
            this._addNewLayerButton.on('click', () => {
                this._addNewLayer();
            });
            this.header.append(this._addNewLayerButton);

            this._layerSelectInputValue = "";
            this._layerSelect = new pcui.SelectInput({
                class: CLASS_ANIMSTATEGRAPH_LAYER_SELECT,
                type: 'number'
            });
            this._layerSelect.on('change', (value) => {
                if (this._suppressLayerSelectChange) return;
                const prevLayer = this._parent._view._selectedLayer;
                const newLayer = value;
                const redo = () => {
                    this._suppressLayerSelectChange = true;
                    this._layerSelect.value = newLayer;
                    this._suppressLayerSelectChange = false;
                    this._parent._view.link(this._assets, newLayer);
                    if (this._parent._stateContainer) this._parent._stateContainer.unlink();
                    if (this._parent._transitionContainer) this._parent._transitionContainer.unlink();
                };
                const undo = () => {
                    this._suppressLayerSelectChange = true;
                    this._layerSelect.value = prevLayer;
                    this._suppressLayerSelectChange = false;
                    this._parent._view.link(this._assets, prevLayer);
                    if (this._parent._stateContainer) this._parent._stateContainer.unlink();
                    if (this._parent._transitionContainer) this._parent._transitionContainer.unlink();
                };
                this.parent.history.add({
                    name: 'select layer',
                    redo,
                    undo
                });
                redo();
            });
        }

        _addNewLayer(name) {

            const data = this._assets[0].get('data');
            const prevData = Object.assign({}, data);
            const prevLayer = this._layerSelect.value;

            const stateId = Number(`${Date.now()}${Math.floor(Math.random() * 10000)}`);
            const newState = {
                name: 'Initial State',
                id: stateId,
                speed: 1.0,
                loop: true,
                posX: 400,
                posY: 50,
                nodeType: 1
            };
            data.states[stateId] = newState;

            const startStateId = Number(`${Date.now()}${Math.floor(Math.random() * 10000)}`);
            const startState = {
                name: 'START',
                id: startStateId,
                posX: 50,
                posY: 100,
                nodeType: 3
            };
            data.states[startStateId] = startState;

            const anyStateId = Number(`${Date.now()}${Math.floor(Math.random() * 10000)}`);
            const anyState = {
                name: 'ANY',
                id: anyStateId,
                posX: 50,
                posY: 150,
                nodeType: 4
            };
            data.states[anyStateId] = anyState;

            const endStateId = Number(`${Date.now()}${Math.floor(Math.random() * 10000)}`);
            const endState = {
                name: 'END',
                id: endStateId,
                posX: 50,
                posY: 200,
                nodeType: 5
            };
            data.states[endStateId] = endState;

            const transitionId = Number(`${Date.now()}${Math.floor(Math.random() * 10000)}`);
            const newTransition = {
                from: startStateId,
                to: stateId,
                defaultTransition: true,
                edgeType: 1,
                conditions: {}
            };
            data.transitions[transitionId] = newTransition;


            const layers = this._assets[0].get('data.layers');
            const maxKey = Math.max(...Object.keys(layers));
            const key = Number.isFinite(maxKey) ? maxKey + 1 : 0;
            layers[key] = {
                name: name || `New Layer`,
                states: [startStateId, anyStateId, endStateId, stateId],
                transitions: [transitionId],
                blendType: 'OVERWRITE',
                weight: 1
            };
            data.layers = layers;

            const redo = () => {
                this._assets[0].history.enabled = false;
                this._assets[0].set('data', data);
                this._parent._view.link(this._assets, key);
                this._updateLayerSelect(true);
                this._assets[0].history.enabled = true;
            };
            const undo = () => {
                this._assets[0].history.enabled = false;
                this._assets[0].set('data', prevData);
                this._parent._view.link(this._assets, prevLayer);
                this._updateLayerSelect(true);
                this._assets[0].history.enabled = true;
            };
            this.parent.history.add({
                name: 'add layer',
                redo,
                undo
            });
            redo();
            this.collapsed = false;
        }

        _deleteLayer(layerId) {
            const layers = this._assets[0].get('data.layers');
            const prevLayers = Object.assign({}, layers);
            const viewingDeletedLayer = this._parent._view._selectedLayer === Number(layerId);
            delete layers[layerId];

            const redo = () => {
                this._assets[0].history.enabled = false;
                this._assets[0].set('data.layers', layers);
                if (viewingDeletedLayer) {
                    this._parent._view.link(this._assets, 0);
                    this._updateLayerSelect(true);
                }
                this._assets[0].history.enabled = true;
            };
            const undo = () => {
                this._assets[0].history.enabled = false;
                this._assets[0].set('data.layers', prevLayers);
                if (viewingDeletedLayer) {
                    this._parent._view.link(this._assets, layerId);
                    this._updateLayerSelect(true);
                }
                this._assets[0].history.enabled = true;
            };
            this.parent.history.add({
                name: 'delete layer',
                redo,
                undo
            });
            redo();
        }

        _updateLayerSelect(ignoreHistory) {
            const layers = this._assets[0].get('data.layers');
            this._layerSelect.options = Object.keys(layers).map((layerKey) => {
                return {
                    v: layerKey,
                    t: layers[layerKey].name
                };
            });
            this._suppressLayerSelectChange = ignoreHistory;
            this._layerSelect.value = this._parent._view._selectedLayer;
            this._suppressLayerSelectChange = false;
        }

        _updateDefaultStateSelect(defaultStateSelect, layerKey) {
            const states = this._assets[0].get(`data.layers.${layerKey}.states`);
            if (!states) return;
            defaultStateSelect.options = states.map(stateKey => {
                const state = this._assets[0].get(`data.states`)[stateKey];
                if (!state) return {};
                if (state.nodeType === ANIM_SCHEMA.NODE.DEFAULT_STATE) {
                    defaultStateSelect.value = stateKey;
                }
                return {
                    v: stateKey,
                    t: state.name,
                    nodeType: state.nodeType
                };
            }).filter(option => {
                return option.nodeType === ANIM_SCHEMA.NODE.STATE || option.nodeType === ANIM_SCHEMA.NODE.DEFAULT_STATE;
            });
        }

        link(assets) {
            this.unlink();
            this._assets = assets;

            this._updateLayerSelect();

            const layers = this._assets[0].get('data.layers');
            this._layerPanels = [];

            Object.keys(this._assets[0].get('data.layers')).forEach((layerKey, i) => {
                const layer = layers[layerKey];
                const layerPanel = new pcui.Panel({
                    class: CLASS_ANIMSTATEGRAPH_LAYER,
                    collapsible: true,
                    headerText: layer.name,
                    removable: i > 0
                });

                layerPanel.on('click:remove', () => {
                    this._deleteLayer(layerKey);
                });

                const attributesInspector = new pcui.AttributesInspector({
                    assets: this._args.assets,
                    history: this._args.history,
                    attributes: [
                        {
                            label: 'Name',
                            path: `data.layers.${layerKey}.name`,
                            type: 'string'
                        },
                        {
                            label: 'Default State',
                            alias: 'defaultState',
                            type: 'select',
                            args: {
                                type: 'string',
                                options: []
                            }
                        },
                        {
                            label: 'Blend Type',
                            path: `data.layers.${layerKey}.blendType`,
                            type: 'select',
                            args: {
                                type: 'string',
                                options: [
                                    {
                                        v: 'OVERWRITE',
                                        t: 'Overwrite'
                                    },
                                    {
                                        v: 'ADDITIVE',
                                        t: 'Additive'
                                    }
                                ]
                            }
                        },
                        {
                            label: 'Blend Weight',
                            path: `data.layers.${layerKey}.weight`,
                            type: 'slider',
                            args: {
                                min: 0,
                                max: 1
                            }
                        }
                    ]
                });

                attributesInspector.getField(`data.layers.${layerKey}.name`).enabled = i > 0;

                this._assetEvents = [];
                this._assetEvents.push(
                    this._assets[0].on('*:set', (path, value) => {
                        if (path === `data.layers.${layerKey}.name`) {
                            layerPanel.headerText = value;
                            this._updateLayerSelect(true);
                        }
                    })
                );

                this._updateDefaultStateSelect(attributesInspector.getField('defaultState'), layerKey);
                const stateNamePathRegex = /^data\.states\.[0-9]*\.name$/;
                this._assetEvents.push(
                    this._assets[0].on(`*:set`, (path) => {
                        if (path.match(stateNamePathRegex) || path === `data.layers.${layerKey}.states`) {
                            this._updateDefaultStateSelect(attributesInspector.getField('defaultState'), layerKey);
                        }
                    })
                );
                attributesInspector.getField('defaultState').on('change', (value) => {
                    const data = this._assets[0].get('data');
                    data.layers[layerKey].states.forEach(stateKey => {
                        if (data.states[stateKey] && data.states[stateKey].nodeType === ANIM_SCHEMA.NODE.DEFAULT_STATE) {
                            data.states[stateKey].nodeType = ANIM_SCHEMA.NODE.STATE;
                        }
                    });
                    data.states[value].nodeType = ANIM_SCHEMA.NODE.DEFAULT_STATE;
                    data.layers[layerKey].transitions.forEach(transitionKey => {
                        const transition = data.transitions[transitionKey];
                        if (transition && transition.defaultTransition) {
                            transition.to = Number(value);
                        }
                    });
                    this._assets[0].set('data', data);
                });

                attributesInspector.link(this._assets);
                layerPanel.append(attributesInspector);

                this.append(layerPanel);
                this._layerPanels.push(layerPanel);
            });

            document.getElementById('layout-viewport').prepend(this._layerSelect.dom);
        }

        unlink() {
            super.unlink();
            if (this._layerPanels) {
                this._layerPanels.forEach(layerPanel => {
                    this.remove(layerPanel);
                });
                this._layerPanels = [];
            }
            if (this._assetEvents) {
                this._assetEvents.forEach(evt => evt.unbind());
                this._assetEvents = [];
            }
            try {
                document.getElementById('layout-viewport').removeChild(this._layerSelect.dom);
            } catch (e) {
            }
        }
    }

    return {
        AnimstategraphLayers: AnimstategraphLayers
    };
})());
