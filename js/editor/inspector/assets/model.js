Object.assign(pcui, (function () {
    const CLASS_ROOT = 'asset-model-inspector';
    const CLASS_AUTO_UNWRAP_PROGRESS = CLASS_ROOT + '-auto-unwrap-progress';
    const CLASS_AUTO_UNWRAP_PADDING = CLASS_ROOT + '-auto-unwrap-padding';

    const META_ATTRIBUTES = [
        {
            label: 'Vertices',
            alias: 'vertices',
            path: 'meta.vertices',
            type: 'label'
        },
        {
            label: 'Triangles',
            path: 'meta.triangles',
            type: 'label'
        },
        {
            label: 'Meshes',
            path: 'meta.meshes',
            type: 'label'
        },
        {
            label: 'Mesh Instances',
            path: 'meta.meshInstances',
            type: 'label'
        },
        {
            label: 'Nodes',
            path: 'meta.nodes',
            type: 'label'
        },
        {
            label: 'Skins',
            path: 'meta.skins',
            type: 'label'
        },
        {
            label: 'Attributes',
            path: 'meta.attributes',
            type: 'label'
        }
    ];

    const PIPELINE_ATTRIBUTES = [
        {
            label: 'UV1',
            path: 'meta.attributes.texCoord1',
            type: 'label'
        }
    ];

    const UNWRAP_ATTRIBUTES = [
        {
            label: 'Padding',
            alias: 'padding',
            type: 'number',
            args: {
                value: 2,
                precision: 2
            }
        },
        {
            label: 'Unwrapping',
            type: 'progress',
            alias: 'progress'
        }
    ];

    const DOM = parent => [
        {
            root: {
                metaPanel: new pcui.Panel({
                    headerText: 'META',
                    collapsible: true
                })
            },
            children: [
                {
                    metaAttributesInspector: new pcui.AttributesInspector({
                        assets: parent._args.assets,
                        history: parent._args.history,
                        attributes: META_ATTRIBUTES
                    })
                }
            ]
        },
        {
            root: {
                pipelinePanel: new pcui.Panel({
                    headerText: 'PIPELINE',
                    collapsible: true
                })
            },
            children: [
                {
                    pipelineAttributesInspector: new pcui.AttributesInspector({
                        assets: parent._args.assets,
                        history: parent._args.history,
                        attributes: PIPELINE_ATTRIBUTES
                    })
                },
                {
                    root: {
                        unwrapContainer: new pcui.Container({
                            flex: true,
                            flexDirection: 'row',
                            alignItems: 'center'
                        })
                    },
                    children: [
                        {
                            unwrapAttributesInspector: new pcui.AttributesInspector({
                                assets: parent._args.assets,
                                history: parent._args.history,
                                attributes: UNWRAP_ATTRIBUTES
                            })
                        },
                        {
                            btnAutoUnwrap: new pcui.Button({
                                text: 'AUTO-UNWRAP',
                                flexGrow: 1,
                                width: '133px'
                            })
                        },
                        {
                            btnCancelAutoUnwrap: new pcui.Button({
                                text: 'CANCEL',
                                flexGrow: 1
                            })
                        }
                    ]
                }
            ]
        },
        {
            root: {
                meshInstancesPanel: new pcui.Panel({
                    headerText: 'MESH INSTANCES',
                    collapsible: true
                })
            },
            children: [
                {
                    meshInstances: new pcui.ModelAssetInspectorMeshInstances({
                        assets: parent._args.assets,
                        history: parent._args.history
                    })
                }
            ]
        }
    ];

    class ModelAssetInspector extends pcui.Container {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);

            this.class.add(CLASS_ROOT);

            this._args = args;
            this._assets = null;
            this._assetEvents = [];
            this._unwrapProgress = [];
            this._hasVisited = false;

            this.buildDom(DOM(this));

            this._unwrapAttributesInspector.getField('progress').parent.class.add(CLASS_AUTO_UNWRAP_PROGRESS);
            this._unwrapAttributesInspector.getField('padding').parent.class.add(CLASS_AUTO_UNWRAP_PADDING);
            this._btnCancelAutoUnwrap.hidden = true;
            this._btnAutoUnwrap.on('click', this._onAutoUnwrap.bind(this));
            this._btnCancelAutoUnwrap.on('click', this._onCancelAutoUnwrap.bind(this));
        }

        _onAutoUnwrap() {
            if (!editor.call('permissions:write'))
                return;

            const fieldPadding = this._unwrapAttributesInspector.getField('padding');

            this._assets.forEach((asset) => {
                editor.call('assets:model:unwrap', asset, {
                    padding: fieldPadding.value
                });
            });
            this._btnAutoUnwrap.hidden = true;
            this._btnCancelAutoUnwrap.hidden = false;
            this._unwrapAttributesInspector.getField('progress').parent.hidden = false;
            this._unwrapAttributesInspector.getField('padding').parent.hidden = true;
        }

        _onCancelAutoUnwrap() {
            this._assets.forEach((asset) => {
                editor.call('assets:model:unwrap:cancel', asset);
            });
            this._resetAutoUnwrap();
        }

        _resetAutoUnwrap() {
            this._unwrapProgress = [];


            this._btnAutoUnwrap.hidden = false;
            this._btnCancelAutoUnwrap.hidden = true;
            this._unwrapAttributesInspector.getField('progress').parent.hidden = true;
            this._unwrapAttributesInspector.getField('padding').parent.hidden = false;
            this._unwrapAttributesInspector.getField('progress').value = 0;
        }

        _formatMetaAttribute(attribute) {
            const total = this._assets.map(asset => asset.get(attribute)).reduce((a, b) => a + b, 0);
            const formattedTotal = total.toLocaleString();
            this._metaAttributesInspector.getField(attribute).values = this._assets.map((asset) => {
                return formattedTotal;
            });
        }

        _formatMetaAttributesAttribute() {
            const metaAttributes = {};
            this._assets.forEach((asset) => {
                const currMetaAttributes = asset.get('meta.attributes');
                if (currMetaAttributes) {
                    Object.assign(metaAttributes, currMetaAttributes);
                }
            });

            const metaAttributesString = Object.keys(metaAttributes).join(', ');
            const metaAttributesField = this._metaAttributesInspector.getField('meta.attributes');
            metaAttributesField.parent.hidden = !metaAttributesString;
            metaAttributesField.style.whiteSpace = 'normal';
            metaAttributesField.values = this._assets.map((asset) => {
                return metaAttributesString;
            });
        }

        _formatUV1Attribute() {
            const uv1Field = this._pipelineAttributesInspector.getField('meta.attributes.texCoord1');
            const assetsTexCoord1Values = this._assets.map((asset) => {
                return asset.get('meta.attributes.texCoord1');
            });
            const uv1Options = ['unavailable', 'available', 'various'];
            const uv1FieldValue = assetsTexCoord1Values.reduce((prev, curr) => {
                if ((curr ? 1 : 0) === prev) {
                    return prev;
                }
                return 2;
            }, this._assets[0].get('meta.attributes.texCoord1') ? 1 : 0);
            uv1Field.values = this._assets.map((value) => {
                return uv1Options[uv1FieldValue];
            });
        }

        link(assets) {
            this.unlink();
            this._assets = assets;
            this._metaAttributesInspector.link(assets);
            this._pipelineAttributesInspector.link(assets);
            this._meshInstances.link(assets);

            if (!this._hasVisited) {
                this._hasVisited = true;
                this._metaPanel.collapsed = true;
                this._pipelinePanel.collapsed = true;
            }

            META_ATTRIBUTES.forEach((attribute) => {
                if (attribute.path !== 'meta.attributes') {
                    this._formatMetaAttribute(attribute.path);
                }
            });
            this._formatMetaAttributesAttribute();
            this._formatUV1Attribute();
            this._resetAutoUnwrap();

            this._assets.forEach((asset, index) => {
                this._unwrapProgress.push(0);
                this._assetEvents.push(editor.on('assets:model:unwrap:progress:' + asset.get('id'), (progress) => {
                    this._unwrapProgress[index] = progress;
                    const totalProgress = this._unwrapProgress.reduce((total, curr) => total + curr, 0) / this._assets.length;
                    this._unwrapAttributesInspector.getField('progress').value = totalProgress;
                }));
            });

            this._assetEvents.push(editor.on('assets:model:unwrap', (asset) => {
                const assetIndex = this._assets.indexOf(asset);
                if (assetIndex === -1) {
                    return;
                }
                META_ATTRIBUTES.forEach((attribute) => {
                    if (attribute.path !== 'meta.attributes') {
                        this._formatMetaAttribute(attribute.path);
                    }
                });
                this._formatMetaAttributesAttribute();
                this._formatUV1Attribute();
                this._resetAutoUnwrap();
            }));

            this._meshInstancesPanel.hidden = assets.length > 1;
            let hidePipelinePanel = false;
            for (let i = 0; i < assets.length; i++) {
                if (assets[i].get('file.filename').match(/.*\.glb$/)) {
                    hidePipelinePanel = true;
                    break;
                }
            }
            this._pipelinePanel.hidden = hidePipelinePanel;
        }

        unlink() {
            if (this._assets === null) {
                return;
            }
            this._metaAttributesInspector.unlink();
            this._pipelineAttributesInspector.unlink();
            this._meshInstances.unlink();
            this._assets = [];
            this._assetEvents.forEach(evt => evt.unbind());
            this._assetEvents = [];
            this._unwrapProgress = [];
        }
    }

    return {
        ModelAssetInspector: ModelAssetInspector
    };
})());
