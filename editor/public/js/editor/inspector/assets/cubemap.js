Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-cubemap-asset-inspector';
    const CLASS_FACES_CONTAINER = CLASS_ROOT + '-faces-container';
    const CLASS_FACE = CLASS_ROOT + '-face';
    const CLASS_FACE_LABEL = CLASS_FACE + '-label';
    const CLASS_FACE_BUTTON = CLASS_FACE + '-button';

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

    const DOM_CUBEMAP_FACE = (args) => [
        {
            thumbnail: new pcui.AssetThumbnail({
                assets: args.assets,
                width: '100%',
                binding: new pcui.BindingTwoWay({
                    history: args.history
                })
            })
        }, {
            deleteButton: new pcui.Button({ icon: 'E124', class: CLASS_FACE_BUTTON })
        }, {
            faceLabel: new pcui.Label({ text: args.label, class: CLASS_FACE_LABEL })
        }
    ];

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
                    prefilteringPanel: new pcui.Panel({ headerText: 'PREFILTERING' })
                },
                children: [{
                    prefilterButton: new pcui.Button({ text: 'Prefilter' })
                }, {
                    deletePrefilterButton: new pcui.Button({ text: 'Delete Prefiltered Data' })
                }]
            },
            {
                root: {
                    setFaceTextureErrorContainer: new pcui.Container({
                        flex: true,
                        alignItems: 'center'
                    })
                },
                children: [{
                    setFaceTexturesError: new pcui.Label({
                        text: 'set face textures',
                        class: pcui.CLASS_ERROR
                    })
                }]
            }]
        }
    ];

    class CubemapFace extends pcui.Container {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);
            this._args = args;
            this._asset = null;
            this._assetEvents = [];

            this.buildDom(DOM_CUBEMAP_FACE(args));
            this.class.add(CLASS_FACE);
            this.class.add(args.label);
        }

        _setRgbmIfNeeded() {
            let allHdr = true;
            const textures = this._asset.get('data.textures');
            for (let i = 0; i < textures.length; i++) {
                if (textures[i] >= 0) {
                    const texture = editor.call('assets:get', textures[i]);
                    if (texture && !texture.get('data.rgbm')) {
                        allHdr = false;
                        break;
                    }
                }
            }
            if (allHdr)  {
                this._asset.set('data.rgbm', true);
            } else {
                this._asset.unset('data.rgbm');
            }
        }

        _onClickDeleteFace() {
            this._asset.set(`data.textures.${this._args.face}`, null);
        }

        _initialiseDropTarget() {
            editor.call('drop:target', {
                ref: this._thumbnail,
                filter: (type, dropData) => {
                    if (dropData.id && type.startsWith('asset') &&
                        (type === 'asset.texture') &&
                        parseInt(dropData.id, 10) !== this._asset.get(`data.textures.${this._args.face}`)) {
                        const asset = this._args.assets.get(dropData.id);
                        return !!asset && !asset.get('source');
                    }
                },
                drop: (type, dropData) => {
                    this._asset.set(`data.textures.${this._args.face}`, parseInt(dropData.id, 10));
                    this._setRgbmIfNeeded();
                }
            });
        }

        link(asset, path) {
            this._asset = asset;
            this.unlink();
            this._thumbnail.link(asset, path);
            this._initialiseDropTarget();
            this._assetEvents.push(this._deleteButton.on('click', this._onClickDeleteFace.bind(this)));
            this._assetEvents.push(this._asset.on('*:set', () => {
                this._deleteButton.hidden = !this._asset.get(`data.textures.${this._args.face}`);
            }));
            this._assetEvents.push(this._asset.on('*:unset', () => {
                this._deleteButton.hidden = !this._asset.get(`data.textures.${this._args.face}`);
            }));
            this.hidden = false;
            this._deleteButton.hidden = !this._asset.get(`data.textures.${this._args.face}`);
        }

        unlink() {
            if (!this._asset) return;
            this._thumbnail.unlink();
            this._assetEvents.forEach(evt => evt.unbind());
        }
    }

    class CubemapAssetInspector extends pcui.Container {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);
            this._args = args;
            this._assets = null;
            this._assetEvents = [];
            this._faces = [];

            this.buildDom(DOM(this, args));

            Object.keys(FACES).forEach(face => {
                const cubemapFace = new CubemapFace(Object.assign(args, { label: FACES[face], face }));
                this._faces.push(cubemapFace);
                this._facesPanel.append(cubemapFace);
            });

            this._facesPanel.content.class.add(CLASS_FACES_CONTAINER);

            editor.call('attributes:reference:attach', 'asset:cubemap:asset', this._cubemapPanel, this._cubemapPanel.header.dom);
        }

        _updateFilteringSelect() {
            this._cubemapAttributesInspector.getField('filtering').values = this._assets.map(asset => {
                if (asset.get('data.minFilter') === 2 && asset.get('data.magFilter') === 0) {
                    return 'nearest';
                } else if (asset.get('data.minFilter') === 5 && asset.get('data.magFilter') === 1) {
                    return 'linear';
                }
                return '';
            });
        }

        _onFilteringSelectChange(value) {
            if (value === 'nearest') {
                this._assets.forEach(asset => {
                    asset.set('data.minFilter', 2);
                    asset.set('data.magFilter', 0);
                });
            } else if (value === 'linear') {
                this._assets.forEach(asset => {
                    asset.set('data.minFilter', 5);
                    asset.set('data.magFilter', 1);
                });
            }
        }

        _hasAllTextures() {
            let hasAllCubemapTextures = true;
            this._assets[0].get('data.textures').forEach(texture => {
                if (texture === null) {
                    hasAllCubemapTextures = false;
                }
            });
            return hasAllCubemapTextures;
        }

        _isPrefiltered() {
            return !!this._assets[0].get('file');
        }

        _onClickPrefilterButton() {
            editor.call('assets:cubemaps:prefilter', this._assets[0], (err) => {
                if (err)
                    return editor.call('status:error', err);
            });
        }

        _onClickDeletePrefilterButton() {
            editor.call('realtime:send', 'cubemap:clear:', parseInt(this._assets[0].get('uniqueId'), 10));
        }

        _updateLayout() {
            this._updateFilteringSelect();
            this._prefilteringPanel.hidden = !this._hasAllTextures();
            this._setFaceTexturesError.hidden = this._hasAllTextures();
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
            assets.forEach(asset => {
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
