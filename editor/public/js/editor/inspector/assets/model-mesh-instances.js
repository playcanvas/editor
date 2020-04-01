Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'asset-model-inspector-mesh-instances';
    const CLASS_PICKER_MODE = CLASS_ROOT + '-picker-mode';
    const CLASS_PICKER_LABEL = CLASS_ROOT + '-picker-label';

    const DOM = (parent) => [
        {
            progress: new pcui.Progress({ width: '100%' })
        },
        {
            pickerLabel: new pcui.Label({
                text: '<h5>SELECT MESH INSTANCE</h5>Choose a mesh instance to customize the material for these Entities.',
                unsafe: true,
                class: CLASS_PICKER_LABEL
            })
        },
        {
            meshInstancesContainer: new pcui.Container()
        },
        {
            root: {
                errorLoadingDetailedDataContainer: new pcui.Container({
                    flex: true,
                    flexDirection: 'column',
                    alignItems: 'center'
                })
            },
            children: [
                {
                    errorLoadingDetailedDataLabel: new pcui.Label({
                        text: 'failed loading detailed data'
                    })
                }
            ]
        }
    ];

    class ModelAssetInspectorMeshInstances extends pcui.Container {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);

            this.class.add(CLASS_ROOT);

            this._args = args;
            this._assets = [];
            this._assetElements = [];

            if (this._args.mode === 'picker') {
                this.class.add(CLASS_PICKER_MODE);
            }

            this.buildDom(DOM(this));

            // child element adjustments
            this._errorLoadingDetailedDataContainer.hidden = true;
            this._errorLoadingDetailedDataLabel.class.add(pcui.CLASS_ERROR);
        }

        _dragEnterFn(ind) {
            return (dropType, dropData) => {
                this._engineAsset = pc.app.assets.get(this._assets[0].get('id'));
                this._valueBefore = this._assets[0].get('data.mapping.' + ind + '.material') || null;
                if (this._engineAsset) {
                    this._engineAsset.data.mapping[ind].material = parseInt(dropData.id, 10);
                    this._engineAsset.fire('change', this._engineAsset, 'data', this._engineAsset.data, this._engineAsset.data);
                    editor.call('viewport:render');
                }
            };
        }

        _dragLeaveFn(ind) {
            return (dropType, dropData) => {
                this._engineAsset.data.mapping[ind].material = this._valueBefore;
                this._engineAsset.fire('change', this._engineAsset, 'data', this._engineAsset.data, this._engineAsset.data);
                editor.call('viewport:render');
            };
        }

        _loadData() {
            if (this._assets.length !== 1 || this._loading)
                return;

            this._hash = this._assets[0].get('file.hash');
            this._loading = 1;
            this._nodes = null;
            this._progress.hidden = false;

            this._request = Ajax
            .get('{{url.home}}' + this._assets[0].get('file.url'))
            .on('load', (status, data) => {
                this._loading = 0;

                this._nodes = [];
                for (var i = 0; i < data.model.meshInstances.length; i++)
                    this._nodes[i] = data.model.nodes[data.model.meshInstances[i].node].name;

                this._updateMeshInstances();
                this._progress.hidden = true;
                this._request = null;
            })
            .on('progress', (progress) => {
                this._progress.value = (0.1 + progress * 0.8) * 100;
            })
            .on('error', () => {
                this._progress.value = 1;
                this._progress.hidden = true;

                this._errorLoadingDetailedDataLabel.hidden = false;
            });
        }

        _updateMeshInstances() {
            if (this._nodes) {
                this.parent.headerText = `MESH INSTANCES [${this._nodes.length}]`;
                this._assetElements.forEach((assetElement, ind) => {
                    assetElement.text = `[0] ${this._nodes[ind]}`;
                });
            }
        }

        link(assets) {
            this.unlink();
            this._assets = assets;
            this._assets[0].get('data.mapping').forEach((_, ind) => {
                const assetElement = new pcui.AssetInput({
                    assetType: 'material',
                    assets: this._args.assets,
                    class: `node-${ind}`,
                    text: `[${ind}] node`,
                    flexGrow: 1,
                    binding: new pcui.BindingTwoWay({
                        history: this._args.history
                    }),
                    allowDragDrop: true,
                    // update viewport materials on drag enter
                    dragEnterFn: this._dragEnterFn(ind),
                    dragLeaveFn: this._dragLeaveFn(ind)
                });

                if (this._args.mode === 'picker') {
                    assetElement.readOnly = true;
                    if (this._args.isMeshInstanceDisabled && this._args.isMeshInstanceDisabled(ind)) {
                        assetElement.enabled = false;
                    }

                    assetElement.on('click', () => {
                        this.emit('select', ind);
                    });
                }

                assetElement.link(assets, `data.mapping.${ind}.material`);
                this._assetElements.push(assetElement);
                this._meshInstancesContainer.append(this._assetElements[ind]);
            });

            if (assets[0].has('file.url')) {
                if (! this._loading) {
                    this._loadData();
                } else {
                    this._updateMeshInstances();
                }
            }

            if (this._args.mode === 'picker') {
                this._progress.hidden = true;
                this._pickerLabel.hidden = false;
                this._pickerLabel.text = '<h5>SELECT MESH INSTANCE</h5>Choose a mesh instance to customize the material for ' + (this._args.entities.length > 1 ? 'these Entities.' : 'this Entity.');
            } else {
                this._pickerLabel.hidden = true;
            }
        }

        unlink() {
            this._assets = [];
            this._assetElements.forEach(assetElement => {
                assetElement.destroy();
            });
            this._assetElements = [];
            if (this._request) {
                this._request.owner.abort();
                this._request = null;
            }
        }
    }

    return {
        ModelAssetInspectorMeshInstances: ModelAssetInspectorMeshInstances
    };
})());
