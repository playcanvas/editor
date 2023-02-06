import { Button, Label, Container, BindingTwoWay } from '@playcanvas/pcui';

Object.assign(pcui, (function () {
    const CLASS_ROOT = 'pcui-cubemap-asset-inspector';
    const CLASS_FACE = CLASS_ROOT + '-face';
    const CLASS_FACE_LABEL = CLASS_FACE + '-label';
    const CLASS_FACE_BUTTON = CLASS_FACE + '-button';

    const DOM_CUBEMAP_FACE = args => [
        {
            thumbnail: new pcui.AssetThumbnail({
                assets: args.assets,
                width: '100%',
                binding: new BindingTwoWay({
                    history: args.history
                })
            })
        }, {
            deleteButton: new Button({ icon: 'E124', class: CLASS_FACE_BUTTON })
        }, {
            faceLabel: new Label({ text: args.label, class: CLASS_FACE_LABEL })
        }
    ];

    const FACE_SORT = {
        '0': 0,
        'posx': 0,
        'right': 0,
        'px': 0,

        '1': 1,
        'negx': 1,
        'left': 1,
        'nx': 1,

        '2': 2,
        'posy': 2,
        'top': 2,
        'up': 2,
        'py': 2,

        '3': 3,
        'negy': 3,
        'bottom': 3,
        'down': 3,
        'ny': 3,

        '4': 4,
        'posz': 4,
        'front': 4,
        'forward': 4,
        'pz': 4,

        '5': 5,
        'negz': 5,
        'back': 5,
        'backward': 5,
        'nz': 5,

        '6': 6
    };

    class CubemapFace extends Container {
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
            if (!editor.call('permissions:write'))
                return;

            const texture = editor.call('assets:get', this._asset.get(`data.textures.${this._args.face}`));
            editor.call('picker:asset', {
                type: 'texture',
                currentAsset: texture
            });

            let evtPick = editor.once('picker:asset', (texture) => {
                this._asset.set(`data.textures.${this._args.face}`, parseInt(texture.get('id'), 10));
                this._setRgbmIfNeeded();
                evtPick = null;
            });

            editor.once('picker:asset:close', () => {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        }

        _onClickDeleteFace(evt) {
            if (!editor.call('permissions:write'))
                return;
            evt.stopPropagation();
            this._asset.set(`data.textures.${this._args.face}`, null);
            this._setRgbmIfNeeded();
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
                    var asset = editor.call('assets:get', parseInt(dropData.id, 10));

                    // try matching patterns of texture names
                    // to autoset  all 6 faces for empty cubemaps
                    try {
                        var empty = true;
                        var faces = this._asset.get('data.textures');
                        for (let i = 0; i < faces.length; i++) {
                            if (faces[i]) {
                                empty = false;
                                break;
                            }
                        }

                        if (empty) {
                            var name = asset.get('name');
                            var check = /((neg|pos)(x|y|z)|(right|left|top|up|bottom|down|front|forward|back|backward)|[0-6])(\.|$)/i;
                            var match = name.match(check);

                            if (match != null) {
                                match = match.index;

                                let part = '';
                                if (match) part = name.slice(0, match).toLowerCase();
                                const i = name.indexOf('.', match);
                                if (i > 0) part += name.slice(i);

                                const faceAssets = editor.call('assets:find', (a) => {
                                    if (a.get('source') || a.get('type') !== 'texture')
                                        return;

                                    if (!a.get('path').equals(asset.get('path')))
                                        return;

                                    if (a.get('meta.width') !== asset.get('meta.width') || a.get('meta.height') !== asset.get('meta.height'))
                                        return;

                                    const name = a.get('name').toLowerCase();
                                    let m = name.match(check);

                                    if (m === null)
                                        return;

                                    m = m.index;

                                    let p = '';
                                    if (m) p = name.slice(0, m).toLowerCase();
                                    const i = name.indexOf('.', m);
                                    if (i > 0) p += name.slice(i);

                                    return p === part;
                                });

                                if (faceAssets.length === 6) {

                                    for (let i = 0; i < faceAssets.length; i++) {
                                        let p = faceAssets[i][1].get('name').toLowerCase();
                                        if (match) p = p.slice(match);
                                        const m = p.indexOf('.');
                                        if (m > 0) p = p.slice(0, m);

                                        faceAssets[i] = {
                                            asset: faceAssets[i][1],
                                            face: FACE_SORT[p]
                                        };
                                    }

                                    faceAssets.sort((a, b) => {
                                        return a.face - b.face;
                                    });

                                    const currentAsset = this._asset;
                                    const faceAssetIds = faceAssets.map(faceAsset => faceAsset.asset.get('id'));

                                    const undo = () => {
                                        currentAsset.latest();
                                        if (!currentAsset) return;
                                        currentAsset.history.enabled = false;
                                        for (let i = 0; i < faceAssets.length; i++)
                                            currentAsset.set(`data.textures.${i}`, null);
                                        this._setRgbmIfNeeded();
                                        currentAsset.history.enabled = true;
                                    };
                                    const redo = () => {
                                        currentAsset.latest();
                                        if (!currentAsset) return;
                                        currentAsset.history.enabled = false;
                                        for (let i = 0; i < faceAssets.length; i++)
                                            currentAsset.set(`data.textures.${i}`, parseInt(faceAssetIds[i], 10));
                                        this._setRgbmIfNeeded();
                                        currentAsset.history.enabled = true;
                                    };

                                    if (this._args.history) {
                                        this._args.history.add({
                                            name: 'cubemap.autofill',
                                            undo,
                                            redo
                                        });
                                    }

                                    redo();

                                    return;
                                }
                            }
                        }
                    } catch (ex) {
                        log.error(ex);
                    }
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
