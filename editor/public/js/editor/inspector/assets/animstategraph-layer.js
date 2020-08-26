Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ANIMSTATEGRAPH = 'asset-animstategraph-inspector';
    const CLASS_ANIMSTATEGRAPH_CONTAINER = CLASS_ANIMSTATEGRAPH + '-container';
    const CLASS_ANIMSTATEGRAPH_LAYER = CLASS_ANIMSTATEGRAPH + '-layer';
    const CLASS_ANIMSTATEGRAPH_STATE = CLASS_ANIMSTATEGRAPH + '-state';
    const CLASS_ANIMSTATEGRAPH_TRANSITION = CLASS_ANIMSTATEGRAPH + '-transition';

    const DOM = (parent) => [
        {
            nameInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [
                    {
                        label: 'Name',
                        path: `data.layers.${parent._args.id}.name`,
                        type: 'string'
                    }
                ]
            }),
            statesContainer: new pcui.Container(),
            transitionsContainer: new pcui.Container(),
        }
    ];

    class AnimstategraphLayer extends pcui.Panel {
        constructor(args) {
            args = Object.assign({
                class: CLASS_ANIMSTATEGRAPH_LAYER,
            }, args);
            super(args);
            this._args = args;
            this._assets = null;
            this._panelCollapseStates = {};

            this.buildDom(DOM(this));
        }

        _refreshStatesList(path) {
            if (!this._statesContainer) {
                this._statesContainer = new pcui.Panel({
                    headerText: 'STATES',
                    collapsible: true,
                    class: CLASS_ANIMSTATEGRAPH_CONTAINER,
                });
                this._statesContainer.content.class.add(CLASS_ANIMSTATEGRAPH_CONTAINER);
                const addNewStateButton = new pcui.Button({text: 'STATE', icon: 'E120'});
                addNewStateButton.on('click', () => {
                    this._addNewState();
                });
                this._statesContainer.header.append(addNewStateButton);
                this.appendAfter(this._statesContainer, this._nameInspector);
                this._statePanels = {};
            }
            const states = this._assets[0].get(`data.layers.${this._args.id}.states`);
            states.forEach((stateId) => {
                const state = this._assets[0].get(`data.states.${stateId}`);
                if (!state) return;
                const enabled = !['START', 'END'].includes(state.name);

                if (!this._statePanels[stateId]) {
                    this._statePanels[stateId] = new pcui.Panel({
                        headerText: state.name,
                        collapsible: true,
                        removable: enabled && !state.defaultState,
                        enabled: enabled,
                        class: CLASS_ANIMSTATEGRAPH_STATE
                    });
                    this._statePanels[stateId].on('click:remove', () => {
                        this._deleteState(stateId);
                    })
                    const attributes = [
                        {
                            label: 'Name',
                            path: `data.states.${stateId}.name`,
                            type: 'string',
                            args: {
                                renderChanges: false
                            }
                        }
                    ];
                    if (enabled) {
                        attributes.push({
                            label: 'Speed',
                            path: `data.states.${stateId}.speed`,
                            type: 'number'
                        });
                        attributes.push({
                            label: 'Loop',
                            path: `data.states.${stateId}.loop`,
                            type: 'boolean'
                        });
                    }
                    const stateInspector = new pcui.AttributesInspector({
                        assets: this._args.assets,
                        history: this._args.history,
                        attributes: attributes
                    });

                    this._statePanels[stateId].append(stateInspector);
                    stateInspector.link(this._assets);
                    this._statesContainer.append(this._statePanels[stateId]);
                }
                
                if (path && path.includes(`states.${stateId}`)) {
                    this._statePanels[stateId].headerText = state.name;
                }
            });
        }

        _refreshTransitionsList(path) {
            if (!this._transitionPanelsContainer) {
                this._transitionPanelsContainer = new pcui.Panel({
                    headerText: 'TRANSITIONS',
                    collapsible: true,
                    class: CLASS_ANIMSTATEGRAPH_CONTAINER,
                });
                this._transitionPanelsContainer.content.class.add(CLASS_ANIMSTATEGRAPH_CONTAINER);
                const addNewTransitionButton = new pcui.Button({text: 'TRANSITION', icon: 'E120'});
                addNewTransitionButton.on('click', () => {
                    this._addNewTransition();
                });
                this._transitionPanelsContainer.header.append(addNewTransitionButton);
                this.append(this._transitionPanelsContainer);
                this._transitionPanels = {};
            }

            const states = this._assets[0].get('data.states');
            const transitions = this._assets[0].get(`data.layers.${this._args.id}.transitions`);

            let options = this._assets[0].get(`data.layers.${this._args.id}.states`).map(stateId => {
                const state = this._assets[0].get(`data.states.${stateId}`);
                if (!state) return;
                return {v: Number(stateId), t: state.name };
            });
            options = options.filter(o => !!o);

            transitions.forEach((transitionId) => {
                const transition = this._assets[0].get(`data.transitions.${transitionId}`);
                if (!transition) return;
                const from = states[transition.from] ? states[transition.from].name : '';
                const to = states[transition.to] ? states[transition.to].name : '';
                let parameters = this._assets[0].get(`data.parameters`);
                parameters = Object.keys(parameters).map(key => {return parameters[key].name;});

                if (!this._transitionPanels[transitionId]) {
                    this._transitionPanels[transitionId] = new pcui.Panel({
                        headerText: `${from} > ${to}`,
                        collapsible: true,
                        removable: Number(transitionId) !== 0,
                        class: CLASS_ANIMSTATEGRAPH_TRANSITION,
                        enabled: Number(transitionId) !==  0
                    });
                    this._transitionPanels[transitionId].on('click:remove', () => {
                        this._deleteTransition(transitionId);
                    });
                    const baseAttributes = [
                        {
                            label: 'Source',
                            path: `data.transitions.${transitionId}.from`,
                            reference: 'asset:anim:transition:from',
                            type: 'select',
                            args: {
                                type: 'number',
                                options: options
                            }
                        },
                        {
                            label: 'Destination',
                            path: `data.transitions.${transitionId}.to`,
                            reference: 'asset:anim:transition:to',
                            type: 'select',
                            args: {
                                type: 'number',
                                options: options
                            }
                        },
                        {
                            type: 'divider'
                        },
                        {
                            label: 'Duration',
                            path: `data.transitions.${transitionId}.time`,
                            reference: 'asset:anim:transition:time',
                            type: 'number',
                            args: {
                                allowNull: true
                            }
                        },
                        {
                            label: 'Exit Time',
                            path: `data.transitions.${transitionId}.exitTime`,
                            reference: 'asset:anim:transition:exitTime',
                            type: 'number',
                            args: {
                                allowNull: true
                            }
                        },
                        {
                            label: 'Offset',
                            path: `data.transitions.${transitionId}.transitionOffset`,
                            reference: 'asset:anim:transition:transitionOffset',
                            type: 'number',
                            args: {
                                allowNull: true
                            }
                        },
                        {
                            label: 'Interruption Source',
                            path: `data.transitions.${transitionId}.interruptionSource`,
                            reference: 'asset:anim:transition:interruptionSource',
                            type: 'select',
                            args: {
                                type: 'string',
                                options: [
                                    {
                                        v: ANIM_INTERRUPTION_NONE,
                                        t: 'None'
                                    },
                                    {
                                        v: ANIM_INTERRUPTION_NEXT,
                                        t: 'Next'
                                    },
                                    {
                                        v: ANIM_INTERRUPTION_PREV,
                                        t: 'Prev'
                                    },
                                    {
                                        v: ANIM_INTERRUPTION_NEXT_PREV,
                                        t: 'Next then Prev' 
                                    },
                                    {
                                        v: ANIM_INTERRUPTION_PREV_NEXT,
                                        t: 'Prev then Next'
                                    }
                                ]
                            }
                        },
                        {
                            label: 'Priority',
                            path: `data.transitions.${transitionId}.priority`,
                            reference: 'asset:anim:transition:priority',
                            type: 'number',
                            args: {
                                allowNull: true
                            }
                        },
                        {
                            type: 'divider'
                        },
                        {
                            label: 'Conditions',
                            alias: 'conditions',
                            reference: 'asset:anim:transition:conditions',
                            type: 'button',
                            args: {
                                text: 'New Condition'
                            }
                        }
                    ];
                    this._transitionPanels[transitionId]._transitionInspector = new pcui.AttributesInspector({
                        assets: this._args.assets,
                        history: this._args.history,
                        attributes: baseAttributes
                    });
                    this._transitionPanels[transitionId]._transitionInspector.link(this._assets);
                    const conditions = this._transitionPanels[transitionId]._transitionInspector.getField('conditions');
                    if (conditions) {
                        conditions.on('click', () => {
                            this._addNewCondition(transitionId);
                        });
                    }
                    this._transitionPanels[transitionId].append(this._transitionPanels[transitionId]._transitionInspector);
                    this._transitionPanelsContainer.append(this._transitionPanels[transitionId]);
                } else {
                    this._transitionPanels[transitionId].headerText = `${from} > ${to}`;
                }
                if (!path || path.includes('parameters') || path.includes(`transitions.${transitionId}`) && transition.conditions) {
                    if (this._transitionPanels[transitionId]._conditionsContainer) {
                        this._transitionPanels[transitionId].remove(this._transitionPanels[transitionId]._conditionsContainer);
                    }
                    this._transitionPanels[transitionId]._conditionsContainer = new pcui.Container();
                    Object.keys(transition.conditions).forEach((conditionId) => {
                        const condition = new pcui.AnimstategraphCondition({
                            parameters: parameters,
                            onDelete: () => {
                                this._deleteCondition(transitionId, conditionId);
                            }
                        });
                        condition.link(this._assets, `data.transitions.${transitionId}.conditions.${conditionId}`);
                        this._transitionPanels[transitionId]._conditionsContainer.append(condition);
                    });
                    if (Object.keys(transition.conditions).length > 0) {
                        this._transitionPanels[transitionId].append(this._transitionPanels[transitionId]._conditionsContainer);
                    }
                }
                if (path && path.includes('states') && path.includes('name')) {
                    const fromField = this._transitionPanels[transitionId]._transitionInspector.getField(`data.transitions.${transitionId}.from`);
                    if (fromField) {
                        fromField.options = options;
                    }
                    const toField = this._transitionPanels[transitionId]._transitionInspector.getField(`data.transitions.${transitionId}.to`);
                    if (toField) {
                        toField.options = options;
                    }
                }
            });
        }

        _deleteState(id) {
            delete this._statePanels[id];
            const data = this._assets[0].get('data');
            delete data.states[id];
            const layerStates = data.layers[this._args.id].states;
            for (let i = 0; i < layerStates.length; i++) {
                if (layerStates[i] === id) {
                    layerStates.splice(i, 1);
                    break;
                }
            }
            data.layers[this._args.id].states = layerStates;

            const layerTransitions = data.layers[this._args.id].transitions;
            const startStateId = this._assets[0].get(`data.layers.${this._args.id}.states.0`);
            for (let i = layerTransitions.length -1; i >= 0; i--) {
                const transitionId = layerTransitions[i];
                const transition = data.transitions[transitionId];
                if (transition.to === id) {
                    data.transitions[transitionId].to = startStateId;
                }
                if (transition.from === id) {
                    data.transitions[transitionId].from = startStateId;
                }
            }
            this._assets[0].set('data', data);
        }

        _deleteTransition(id) {
            delete this._transitionPanels[id];
            const data = this._assets[0].get('data');
            const transition = data.transitions[id];
            for (let i = 0; i < transition.conditions.length; i++) {
                delete data.conditions[transition.conditions[i]];
            }
            delete data.transitions[id];
            const layerTransitions = data.layers[this._args.id].transitions;
            for (let i = 0; i < layerTransitions.length; i++) {
                if (layerTransitions[i] === id) {
                    layerTransitions.splice(i, 1);
                    break;
                }
            }
            data.layers[this._args.id].transitions = layerTransitions;
            this._assets[0].set('data', data);
        }

        _deleteCondition(transitionId, conditionId) {
            const conditions = this._assets[0].get(`data.transitions.${transitionId}.conditions`);
            delete conditions[conditionId];
            this._assets[0].set(`data.transitions.${transitionId}.conditions`, conditions);
        }

        _addNewState() {
            const states = this._assets[0].get('data.states');
            const layerStates = this._assets[0].get(`data.layers.${this._args.id}.states`);
            const maxKey = Math.max(...Object.keys(states));
            const key = Number.isFinite(maxKey) ? maxKey + 1 : 0;
            states[key] = {
                name: 'New State',
                speed: 1.0,
                loop: true
            };
            layerStates.push(key);
            const data = this._assets[0].get('data');
            data.states = states;
            data.layers[this._args.id].states = layerStates;
            this._assets[0].set('data', data);
        }

        _addNewTransition() {
            const transitions = this._assets[0].get('data.transitions');
            const layerTransitions = this._assets[0].get(`data.layers.${this._args.id}.transitions`);
            const startStateId = this._assets[0].get(`data.layers.${this._args.id}.states.0`);
            const maxKey = Math.max(...Object.keys(transitions));
            const key = Number.isFinite(maxKey) ? maxKey + 1 : 0;
            transitions[key] = {
                from: startStateId,
                to: startStateId,
                priority: 0,
                interruptionSource: ANIM_INTERRUPTION_NONE,
                transitionOffset: 0,
                time: 0,
                conditions: {}
            };
            layerTransitions.push(key);
            const data = this._assets[0].get('data');
            data.transitions = transitions;
            data.layers[this._args.id].transitions = layerTransitions;
            this._assets[0].set('data', data);
        }

        _addNewCondition(transitionId) {
            const conditions = this._assets[0].get(`data.transitions.${transitionId}.conditions`);
            const maxKey = Math.max(...Object.keys(conditions));
            const key = Number.isFinite(maxKey) ? maxKey + 1 : 0;
            conditions[key] = {
                parameterName: null,
                predicate: ANIM_EQUAL_TO,
                value: 0.0
            };
            this._assets[0].set(`data.transitions.${transitionId}.conditions`, conditions);
        }

        link(assets) {
            this.unlink();
            this._assets = assets;
            this._nameInspector.link(assets);
            this._refreshStatesList();
            this._refreshTransitionsList();
            this._assets[0].on('*:set', (path) => {
                this._refreshStatesList(path);
                this._refreshTransitionsList(path);
            });
        }

        unlink() {
            super.unlink();
            if (this._assets) {
                this._assets = null;
                this._nameInspector.unlink();
            }
        }
    }

    return {
        AnimstategraphLayer: AnimstategraphLayer
    };
})());
