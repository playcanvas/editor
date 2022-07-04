Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ANIMSTATEGRAPH = 'asset-animstategraph-inspector';
    const CLASS_ANIMSTATEGRAPH_PARAMETER = CLASS_ANIMSTATEGRAPH + '-parameter';

    class AnimstategraphParameters extends pcui.Panel {
        constructor(args) {
            args = Object.assign({}, args);
            super(args);
            this._args = args;
            this._assets = null;

            this._parameterPanels = {};

            this._addNewParameterButton = new pcui.Button({ text: 'PARAMETER', icon: 'E120' });
            this._addNewParameterButton.on('click', () => {
                this._addNewParameter();
            });
            this.header.append(this._addNewParameterButton);
        }

        _createParamAttributesInspector(paramId, param) {
            let valueType;
            switch (param.type) {
                case pc.ANIM_PARAMETER_BOOLEAN:
                case pc.ANIM_PARAMETER_TRIGGER:
                    valueType = 'boolean';
                    break;
                case pc.ANIM_PARAMETER_INTEGER:
                case pc.ANIM_PARAMETER_FLOAT:
                default:
                    valueType = 'number';
                    break;
            }
            const attributesInspector = new pcui.AttributesInspector({
                assets: this._args.assets,
                history: this._args.history,
                attributes: [
                    {
                        label: 'Name',
                        alias: `data.parameters.${paramId}.name`,
                        type: 'string'
                    },
                    {
                        label: 'Type',
                        alias: `data.parameters.${paramId}.type`,
                        type: 'select',
                        args: {
                            type: 'string',
                            options: [
                                {
                                    v: pc.ANIM_PARAMETER_INTEGER,
                                    t: 'Integer'
                                },
                                {
                                    v: pc.ANIM_PARAMETER_FLOAT,
                                    t: 'Float'
                                },
                                {
                                    v: pc.ANIM_PARAMETER_BOOLEAN,
                                    t: 'Boolean'
                                },
                                {
                                    v: pc.ANIM_PARAMETER_TRIGGER,
                                    t: 'Trigger'
                                }
                            ]
                        }
                    },
                    {
                        label: 'Default Value',
                        path: `data.parameters.${paramId}.value`,
                        type: valueType,
                        args: {
                            precision: param.type === pc.ANIM_PARAMETER_INTEGER ? 0 : undefined,
                            hideSlider: true
                        }
                    }
                ]
            });

            const paramTypeSelect = attributesInspector.getField(`data.parameters.${paramId}.type`);
            paramTypeSelect.value = this._assets[0].get(`data.parameters.${paramId}.type`);
            paramTypeSelect.on('change', (value) => {
                param = this._assets[0].get(`data.parameters.${paramId}`);
                if (param.type === value) return;

                const prevConditionValues = [];
                const prevConditionPredicates = [];
                let prevValue;

                const redo = () => {
                    const asset = this._assets[0].latest();
                    const historyEnabled = asset.history.enabled;
                    asset.history.enabled = false;

                    prevValue = asset.get(`data.parameters.${paramId}.type`);
                    asset.set(`data.parameters.${paramId}.type`, value);
                    Object.keys(asset.get(`data.transitions`)).forEach((transitionKey) => {
                        const transition = asset.get(`data.transitions.${transitionKey}`);
                        if (transition.conditions) {
                            Object.keys(transition.conditions).forEach((conditionKey) => {
                                const condition = transition.conditions[conditionKey];
                                if (condition.parameterName === asset.get(`data.parameters.${paramId}.name`)) {
                                    let updatedValue;
                                    switch (value) {
                                        case pc.ANIM_PARAMETER_INTEGER:
                                        case pc.ANIM_PARAMETER_FLOAT:
                                            updatedValue = 0;
                                            break;
                                        case pc.ANIM_PARAMETER_BOOLEAN:
                                        case pc.ANIM_PARAMETER_TRIGGER:
                                            updatedValue = true;
                                            prevConditionPredicates.push({
                                                transition: transitionKey,
                                                condition: conditionKey,
                                                value: asset.get(`data.transitions.${transitionKey}.conditions.${conditionKey}.predicate`)
                                            });
                                            asset.set(`data.transitions.${transitionKey}.conditions.${conditionKey}.predicate`, pc.ANIM_EQUAL_TO);
                                            break;
                                    }
                                    prevConditionValues.push({
                                        transition: transitionKey,
                                        condition: conditionKey,
                                        value: asset.get(`data.transitions.${transitionKey}.conditions.${conditionKey}.value`)
                                    });
                                    asset.set(`data.transitions.${transitionKey}.conditions.${conditionKey}.value`, updatedValue);
                                }
                            });
                        }
                    });

                    if ([pc.ANIM_PARAMETER_BOOLEAN, pc.ANIM_PARAMETER_TRIGGER].includes(value)) {
                        this._assets[0].set(`data.parameters.${paramId}.value`, !!param.value);
                    }

                    asset.history.enabled = historyEnabled;
                };

                const undo = () => {
                    const asset = this._assets[0].latest();
                    const historyEnabled = asset.history.enabled;
                    asset.history.enabled = false;

                    asset.set(`data.parameters.${paramId}.type`, prevValue);
                    prevConditionValues.forEach((prevConditionValue) => {
                        const transition = prevConditionValue.transition;
                        const condition = prevConditionValue.condition;
                        const value = prevConditionValue.value;
                        asset.set(`data.transitions.${transition}.conditions.${condition}.value`, value);
                    });
                    prevConditionPredicates.forEach((prevConditionPredicate) => {
                        const transition = prevConditionPredicate.transition;
                        const condition = prevConditionPredicate.condition;
                        const value = prevConditionPredicate.value;
                        asset.set(`data.transitions.${transition}.conditions.${condition}.predicate`, value);
                    });

                    if ([pc.ANIM_PARAMETER_BOOLEAN, pc.ANIM_PARAMETER_TRIGGER].includes(value)) {
                        this._assets[0].set(`data.parameters.${paramId}.value`, param.value);
                    }

                    asset.history.enabled = historyEnabled;
                };

                this._assets[0].history._history.add({
                    redo,
                    undo,
                    name: `update parameter ${param.name} type`
                });
                redo();
            });

            const nameField = attributesInspector.getField(`data.parameters.${paramId}.name`);
            nameField.value = this._assets[0].get(`data.parameters.${paramId}.name`);
            nameField.onValidate = (value) => {
                const currParams = this._assets[0].get('data.parameters');
                let nameExists = false;
                for (const currParamId in currParams) {
                    if (currParams[currParamId].name === value) {
                        nameExists = true;
                    }
                }
                if (!nameExists) {
                    this._parameterPanels[paramId].headerText = value;
                }
                return !nameExists;
            };

            nameField.on('change', (value) => {
                const prevName = this._assets[0].get(`data.parameters.${paramId}.name`);
                if (prevName === value) return;

                const conditionsWithName = [];

                const redo = () => {
                    const asset = this._assets[0].latest();
                    const historyEnabled = asset.history.enabled;
                    asset.history.enabled = false;

                    this._assets[0].set(`data.parameters.${paramId}.name`, value);
                    nameField.value = value;

                    Object.keys(asset.get(`data.transitions`)).forEach((transitionKey) => {
                        const transition = asset.get(`data.transitions.${transitionKey}`);
                        if (transition.conditions) {
                            Object.keys(transition.conditions).forEach((conditionKey) => {
                                const condition = transition.conditions[conditionKey];
                                if (condition.parameterName === prevName) {
                                    conditionsWithName.push({
                                        transition: transitionKey,
                                        condition: conditionKey
                                    });
                                    asset.set(`data.transitions.${transitionKey}.conditions.${conditionKey}.parameterName`, value);
                                }
                            });
                        }
                    });

                    asset.history.enabled = historyEnabled;
                };

                const undo = () => {
                    const asset = this._assets[0].latest();
                    const historyEnabled = asset.history.enabled;
                    asset.history.enabled = false;

                    this._assets[0].set(`data.parameters.${paramId}.name`, prevName);
                    nameField.value = prevName;

                    conditionsWithName.forEach((conditionWithName) => {
                        const transition = conditionWithName.transition;
                        const condition = conditionWithName.condition;
                        asset.set(`data.transitions.${transition}.conditions.${condition}.parameterName`, prevName);
                    });

                    asset.history.enabled = historyEnabled;
                };

                this._assets[0].history._history.add({
                    redo,
                    undo,
                    name: `update parameter ${value} name`
                });
                redo();
            });


            attributesInspector.link(this._assets);
            return attributesInspector;
        }

        _addParamPanel(paramId) {
            const param = this._assets[0].get(`data.parameters.${paramId}`);
            const paramPanel = new pcui.Panel({
                headerText: param.name,
                collapsible: true,
                removable: true,
                class: CLASS_ANIMSTATEGRAPH_PARAMETER
            });
            paramPanel.on('click:remove', () => {
                this._deleteParameter(paramId);
            });
            this._assets[0].once(`data.parameters.${paramId}:unset`, () => {
                if (this._parameterPanels[paramId]) {
                    this.content.remove(this._parameterPanels[paramId]);
                    delete this._parameterPanels[paramId];
                }
            });

            const attributesInspector = this._createParamAttributesInspector(paramId, param);

            paramPanel.append(attributesInspector);
            paramPanel._attributesInspector = attributesInspector;
            this.content.append(paramPanel);
            this._parameterPanels[paramId] = paramPanel;
        }

        _addParameterList() {
            this._removeParameterList();

            const parameters = this._assets[0].get('data.parameters');
            for (const paramId in parameters) {
                this._addParamPanel(paramId);
            }
        }

        _deleteParameter(paramId) {
            const param = this._assets[0].get(`data.parameters.${paramId}`);
            const conditions = {
            };
            const redo = () => {
                const asset = this._assets[0].latest();
                const historyEnabled = asset.history.enabled;
                asset.history.enabled = false;
                Object.keys(asset.get('data.transitions')).forEach((transitionKey) => {
                    const transition = asset.get(`data.transitions.${transitionKey}`);
                    if (transition.conditions) {
                        Object.keys(transition.conditions).forEach((conditionKey) => {
                            const condition = transition.conditions[conditionKey];
                            if (condition.parameterName === param.name) {
                                if (!conditions[transitionKey]) conditions[transitionKey] = {};
                                conditions[transitionKey][conditionKey] = condition;
                                asset.unset(`data.transitions.${transitionKey}.conditions.${conditionKey}.parameterName`);
                            }
                        });
                    }
                });
                if (asset.get(`data.parameters.${paramId}`)) {
                    asset.unset(`data.parameters.${paramId}`);
                }
                asset.history.enabled = historyEnabled;
            };
            const undo = () => {
                const asset = this._assets[0].latest();
                const historyEnabled = this._assets[0].history.enabled;
                asset.history.enabled = false;
                Object.keys(asset.get('data.transitions')).forEach((transitionKey) => {
                    if (conditions[transitionKey]) {
                        Object.keys(conditions[transitionKey]).forEach((conditionKey) => {
                            asset.set(`data.transitions.${transitionKey}.conditions.${conditionKey}`, conditions[transitionKey][conditionKey]);
                        });
                    }
                });
                asset.set(`data.parameters.${paramId}`, param);
                asset.history.enabled = historyEnabled;
            };

            this._assets[0].history._history.add({
                redo,
                undo,
                name: `delete parameter ${param.name}`
            });
            redo();
        }

        _addNewParameter() {
            const params = this._assets[0].get('data.parameters');
            const maxKey = Math.max(...Object.keys(params));
            const key = Number.isFinite(maxKey) ? maxKey + 1 : 0;
            this._suppressAddParamEvent = true;
            this._assets[0].set(`data.parameters.${key}`, {
                name: `New Parameter ${key}`,
                type: pc.ANIM_PARAMETER_INTEGER,
                value: 0.0
            });
            this._suppressAddParamEvent = false;
            this._addParamPanel(key);
            this.collapsed = false;
        }

        _removeParameterList() {
            Object.keys(this._parameterPanels).forEach((panelKey) => {
                this.content.remove(this._parameterPanels[panelKey]);
            });
            this._parameterPanels = {};
        }

        link(assets) {
            this.unlink();

            this._assets = assets;

            this._addParameterList();

            this._assetEvents = [];
            this._assetEvents.push(
                this._assets[0].on('*:set', (path, value) => {
                    if (this._suppressAddParamEvent) return;
                    const pathArr = path.split('.');
                    if (path.includes('data.parameters.') && pathArr.length === 3 && !this._parameterPanels[pathArr[2]]) {
                        this._addParamPanel(pathArr[2]);
                    } else if (path.includes('data.parameters.') && path.includes('.name') && pathArr.length === 4 && this._parameterPanels[pathArr[2]]) {
                        this._parameterPanels[pathArr[2]].headerText = value;
                    } else if (path.includes('data.parameters.') && path.includes('.type') && pathArr.length === 4 && this._parameterPanels[pathArr[2]]) {
                        const paramPanel = this._parameterPanels[pathArr[2]];
                        paramPanel.remove(paramPanel._attributesInspector);
                        paramPanel._attributesInspector = this._createParamAttributesInspector(pathArr[2], this._assets[0].get(`data.parameters.${pathArr[2]}`));
                        paramPanel.append(paramPanel._attributesInspector);
                    }
                })
            );
        }

        unlink() {
            super.unlink();
            if (this._assets) {
                this._removeParameterList();
                this._assets = null;
                if (this._assetEvents) {
                    this._assetEvents.forEach(evt => evt.unbind());
                    this._assetEvents = [];
                }
            }
        }
    }

    return {
        AnimstategraphParameters: AnimstategraphParameters
    };
})());
