Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-cubemap-asset-inspector';
    const CLASS_FACE = CLASS_ROOT + '-face';
    const CLASS_FACE_LABEL = CLASS_FACE + '-label';
    const CLASS_FACE_BUTTON = CLASS_FACE + '-button';

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

    class CubemapFace extends pcui.Container {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);
            this._args = args;
            this._asset = null;
            this._assetEvents = [];
            this._dropTarget = null;

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

        _onClickFace() {
            if (! editor.call('permissions:write'))
                return;

            const texture = editor.call('assets:get', this._asset.get(`data.textures.${this._args.face}`));
            editor.call('picker:asset', {
                type: 'texture',
                currentAsset: texture
            });


            editor.once('picker:asset:close', () => {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        }

        _onClickDeleteFace() {
            this._asset.set(`data.textures.${this._args.face}`, null);
        }

        _initializeDropTarget() {
            this._dropTarget = editor.call('drop:target', {
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
            this._initializeDropTarget();
            this._assetEvents.push(this._deleteButton.on('click', this._onClickDeleteFace.bind(this)));
            this._assetEvents.push(this.on('click', this._onClickFace.bind(this)));
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
            this._assetEvents = [];
            if (this._dropTarget) {
                this._dropTarget.destroy();
                this._dropTarget = null;
            }
        }
    }

    return {
        CubemapFace: CubemapFace
    };
})());
