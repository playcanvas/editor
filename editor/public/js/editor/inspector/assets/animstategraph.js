Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ANIMSTATEGRAPH = 'asset-animstategraph-inspector';
    const CLASS_ANIMSTATEGRAPH_PARAMETER = CLASS_ANIMSTATEGRAPH + '-parameter';

    const DOM = (parent) => [
        {
            parametersPanel: new pcui.Panel({
                headerText: 'PARAMETERS',
                collapsible: true
            })
        },
        {
            layersContainer: new pcui.Container()
        }
    ];

    class AnimstategraphAssetInspector extends pcui.Container {
        constructor(args) {
            args = Object.assign({}, args);
            super(args);
            this._args = args;
            this._assets = null;
            this._panelCollapseStates = {};

            this.buildDom(DOM(this));
        }

        _refreshParameterList() {
            if (this._parametersPanel) {
                this._removeParameterList();
            }
            this._parametersPanel = new pcui.Panel({
                headerText: 'PARAMETERS',
                collapsible: true
            });

            this._addNewParameterButton = new pcui.Button({ text: 'PARAMETER', icon: 'E120' });
            this._addNewParameterButton.on('click', () => {
                this._addNewParameter();
            });
            this._parametersPanel.header.append(this._addNewParameterButton);
            const parameters = this._assets[0].get('data.parameters');
            for (const paramId in parameters) {
                const paramPanel = new pcui.Panel({
                    headerText: this._assets[0].get(`data.parameters.${paramId}.name`),
                    collapsible: true,
                    collapsed: this._panelCollapseStates[`${this._assets[0].get('id')}.${parameters[paramId].name}`],
                    removable: true,
                    class: CLASS_ANIMSTATEGRAPH_PARAMETER
                });
                paramPanel.on('click:remove', () => {
                    this._deleteParameter(paramId);
                });
                let valueType;
                switch (parameters[paramId].type) {
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
                            path: `data.parameters.${paramId}.name`,
                            type: 'string'
                        },
                        {
                            label: 'Type',
                            path: `data.parameters.${paramId}.type`,
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
                                precision: parameters[paramId].type === pc.ANIM_PARAMETER_INTEGER ? 0 : undefined
                            }
                        }
                    ]
                });
                const nameField = attributesInspector.getField(`data.parameters.${paramId}.name`);
                nameField.onValidate = (value) => {
                    const currParams = this._assets[0].get('data.parameters');
                    let nameExists = false;
                    for (const currParamId in currParams) {
                        if (currParams[currParamId].name === value) {
                            nameExists = true;
                        }
                    }
                    if (!nameExists) {
                        paramPanel.headerText = value;
                    }
                    return !nameExists;
                };
                attributesInspector.link(this._assets);
                paramPanel.append(attributesInspector);
                this._parametersPanel.content.append(paramPanel);
            }
            this.prepend(this._parametersPanel);
        }

        _deleteParameter(paramId) {
            const params = this._assets[0].get('data.parameters');
            delete params[paramId];
            this._assets[0].set('data.parameters', params);
        }

        _addNewParameter() {
            const params = this._assets[0].get('data.parameters');
            const maxKey = Math.max(...Object.keys(params));
            const key = Number.isFinite(maxKey) ? maxKey + 1 : 0;
            params[key] = {
                name: `New Parameter ${key}`,
                type: pc.ANIM_PARAMETER_INTEGER,
                value: 0.0
            };
            this._assets[0].set('data.parameters', params);
        }

        _addNewLayer() {
            const layers = this._assets[0].get('data.layers');
            const maxKey = Math.max(...Object.keys(layers));
            const key = Number.isFinite(maxKey) ? maxKey + 1 : 0;
            layers[key] = {
                name: `New Layer`,
                states: [0],
                transitions: []
            };
            this._assets[0].set('data.layers', layers);
        }

        _deleteLayer(id) {
            const layers = this._assets[0].get('data.layers');
            delete layers[id];
            this._assets[0].set('data.layers', layers);
        }

        _refreshLayerList() {
            if (this._layersPanel) {
                this._removeLayerList();
            }
            this._layersPanel = new pcui.Panel({
                headerText: 'LAYERS',
                collapsible: true
            });

            const addNewLayerButton = new pcui.Button({ text: 'LAYER', icon: 'E120' });
            addNewLayerButton.on('click', () => {
                this._addNewLayer();
            });
            this._layersPanel.header.append(addNewLayerButton);

            this.append(this._layersPanel);
            const layers = this._assets[0].get('data.layers');
            for (var layerId in layers) {
                const layer = layers[layerId];
                const layerPanel = new pcui.AnimstategraphLayer({
                    collapsible: true,
                    removable: Number(layerId) !== 0,
                    headerText: layer.name,
                    id: layerId,
                    assets: this._args.assets,
                    history: this._args.history
                });
                layerPanel.on('click:remove', () => {
                    this._deleteLayer(layerId);
                });
                this._layersPanel.append(layerPanel);
                layerPanel.link(this._assets);
            }
        }

        _removeParameterList() {
            this._parametersPanel.content.forEachChild(child => { this._panelCollapseStates[`${this._assets[0].get('id')}.${child.headerText}`] = child.collapsed; });
            this.remove(this._parametersPanel);
            delete this._parametersPanel;
        }


        _removeLayerList() {
            this.remove(this._layersPanel);
            delete this._layersPanel;
        }

        link(assets) {
            this.unlink();
            if (assets.length > 1) return;
            this._assets = assets;
            this._refreshParameterList();
            this._refreshLayerList();
            this._assets[0].on('*:set', (path) => {
                if (path.includes('data.parameters')) {
                    this._refreshParameterList();
                }
                if (path === 'data.layers') {
                    this._refreshLayerList();
                }
            });
        }

        unlink() {
            super.unlink();
            if (this._assets) {
                if (this._parametersPanel) {
                    this._removeParameterList();
                }
                if (this._layersPanel) {
                    this._removeLayerList();
                }
                this._assets = null;
            }
        }
    }

    return {
        AnimstategraphAssetInspector: AnimstategraphAssetInspector
    };
})());
