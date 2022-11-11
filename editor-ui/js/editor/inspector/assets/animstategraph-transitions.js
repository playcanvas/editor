Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ANIMSTATEGRAPH = 'asset-animstategraph-inspector';
    const CLASS_ANIMSTATEGRAPH_TRANSITION = CLASS_ANIMSTATEGRAPH + '-transition';
    const CLASS_ANIMSTATEGRAPH_TRANSITIONS = CLASS_ANIMSTATEGRAPH + '-transitions';

    // This helper function moves the the position of an item in the given array from the supplied old_index position to the new_index position.
    // Used by the AnimstategraphTransitions class to update the transitions order when the _onDragEnd event is fired.
    function arrayMove(arr, old_index, new_index) {
        if (new_index >= arr.length) {
            let k = new_index - arr.length + 1;
            while (k--) {
                arr.push(undefined);
            }
        }
        arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
        return arr;
    }

    class TransitionInspector extends pcui.AttributesInspector {
        unlink() {
            Object.keys(this._fields).forEach((k) => {
                this._fields[k].blur();
            });
            super.unlink();
        }
    }

    class AnimstategraphTransitions extends pcui.Container {
        constructor(args, view) {
            super({
                args: Object.assign({}, args),
                class: CLASS_ANIMSTATEGRAPH_TRANSITIONS,
                enabled: !view.parent.readOnly
            });
            this._view = view;
            this._args = args;
            this._assets = null;

            this._newTransitionButton = new pcui.Button({
                text: 'NEW TRANSITION',
                icon: 'E120'
            });
            this._newTransitionButton.on('click', () => {
                if (this._assets === null) return;
                const data = this._assets[0].get('data');
                const transitionId = Number(`${Date.now()}${Math.floor(Math.random() * 10000)}`);
                data.transitions[transitionId] = {
                    from: this._edgeData.from,
                    to: this._edgeData.to,
                    edgeType: 1,
                    exitTime: 1,
                    conditions: {}
                };
                data.layers[this._selectedLayer].transitions.push(transitionId);
                this._assets[0].set('data', data);
                this.link(this._assets, this._selectedLayer, data.transitions[transitionId]);
            });
            this.append(this._newTransitionButton);

            this._transitionsContainer = new pcui.Container();
            this.append(this._transitionsContainer);
            this._transitionsContainer.on('child:dragend', this._onDragEnd.bind(this));
        }

        _onDragEnd(_, newIndex, oldIndex) {
            let transitions = this._assets[0].get(`data.layers.${this._selectedLayer}.transitions`).filter((transitionId) => {
                const transition = this._assets[0].get(`data.transitions.${transitionId}`);
                return this._edge === `${transition.from}-${transition.to}`;
            }).map((transitionId) => {
                const transition = this._assets[0].get(`data.transitions.${transitionId}`);
                return {
                    transition,
                    id: transitionId
                };
            });
            transitions.sort((a, b) => {
                return a.transition.priority - b.transition.priority;
            });
            transitions = arrayMove(transitions, oldIndex, newIndex);
            const data = this._assets[0].get(`data`);
            transitions = transitions.forEach((item, i) => {
                data.transitions[item.id] = Object.assign(item.transition, { priority: i });
            });
            this._transitionsContainer.forEachChild((child, i) => {
                child.headerText = i + 1;
            });
            this._assets[0].set('data', data);
        }

        _deleteCondition(transitionId, conditionId) {
            const conditions = this._assets[0].get(`data.transitions.${transitionId}.conditions`);
            delete conditions[conditionId];
            this._assets[0].set(`data.transitions.${transitionId}.conditions`, conditions);
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

        link(assets, layer, edge) {
            this.unlink();
            this._assets = assets;
            this._selectedLayer = layer;
            this._edge = `${edge.from}-${edge.to}`;
            this._edgeData = edge;

            let transitions = this._assets[0].get(`data.layers.${layer}.transitions`);
            if (!Array.isArray(transitions)) return;

            transitions = transitions.map((transitionId) => {
                const transition = this._assets[0].get(`data.transitions.${transitionId}`);
                return {
                    transitionId,
                    transition
                };
            });
            transitions = transitions.filter((item) => {
                return !(edge.from !== item.transition.from || edge.to !== item.transition.to);
            });
            transitions.sort((a, b) => {
                return a.transition.priority - b.transition.priority;
            });

            transitions.forEach((item, i) => {
                const { transition, transitionId } = item;
                let parameters = this._assets[0].get(`data.parameters`);
                parameters = Object.keys(parameters).map((key) => { return parameters[key].name; });

                const baseAttributes = [
                    {
                        label: 'Duration',
                        path: `data.transitions.${transitionId}.time`,
                        reference: 'asset:anim:transition:time',
                        type: 'number',
                        args: {
                            allowNull: true,
                            hideSlider: true
                        }
                    },
                    {
                        label: 'Offset',
                        path: `data.transitions.${transitionId}.transitionOffset`,
                        reference: 'asset:anim:transition:transitionOffset',
                        type: 'slider',
                        args: {
                            min: 0,
                            max: 1
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
                        type: 'divider'
                    },
                    {
                        label: 'Exit Time',
                        path: `data.transitions.${transitionId}.exitTime`,
                        reference: 'asset:anim:transition:exitTime',
                        type: 'number',
                        args: {
                            allowNull: true,
                            hideSlider: true
                        }
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

                const transitionPanel = new pcui.Panel({
                    headerText: edge.from === 0 ? 'Default Transition' : i + 1,
                    class: CLASS_ANIMSTATEGRAPH_TRANSITION,
                    collapsible: true,
                    removable: !transition.defaultTransition,
                    sortable: true
                });
                transitionPanel.disabled = transition.defaultTransition;

                transitionPanel.on('click:remove', () => {
                    this._view._onDeleteEdge({ edgeId: transitionId });
                    if (this._assets) {
                        this.link(this._assets, layer, edge);
                    }
                });

                const transitionInspector = new TransitionInspector({
                    assets: this._args.assets,
                    history: this._args.history,
                    attributes: baseAttributes
                });

                transitionInspector.link(this._assets);
                transitionPanel.append(transitionInspector);
                transitionPanel.inspector = transitionInspector;
                const conditions = transitionInspector.getField('conditions');
                if (conditions) {
                    conditions.on('click', () => {
                        this._addNewCondition(transitionId);
                    });
                }
                this._transitionsContainer.append(transitionPanel);
                if (!this._transitionPanels) this._transitionPanels = [];
                this._transitionPanels.push(transitionPanel);

                transitionPanel.conditions = new pcui.Container();
                Object.keys(transition.conditions).forEach((conditionId) => {
                    const condition = new pcui.AnimstategraphCondition({
                        parameters: parameters,
                        onDelete: () => {
                            this._deleteCondition(transitionId, conditionId);
                        }
                    });
                    condition.link(this._assets, `data.transitions.${transitionId}.conditions.${conditionId}`);
                    transitionPanel.conditions.append(condition);
                });

                if (Object.keys(transition.conditions).length > 0) {
                    transitionPanel.append(transitionPanel.conditions);
                }

                const addConditions = () => {
                    if (!this._assets) return;
                    parameters = this._assets[0].get(`data.parameters`);
                    parameters = Object.keys(parameters).map((key) => { return parameters[key].name; });
                    const transition = this._assets[0].get(`data.transitions.${transitionId}`);
                    if (transitionPanel.conditions) {
                        transitionPanel.remove(transitionPanel.conditions);
                    }
                    transitionPanel.conditions = new pcui.Container();
                    Object.keys(transition.conditions).forEach((conditionId) => {
                        const condition = new pcui.AnimstategraphCondition({
                            parameters: parameters,
                            onDelete: () => {
                                this._deleteCondition(transitionId, conditionId);
                            }
                        });
                        condition.link(this._assets, `data.transitions.${transitionId}.conditions.${conditionId}`);
                        transitionPanel.conditions.append(condition);
                    });
                    if (Object.keys(transition.conditions).length > 0) {
                        transitionPanel.append(transitionPanel.conditions);
                    }
                };

                this._onAssetUpdateEvent = this._assets[0].on('*:set', (path) => {
                    if (!path || path.includes('parameters') || path.includes(`transitions.${transitionId}`) && transition.conditions) {
                        addConditions(path);
                    }
                });

                this._onParamDeleteEvent = assets[0].on('*:unset', (path, value) => {
                    if (path.match(/data.parameters.[0-9]*$/)) {
                        addConditions();
                    }
                });

            });
            this._newTransitionButton.hidden = edge.defaultTransition;
            this.parent.headerText = 'TRANSITION';
        }

        unlink() {
            super.unlink();
            if (this._assets) {
                this._assets = null;
                if (this._transitionPanels) {
                    this._transitionPanels.forEach((transitionPanel) => {
                        transitionPanel.inspector.unlink();
                        this._transitionsContainer.remove(transitionPanel);
                    });
                }
                delete this._transitionPanels;
            }
            if (this._onAssetUpdateEvent) {
                this._onAssetUpdateEvent.unbind();
                this._onAssetUpdateEvent = null;
            }
            if (this._onParamDeleteEvent) {
                this._onParamDeleteEvent.unbind();
                this._onParamDeleteEvent = null;
            }
            this._newTransitionButton.hidden = true;
            this.parent.headerText = 'INSPECTOR';
        }
    }

    return {
        AnimstategraphTransitions: AnimstategraphTransitions
    };
})());
