Object.assign(pcui, (function () {
    'use strict';

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
                const cubemapFace = new pcui.CubemapFace(Object.assign(args, { label: FACES[face], face }));
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
