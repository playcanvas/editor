Object.assign(pcui, (function () {
    const CLASS_ROOT = 'pcui-cubemap-asset-inspector';
    const CLASS_FACES_CONTAINER = CLASS_ROOT + '-faces-container';

    const ATTRIBUTES = [{
        label: 'Filtering',
        alias: 'filtering',
        type: 'select',
        reference: 'asset:texture:filtering',
        args: {
            type: 'string',
            options: [{
                v: 'nearest', t: 'Point'
            }, {
                v: 'linear', t: 'Linear'
            }]
        }
    },
    {
        label: 'Anisotropy',
        path: 'data.anisotropy',
        type: 'number',
        reference: 'asset:cubemap:anisotropy'
    }];

    const FACES = {
        0: 'Right',
        1: 'Left',
        2: 'Top',
        3: 'Bottom',
        4: 'Front',
        5: 'Back'
    };

    const FILTERS = {
        'nearest': {
            minFilter: 2,
            magFilter: 0
        },
        'linear': {
            minFilter: 5,
            magFilter: 1
        }
    };

    const DOM = (parent, args) => [
        {
            root: {
                cubemapPanel: new pcui.Panel({
                    headerText: 'CUBEMAP'
                })
            },
            children: [{
                cubemapAttributesInspector: new pcui.AttributesInspector({
                    assets: args.assets,
                    history: args.history,
                    attributes: ATTRIBUTES
                })
            }]
        },
        {
            facesPanel: new pcui.Panel({
                headerText: 'FACES'
            })
        },
        {
            root: {
                prefilteringContainer: new pcui.Container()
            },
            children: [{
                root: {
                    prefilteringPanel: new pcui.Panel({ headerText: 'PREFILTERING', flex: true })
                },
                children: [{
                    root: {
                        prefilterPhongContainer: new pcui.Container({
                            flex: true,
                            flexDirection: 'row'
                        })
                    },
                    children: [{
                        prefilterPhongLabel: new pcui.Label({
                            text: 'Use legacy phong lobe'
                        })
                    }, {
                        prefilterPhong: new pcui.BooleanInput({
                            flexShrink: 0,
                            flexGrow: 0
                        })
                    }]
                }, {
                    prefilterButton: new pcui.Button({ text: 'PREFILTER CUBEMAP' })
                }, {
                    deletePrefilterButton: new pcui.Button({ text: 'DELETE PREFILTERED DATA' })
                }]
            },
            {
                root: {
                    errorContainer: new pcui.Container({
                        flex: true,
                        alignItems: 'center'
                    })
                },
                children: [{
                    errorLabel: new pcui.Label({
                        class: pcui.CLASS_ERROR
                    })
                }]
            }]
        }
    ];

    class CubemapAssetInspector extends pcui.Container {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);
            this._args = args;
            this._assets = null;
            this._assetEvents = [];
            this._faces = [];

            this.buildDom(DOM(this, args));

            Object.keys(FACES).forEach((face) => {
                const cubemapFace = new pcui.CubemapFace(Object.assign(args, { label: FACES[face], face }));
                this._faces.push(cubemapFace);
                this._facesPanel.append(cubemapFace);
            });

            this._facesPanel.content.class.add(CLASS_FACES_CONTAINER);

            const ref = editor.call('attributes:reference:get', 'asset:cubemap:asset');
            if (ref) {
                (new pcui.TooltipReference({
                    reference: ref
                })).attach({
                    target: this._cubemapPanel.header
                });
            }

            const phongRef = editor.call('attributes:reference:get', 'asset:cubemap:useLegacyPhongLobe');
            if (phongRef) {
                const tooltip = new pcui.TooltipReference({
                    reference: phongRef
                });
                tooltip.attach({
                    target: this._prefilterPhongContainer
                });
            }
        }

        _updateFilteringSelect() {
            this._cubemapAttributesInspector.getField('filtering').values = this._assets.map((asset) => {
                if (asset.get('data.minFilter') === 2 && asset.get('data.magFilter') === 0) {
                    return 'nearest';
                } else if (asset.get('data.minFilter') === 5 && asset.get('data.magFilter') === 1) {
                    return 'linear';
                }
                return '';
            });
        }

        _checkFacesValid() {
            const faces = this._assets[0].get('data.textures');

            if (!(faces instanceof Array))
                return 'missing faces information';

            for (let i = 0; i < 6; i++) {
                if (!faces[i])
                    return 'set face textures';
            }

            let width = 0;
            let height = 0;

            for (let i = 0; i < 6; i++) {
                const asset = editor.call('assets:get', faces[i]);
                if (!asset)
                    return 'missing face asset';

                if (!asset.has('meta.width') || !asset.has('meta.height'))
                    return 'no texture resolution data available';

                const w = asset.get('meta.width');
                const h = asset.get('meta.height');

                if ((w & (w - 1)) !== 0 || (h & (h - 1)) !== 0)
                    return 'face textures should have power of two resolution';

                if (w !== h)
                    return 'face textures should have square resolution';

                if (i === 0) {
                    width = w;
                    height = h;
                } else {
                    if (width !== w || height !== h)
                        return 'face textures should have same resolution';
                }
            }

            return false;
        }

        _updateFilteringForAssets(filterValue) {
            const currFilterValues = this._assets.map((asset) => {
                return {
                    minFilter: asset.get('data.minFilter'),
                    magFilter: asset.get('data.magFilter')
                };
            });
            const assets = this._assets.map((asset) => {
                asset.history.enabled = false;
                asset.set('data.minFilter', FILTERS[filterValue].minFilter);
                asset.set('data.magFilter', FILTERS[filterValue].magFilter);
                asset.history.enabled = true;
                return asset;
            });
            this._args.history.add({
                name: 'assets.filtering',
                undo: () => {
                    assets.forEach((asset, i) => {
                        asset.latest();
                        if (!asset)
                            return;
                        asset.history.enabled = false;
                        asset.set('data.minFilter', currFilterValues[i].minFilter);
                        asset.set('data.magFilter', currFilterValues[i].magFilter);
                        asset.history.enabled = true;
                    });
                },
                redo: () => {
                    assets.forEach((asset) => {
                        asset.latest();
                        if (!asset)
                            return;
                        asset.history.enabled = false;
                        asset.set('data.minFilter', FILTERS[filterValue].minFilter);
                        asset.set('data.magFilter', FILTERS[filterValue].magFilter);
                        asset.history.enabled = true;
                    });
                }
            });
        }

        _onFilteringSelectChange(filterValue) {
            if (['nearest', 'linear'].includes(filterValue)) {
                let hasDiveredFromAssets = false;
                this._assets.forEach((asset) => {
                    if (asset.get('data.minFilter') !== FILTERS[filterValue].minFilter) {
                        hasDiveredFromAssets = true;
                    }
                });
                if (hasDiveredFromAssets) {
                    if (filterValue === 'nearest') {
                        this._updateFilteringForAssets(filterValue);
                    } else if (filterValue === 'linear') {
                        this._updateFilteringForAssets(filterValue);
                    }
                }
            }
        }

        _isPrefiltered() {
            return !!this._assets[0].get('file');
        }

        _onClickPrefilterButton() {
            this._prefilterButton.enabled = false;
            editor.call('assets:cubemaps:prefilter', this._assets[0], this._prefilterPhong.value, (err) => {
                this._prefilterButton.enabled = true;
                if (err)
                    return editor.call('status:error', err);
            });
        }

        _onClickDeletePrefilterButton() {
            editor.call('realtime:send', 'cubemap:clear:', parseInt(this._assets[0].get('uniqueId'), 10));
        }

        _updateLayout() {
            this._updateFilteringSelect();
            const validationError = this._isPrefiltered() ? null : this._checkFacesValid();
            this._errorLabel.text = validationError;
            this._errorLabel.hidden = !validationError;
            this._prefilteringPanel.hidden = !!validationError;
            this._prefilterPhongContainer.enabled = !this._isPrefiltered();
            this._prefilterButton.hidden = this._isPrefiltered();
            this._deletePrefilterButton.hidden = !this._isPrefiltered();
            this._facesPanel.hidden = this._assets.length > 1;
            this._prefilteringContainer.hidden = this._assets.length > 1;
        }

        link(assets) {
            this.unlink();
            this._assets = assets;
            this._cubemapAttributesInspector.link(assets);
            this._faces.forEach((face, ind) => {
                face.link(assets[0], `data.textures.${ind}`);
            });

            // Events
            this._assetEvents.push(this._cubemapAttributesInspector.getField('filtering').on('change', this._onFilteringSelectChange.bind(this)));
            assets.forEach((asset) => {
                this._assetEvents.push(asset.on('*:set', () => {
                    this._updateLayout();
                }));
            });
            this._assetEvents.push(this._prefilterButton.on('click', this._onClickPrefilterButton.bind(this)));
            this._assetEvents.push(this._deletePrefilterButton.on('click', this._onClickDeletePrefilterButton.bind(this)));

            // Layout
            this._updateLayout();
        }

        unlink() {
            if (this._assets === null) return;
            this._cubemapAttributesInspector.unlink();
            this._faces.forEach((face) => {
                face.unlink();
            });
            this._assetEvents.forEach(evt => evt.unbind());
            this._assetEvents = [];
        }
    }

    return {
        CubemapAssetInspector: CubemapAssetInspector
    };
})());
