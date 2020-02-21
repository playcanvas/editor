Object.assign(pcui, (function () {
    'use strict';

    // util
    const makeRefAssigner = (prefix = '') => attr => {
        if (attr.hasOwnProperty('reference')) return;

        const path = attr.alias || attr.path;
        if (!path) return;

        const parts = path.split('.');
        attr.reference = `${prefix}${parts[parts.length - 1]}`;
    };

    const CLASS_ROOT = 'asset-texture-inspector';
    const CLASS_COMPRESS_BUTTON = CLASS_ROOT + '-compress-button';

    const TEXTURE_ATTRIBUTES = [
        {
            label: "Width",
            path: "meta.width",
            type: "label",
            args: {
                placeholder: "pixels"
            }
        },
        {
            label: "Height",
            path: "meta.height",
            type: "label",
            args: {
                placeholder: "pixels"
            }
        },
        {
            label: "Depth",
            path: "meta.depth",
            type: "label",
            args: {
                placeholder: "bit"
            }
        },
        {
            label: "Alpha",
            path: "meta.alpha",
            type: "label"
        },
        {
            label: "Interlaced",
            path: "meta.interlaced",
            type: "label"
        },
        {
            label: "Rgbm",
            path: "data.rgbm",
            type: "boolean"
        },
        {
            label: "Mipmaps",
            path: "data.mipmaps",
            type: "boolean",
            reference: null
        },
        {
            label: "Filtering",
            alias: "filtering",
            paths: ["data.minfilter", "data.magfilter"],
            type: "select",
            args: {
                type: "string",
                options: [
                    { v: "nearest", t: "Point" },
                    { v: "linear", t: "Linear" }
                ]
            }
        },
        {
            label: "Anistropy",
            path: "data.anisotropy",
            type: "number"
        },
        {
            label: "Address U",
            path: "data.addressu",
            type: "select",
            reference: "asset:texture:addressU",
            args: {
                type: "string",
                options: [
                    { v: "repeat", t: "Repeat" },
                    { v: "clamp", t: "Clamp" },
                    { v: "mirror", t: "Mirror Repeat" }
                ]
            }
        },
        {
            label: "Address V",
            path: "data.addressv",
            type: "select",
            reference: "asset:texture:addressV",
            args: {
                type: "string",
                options: [
                    { v: "repeat", t: "Repeat" },
                    { v: "clamp", t: "Clamp" },
                    { v: "mirror", t: "Mirror Repeat" }
                ]
            }
        }
    ];
    TEXTURE_ATTRIBUTES.forEach(makeRefAssigner('asset:texture:'));

    const COMPRESSION_BASIS_ATTRIBUTES = [
        {
            label: "Basis",
            path: "meta.compress.basis",
            type: "boolean"
        },
        {
            label: "Normals",
            path: "meta.compress.normals",
            type: "boolean"
        },
        {
            label: "Quality",
            path: "meta.compress.quality",
            type: "select",
            args: {
                type: "number",
                options: [
                    { v: 0, t: "Lowest" },
                    { v: 64, t: "Low" },
                    { v: 128, t: "Default" },
                    { v: 192, t: "High" },
                    { v: 255, t: "Highest" }
                ]
            }
        }
    ];
    COMPRESSION_BASIS_ATTRIBUTES.forEach(makeRefAssigner('asset:texture:compress:'));

    const LEGACY_COMPRESSION_PARAMS = ['dxt', 'pvr', 'etc1', 'etc2'];
    const COMPRESSION_LEGACY_ATTRIBUTES = [
        {
            label: "Legacy",
            type: 'boolean',
            alias: 'compress.legacy'
        },
        {
            label: "Alpha",
            path: "meta.compress.alpha",
            type: "boolean"
        },
        {
            label: "Original",
            type: 'label',
            alias: 'compress.original'
        },
        {
            label: "DXT",
            path: "meta.compress.dxt",
            type: "boolean"
        },
        {
            label: "PVR",
            path: "meta.compress.pvr",
            type: "boolean"
        },
        {
            label: "\xa0",
            path: "meta.compress.pvrBpp",
            type: "select",
            args: {
                type: "number",
                options: [
                    { v: 2, t: '2 BPP' },
                    { v: 4, t: '4 BPP' }
                ]
            }
        },
        {
            label: "ETC1",
            path: "meta.compress.etc1",
            type: "boolean",
            reference: null
        },
        {
            label: "ETC2",
            path: "meta.compress.etc2",
            type: "boolean",
            reference: null
        }
    ];
    COMPRESSION_LEGACY_ATTRIBUTES.forEach(makeRefAssigner('asset:texture:compress:'));

    const DOM = (parent, hasBasis) => [
        {
            root: {
                texturePanel: new pcui.Panel({
                    headerText: 'TEXTURE',
                    collapsible: true,
                })
            },
            children: [
                {
                    root: {
                        btnContainerGetMeta: new pcui.Container({
                            flex: true,
                            flexDirection: 'row',
                            alignItems: 'center'
                        })
                    },
                    children: [
                        {
                            btnGetMeta: new pcui.Button({
                                text: 'CALCULATE META',
                                icon: 'E131',
                                flexGrow: 1,
                            })
                        }
                    ]
                },
                {
                    textureAttributesInspector: new pcui.AttributesInspector({
                        assets: parent._args.assets,
                        history: parent._args.history,
                        attributes: TEXTURE_ATTRIBUTES
                    })
                }
            ]
        },
        {
            root: {
                compressionPanel: new pcui.Panel({
                    headerText: 'COMPRESSION',
                    collapsible: true,
                })
            },
            children: (hasBasis ? [
                {
                    root: {
                        compressionBasisContainer: new pcui.Container()
                    },
                    children: [
                        {
                            compressionBasisAttributesInspector: new pcui.AttributesInspector({
                                assets: parent._args.assets,
                                history: parent._args.history,
                                attributes: COMPRESSION_BASIS_ATTRIBUTES
                            })
                        },
                        {
                            compressionBasisPvrWarning: new pcui.InfoBox({
                                icon: 'E218',
                                title: 'Texture is not square',
                                text: 'This texture does not support PVR compression.'
                            })
                        },
                        {
                            root: {
                                compressBasisBtnContainer: new pcui.Container({
                                    flex: true,
                                    flexDirection: 'row',
                                    alignItems: 'center'
                                })
                            },
                            children: [
                                {
                                    btnCompressBasis: new pcui.Button({
                                        text: 'COMPRESS BASIS',
                                        flexGrow: 1,
                                        class: CLASS_COMPRESS_BUTTON
                                    })
                                }
                            ]
                        },
                        {
                            basisDivider: new pcui.Divider()
                        }
                    ]
                }
            ] : []).concat([
                {
                    root: {
                        compressionLegacyContainer: new pcui.Container()
                    },
                    children: [
                        {
                            compressionLegacyAttributesInspector: new pcui.AttributesInspector({
                                assets: parent._args.assets,
                                history: parent._args.history,
                                attributes: COMPRESSION_LEGACY_ATTRIBUTES
                            })
                        },
                        {
                            root: {
                                compressLegacyBtnContainer: new pcui.Container({
                                    flex: true,
                                    flexDirection: 'row',
                                    alignItems: 'center'
                                })
                            },
                            children: [
                                {
                                    btnCompressLegacy: new pcui.Button({
                                        text: `COMPRESS${hasBasis ? ' LEGACY' : ''}`,
                                        flexGrow: 1,
                                        class: CLASS_COMPRESS_BUTTON
                                    })
                                }
                            ]
                        }
                    ]
                }
            ])
        }
    ];

    const checkCompressRequired = (asset, format) => {
        if (! asset.get('file'))
            return false;

        const data = asset.get('file.variants.' + format);
        const rgbm = asset.get('data.rgbm');
        const alpha = asset.get('meta.compress.alpha') && (asset.get('meta.alpha') || ((asset.get('meta.type') || '').toLowerCase() === 'truecoloralpha')) || rgbm;
        const normals = !!asset.get('meta.compress.normals');
        const compress = asset.get('meta.compress.' + format);
        const mipmaps = asset.get('data.mipmaps');
        const quality = asset.get('meta.compress.quality');

        if (!! data !== compress) {
            if (format === 'etc1' && alpha)
                return false;

            if (rgbm && ! data)
                return false;

            return true;
        } else if (format !== 'basis' && data && ((((data.opt & 1) !== 0) != alpha))) {
            return true;
        }

        if (data && format === 'pvr') {
            const bpp = asset.get('meta.compress.pvrBpp');
            if (data && ((data.opt & 128) !== 0 ? 4 : 2) !== bpp)
                return true;
        } else if (format === 'etc1') {
            if (data && alpha)
                return true;

            if (! data && alpha)
                return false;
        }

        if (data && ((data.opt & 4) !== 0) !== ! mipmaps)
            return true;

        if (format === 'basis' && data) {
            if ((!!(data.opt & 8) !== normals) || (data.quality === undefined) || (data.quality !== quality)) {
                return true;
            }
        }

        return false;
    }

    // custom binding to change multiple paths per observer
    // this has been kept as agnostic as possible to hopefully
    // maybe work back into pcui.BindingElementToObservers
    class MultiPathBindingElementToObservers extends pcui.BindingElementToObservers {
        constructor({ formatters, ...args }) {
            super(args);
            this._valueFormatters = formatters;
        }

        clone() {
            return new MultiPathBindingElementToObservers({
                formatters: this._valueFormatters,
                history: this._history,
                historyPrefix: this._historyPrefix,
                historyName: this._historyName,
                historyCombine: this._historyCombine
            });
        }

        _formatValue(value, path) {
            if (typeof this._valueFormatters[path] === 'function') {
                return this._valueFormatters[path](value);
            }

            return value;
        }

        _latestHasPaths(latest, paths) {
            if (!latest) {
                return false;
            }

            for (let i = 0; i < paths.length; i++) {
                if (!latest.has(paths[i])) {
                    return false;
                }
            }

            return true;
        }

        // Override setValue to set additional fields
        setValue(value) {
            if (this.applyingChange) return;
            if (!this._observers) return;

            this.applyingChange = true;

            // make copy of observers if we are using history
            // so that we can undo on the same observers in the future
            const observers = this._observers.slice();
            const paths = this._paths.slice();

            let previous = new WeakMap();

            const undo = () => {
                for (let i = 0; i < observers.length; i++) {
                    const latest = observers[i].latest();
                    if (!this._latestHasPaths(latest, paths)) continue;

                    let history = false;
                    if (latest.history) {
                        history = latest.history.enabled;
                        latest.history.enabled = false;
                    }
                    const prev = previous.get(observers[i]);
                    paths.forEach(path => {
                        latest.set(path, prev[path]);
                    });

                    if (history) {
                        latest.history.enabled = true;
                    }
                }
            };

            const redo = () => {
                previous = new WeakMap();

                for (let i = 0; i < observers.length; i++) {
                    const latest = observers[i].latest();
                    if (!this._latestHasPaths(latest, paths)) continue;

                    let history = false;
                    if (latest.history) {
                        history = latest.history.enabled;
                        latest.history.enabled = false;
                    }

                    const prev = {};
                    paths.forEach(path => {
                        prev[path] = latest.get(path);
                        latest.set(path, this._formatValue(value, path));
                    });
                    previous.set(observers[i], prev);

                    if (history) {
                        latest.history.enabled = true;
                    }
                }
            };

            if (this._history) {
                this._history.add({
                    name: this._getHistoryActionName(paths),
                    redo: redo,
                    undo: undo
                });
            }

            redo();

            this.applyingChange = false;
        }
    }

    class SizeLabel extends Label {
        constructor({ format, ...args }) {
            super(args);
            this._format = format;
            this.class.add('pcui-size-label');

            // trying to set using super(args) gets overwritten
            // so we manually set renderChanges to false
            this.renderChanges = false;
            this.updateSize();
        }

        updateSize() {
            const format = this._format;
            this.text = (! format.size && ! format.vram)
                ? '-'
                : `${bytesToHuman(format.size)} [VRAM ${bytesToHuman(format.vram)}]`;
        }
    }

    class TextureAssetInspector extends pcui.Container {
        constructor(args) {
            super(args);

            this.class.add(CLASS_ROOT);

            this._args = args;
            this._assets = null;
            this._assetEvents = [];
            this._compressionChangeTicking = false;
            this._compressionChangeTimeout = null;
            this._hasBasis = editor.call('users:hasFlag', 'hasBasisTextures');
            this._hasLegacy = false;

            this._compressionFormats = {
                original: { size: 0, vram: 0 },
                dxt: { size: 0, vram: 0, timeout: false },
                pvr: { size: 0, vram: 0, timeout: false },
                etc1: { size: 0, vram: 0, timeout: false },
                etc2: { size: 0, vram: 0, timeout: false },
                basis: { size: 0, vram: 0, timeout: false }
            };

            // bind methods to context
            this._btnGetMetaVisibility = this._btnGetMetaVisibility.bind(this);
            this._handleAssetChangeCompression = this._handleAssetChangeCompression.bind(this);
            this._handleBtnCompressBasisClick = this._handleBtnCompressBasisClick.bind(this);
            this._handleBtnCompressLegacyClick = this._handleBtnCompressLegacyClick.bind(this);
            this._handleBtnGetMetaClick = this._handleBtnGetMetaClick.bind(this);
            this._showHideLegacyUi = this._showHideLegacyUi.bind(this);
            this._updatePvrWarning = this._updatePvrWarning.bind(this);

            this.buildDom(DOM(this, this._hasBasis));
            this._setupCompressionSubheads();
            this._setupFilteringTwoWayBinding();
            this._setupPanelReferences();
            this._setupSizeLabels();
            this._setupPvrWarning();
            this._btnGetMeta.on('click', this._handleBtnGetMetaClick);

            if (this._btnCompressBasis) {
                this._btnCompressBasis.on('click', this._handleBtnCompressBasisClick);
                this._btnCompressBasis.disabled = true;
            }
            this._btnCompressLegacy.on('click', this._handleBtnCompressLegacyClick);
            this._btnCompressLegacy.disabled = true;
        }

        _btnGetMetaVisibility() {
            const assets = this._assets;

            let visible = false;
            for(let i = 0; i < assets.length; i++) {
                if (! visible && ! assets[i].get('meta')) {
                    visible = true;
                    break;
                }
            }
            this._btnGetMeta.hidden = ! visible;
        }

        _calculateSize(format) {
            const assets = this._assets;
            const formats = this._compressionFormats;

            formats[format].size = 0;
            formats[format].vram = 0;
            for(let i = 0; i < assets.length; i++) {
                if (! assets[i].get('file') || ! assets[i].get('meta'))
                    continue;

                // slighly different handling for original size
                if (format === 'original') {
                    const pixels = (assets[i].get('meta.width') || 0) * (assets[i].get('meta.height') || 0);
                    formats.original.size += (assets[i].get('file.size') || 0);
                    formats.original.vram += pixels * 4;
                    continue;
                }

                const size = assets[i].get('file.variants.' + format + '.size') || 0;
                const sizeGzip = assets[i].get('file.variants.' + format + '.sizeGzip') || 0;

                if (size) {
                    let vram;
                    if (format === 'basis') {
                        const width = assets[i].get('meta.width');
                        const height = assets[i].get('meta.height');
                        const depth = 1;
                        const pixelFormat = pc.PIXELFORMAT_DXT1;
                        const mipmaps = assets[i].get('data.mipmaps');
                        const cubemap = false;
                        vram = pc.Texture.calcGpuSize(width, height, depth, pixelFormat, mipmaps, cubemap);
                    } else {
                        vram = size - 128;
                    }

                    formats[format].vram += vram;
                }

                if (sizeGzip || size) {
                    formats[format].size += (sizeGzip || size) - 128;
                }
            }

            // if there is a size label, trigger a ui update
            if (formats[format].label) {
                formats[format].label.updateSize();
            }
        }

        _queueSizeCalculate(format) {
            const formats = this._compressionFormats;
            if (formats[format].timeout)
                return;

            formats[format].timeout = true;

            setTimeout(() => {
                formats[format].timeout = false;
                this._calculateSize(format);
            }, 0);
        }

        // enable/disable alpha compression field
        _checkCompressAlpha() {
            if (!this._compressionLegacyAttributesInspector) return;

            const compressAlphaField = this._compressionLegacyAttributesInspector.getField('meta.compress.alpha');
            if (!compressAlphaField) return;

            const assets = this._assets;
            if (!Array.isArray(assets) || !assets.length) {
                compressAlphaField.disabled = true;
                return;
            };

            let state = false;
            let different = false;
            for(let i = 0; i < assets.length; i++) {
                const alpha = assets[i].get('meta.alpha') || false;
                const trueColorAlpha = (assets[i].get('meta.type') || '').toLowerCase() === 'truecoloralpha';
                const rgbm = assets[i].get('data.rgbm');

                if (i === 0) {
                    state = (alpha || trueColorAlpha) && ! rgbm;
                } else if (state !== ((alpha || trueColorAlpha) && ! rgbm)) {
                    different = true;
                    break;
                }
            }

            compressAlphaField.disabled = ! different && ! state;
        };

        _checkCompression() {
            const assets = this._assets;
            if (!editor.call('permissions:write') || !Array.isArray(assets) || !assets.length) {
                if (this._btnCompressBasis) {
                    this._btnCompressBasis.disabled = true;
                }
                this._btnCompressLegacy.disabled = true;
                return;
            };

            let differentBasis = false;
            let differentLegacy = false;
            for(let i = 0; i < assets.length; i++) {
                if (! assets[i].get('file') || !! assets[i].get('task'))
                    continue;

                for(let key in this._compressionFormats) {
                    if (key === 'original')
                        continue;

                    if (checkCompressRequired(assets[i], key)) {
                        if (key === 'basis') {
                            differentBasis = true;
                        } else {
                            differentLegacy = true;
                        }

                        if (differentBasis && differentLegacy)
                            break;
                    }
                }
            }

            if (this._btnCompressBasis) {
                this._btnCompressBasis.disabled = !differentBasis;
            }
            this._btnCompressLegacy.disabled = !differentLegacy;
        }

        _checkFormats() {
            const assets = this._assets;
            const writeAccess = editor.call('permissions:write');
            const fieldDxt = this._compressionLegacyAttributesInspector.getField(`meta.compress.dxt`);
            const fieldEtc1 = this._compressionLegacyAttributesInspector.getField(`meta.compress.etc1`);
            const fieldOriginal = this._compressionLegacyAttributesInspector.getField(`compress.original`);
            const fieldPvr = this._compressionLegacyAttributesInspector.getField(`meta.compress.pvr`);
            const fieldPvrBpp = this._compressionLegacyAttributesInspector.getField(`meta.compress.pvrBpp`);

            let width = -1;
            let height = -1;
            let rgbm = -1;
            let alpha = -1;
            let alphaValid = -1;
            let displayExt = '';
            let showBasisPvrWarning = false;
            let basisSelected = false;
            let hasLegacy = false;

            for(let i = 0; i < assets.length; i++) {
                if (assets[i].has('meta.width')) {
                    if (width === -1) {
                        width = assets[i].get('meta.width');
                        height = assets[i].get('meta.height');
                    } else if (width !== assets[i].get('meta.width') || height !== assets[i].get('meta.height')) {
                        width = -2;
                        height = -2;
                    }
                }

                if (! assets[i].get('file'))
                    continue;

                if (rgbm === -1) {
                    rgbm = assets[i].get('data.rgbm') ? 1 : 0;
                } else if (rgbm !== -2) {
                    if (rgbm !== (assets[i].get('data.rgbm') ? 1 : 0))
                        rgbm = -2;
                }

                if (alpha === -1) {
                    alpha = assets[i].get('meta.compress.alpha') ? 1 : 0;
                } else if (alpha !== -2) {
                    if (alpha !== (assets[i].get('meta.compress.alpha') ? 1 : 0))
                        alpha = -2;
                }

                const alphaValidTmp = (assets[i].get('meta.alpha') || (assets[i].get('meta.type') || '').toLowerCase() === 'truecoloralpha') ? 1 : 0;
                if (alphaValid === -1) {
                    alphaValid = alphaValidTmp;
                } else if (alphaValid !== -2) {
                    if (alphaValid !== alphaValidTmp)
                        alphaValid = -2;
                }

                let ext = assets[i].get('file.url');
                ext = ext.slice(ext.lastIndexOf('.') + 1).toUpperCase();
                ext = ext.split('?')[0];

                if (displayExt !== 'various') {
                    displayExt = displayExt && displayExt !== ext ? 'various' : ext;
                }

                if (!hasLegacy) {
                    for (let j = 0; j < LEGACY_COMPRESSION_PARAMS.length; j++) {
                        hasLegacy = assets[i].get(`meta.compress.${LEGACY_COMPRESSION_PARAMS[j]}`);
                        if (hasLegacy) break;
                    }
                }

                const thisBasis = assets[i].get('meta.compress.basis');
                basisSelected = basisSelected || thisBasis;

                // PVR format only supports square power-of-two textures. If basis is selected then
                // we display a warning
                // NOTE: ideally the basis transcoder would optionally resize the compressed image to
                // be square POT, but this isn't currently possible.
                const thisWidth = assets[i].get('meta.width');
                const thisHeight = assets[i].get('meta.height');
                const thisPOT = ((thisWidth & (thisWidth - 1)) === 0) && ((thisHeight & (thisHeight - 1)) === 0);
                if (!showBasisPvrWarning) {
                    showBasisPvrWarning = thisBasis && (!thisPOT || thisWidth !== thisHeight);
                }
            }

            this._hasLegacy = hasLegacy;

            // enable/disable basis controls based on whether basis is enabled
            const basisUiDisabled = !writeAccess || !basisSelected;
            if (this._compressionBasisAttributesInspector) {
                this._compressionBasisAttributesInspector.getField('meta.compress.quality').disabled = basisUiDisabled;
                this._compressionBasisAttributesInspector.getField('meta.compress.normals').disabled = basisUiDisabled;
            }

            if (this._containerImportBasis) {
                this._containerImportBasis.disabled = basisUiDisabled;
            }

            if (this._compressionBasisPvrWarning) {
                this._compressionBasisPvrWarning.hidden = !showBasisPvrWarning;
            }

            fieldOriginal.value = displayExt;

            if (rgbm !== 1) {
                if (width > 0 && height > 0) {
                    // size available
                    if ((width & (width - 1)) === 0 && (height & (height - 1)) === 0) {
                        // pot
                        fieldDxt.disabled = false;
                    } else {
                        // non pot
                        fieldDxt.disabled = true;
                    }
                } else if (width === -1) {
                    // no size available
                    fieldDxt.disabled = true;
                } else if (width === -2) {
                    // various sizes
                    fieldDxt.disabled = false;
                }
            } else {
                fieldDxt.disabled = true;
            }

            fieldPvr.disabled = fieldPvrBpp.disabled = rgbm !== -2 && (fieldDxt.disabled || rgbm === 1);
            fieldEtc1.disabled = fieldPvr.disabled || (alpha === 1 && alphaValid !== 0);

            this._updatePvrWarning();
        }

        _handleAssetChangeCompression(path) {
            if (this._compressionChangeTicking ||
                (path !== 'task' &&
                ! path.startsWith('meta') &&
                ! path.startsWith('file') &&
                ! path.startsWith('data.rgbm') &&
                ! path.startsWith('data.mipmaps')))
                return;

            this._compressionChangeTicking = true;
            this._compressionChangeTimeout = setTimeout(() => {
                this._compressionChangeTicking = false;
                this._checkFormats();
                this._checkCompression();
                this._checkCompressAlpha();
                this._updateLegacy();
            }, 0);
        };

        _handleBtnCompressBasisClick() {
            this._handleCompress(['basis']);
            this._btnCompressBasis.disabled = true;
        }

        _handleBtnCompressLegacyClick() {
            const { basis, ...rest } = this._compressionFormats;
            this._handleCompress(Object.keys(rest));
            this._btnCompressLegacy.disabled = true;
        }

        _handleBtnGetMetaClick() {
            const assets = this._assets;

            if (! editor.call('permissions:write'))
                return;

            for(let i = 0; i < assets.length; i++) {
                if (assets[i].get('meta'))
                    continue;

                editor.call('realtime:send', 'pipeline', {
                    name: 'meta',
                    id: assets[i].get('uniqueId')
                });
            }
            this._btnGetMeta.enabled = false;
        }

        _handleCompress(formats) {
            const assets = this._assets;
            if (!Array.isArray(assets) || !assets.length) {
                return;
            };

            for(let i = 0; i < assets.length; i++) {
                if (! assets[i].get('file'))
                    continue;

                const variants = [ ];
                const toDelete = [ ];

                for(let format of formats) {
                    if (format === 'original')
                        continue;

                    if (checkCompressRequired(assets[i], format)) {
                        const width = assets[i].get('meta.width');
                        const height = assets[i].get('meta.height');

                        // no width/height
                        if (! width || ! height)
                            continue;

                        // non pot
                        if ((width & (width - 1)) !== 0 || (height & (height - 1)) !== 0)
                            continue;

                        let compress = assets[i].get('meta.compress.' + format);

                        if (assets[i].get('data.rgbm'))
                            compress = false;

                        if (compress && format === 'etc1') {
                            if (assets[i].get('meta.compress.alpha') && (assets[i].get('meta.alpha') || (assets[i].get('meta.type') || '').toLowerCase() === 'truecoloralpha'))
                                compress = false;
                        }

                        if (compress) {
                            variants.push(format);
                        } else {
                            toDelete.push(format);
                        }
                    }
                }

                if (toDelete.length) {
                    editor.call('realtime:send', 'pipeline', {
                        name: 'delete-variant',
                        data: {
                            asset: parseInt(assets[i].get('uniqueId'), 10),
                            options: {
                                formats: toDelete
                            }
                        }
                    });
                }

                if (variants.length) {
                    const task = {
                        asset: parseInt(assets[i].get('uniqueId'), 10),
                        options: {
                            formats: variants,
                            alpha: assets[i].get('meta.compress.alpha') && (assets[i].get('meta.alpha') || assets[i].get('meta.type').toLowerCase() === 'truecoloralpha'),
                            mipmaps: assets[i].get('data.mipmaps'),
                            normals: !!assets[i].get('meta.compress.normals')
                        }
                    };

                    if (variants.indexOf('pvr') !== -1)
                        task.options.pvrBpp = assets[i].get('meta.compress.pvrBpp');

                    if (variants.indexOf('basis') !== -1)
                        task.options.quality = assets[i].get('meta.compress.quality');

                    const sourceId = assets[i].get('source_asset_id');
                    if (sourceId) {
                        const sourceAsset = editor.call('assets:get', sourceId);
                        if (sourceAsset)
                            task.source = parseInt(sourceAsset.get('uniqueId'), 10);
                    }

                    editor.call('realtime:send', 'pipeline', {
                        name: 'compress',
                        data: task
                    });
                }
            }
        }

        _setupBasis() {
            if (!this._hasBasis) return;

            const BASIS_STORE_NAME = 'basis.js';
            const BASIS_WASM_FILENAME = 'basis';

            this._compressionLegacyAttributesInspector.getField('compress.legacy').parent.hidden = false;
            if (!editor.call('project:module:hasModule', BASIS_WASM_FILENAME)) {
                this._setupImportButton(this._compressionBasisContainer, BASIS_STORE_NAME, BASIS_WASM_FILENAME);
            }
        }

        _setupCompressionSubheads() {
            const legacy = this._compressionLegacyAttributesInspector.getField('compress.legacy').parent;
            legacy.class.add('pcui-inspector-subhead');
            legacy.hidden = true;
            if (this._compressionBasisAttributesInspector) {
                this._compressionBasisAttributesInspector.getField('meta.compress.basis').parent.class.add('pcui-inspector-subhead');
            }

        }

        _setupImportButton(panel, moduleStoreName, wasmFilename) {
            if (!this._containerImportBasis) {
                this._containerImportBasis = new pcui.Container({
                   flex: true,
                   flexDirection: 'row',
                   alignItems: 'center'
               });
               this._containerImportBasis.class.add('pcui-subpanel');

               this._labelImportBasis = new pcui.Label({
                   text: 'Basis Not Found'
               });
               this._containerImportBasis.append(this._labelImportBasis);

                this._btnImportBasis = new pcui.Button({
                    text: 'IMPORT BASIS',
                    icon: 'E228',
                    flexGrow: 1
                });
                this._btnImportBasis.on('click', () => {
                    editor.call('project:module:addModule', moduleStoreName, wasmFilename);
                });
                this._containerImportBasis.append(this._btnImportBasis);

                panel.appendAfter(this._containerImportBasis, this._compressionBasisAttributesInspector);
                this._containerImportBasis.disabled = true;

                const events = [];
                const handleModuleImported = name => {
                    if (name === moduleStoreName) {
                        this._containerImportBasis.hidden = true;
                    }
                }
                events.push(editor.on('onModuleImported', handleModuleImported));

                this._containerImportBasis.once('destroy', () => {
                    events.forEach(evt => evt.unbind());
                    events.length = 0;
                });
            } else {
                this._containerImportBasis.hidden = false;
            }
        }

        _setupFilteringTwoWayBinding() {
            const args = this._args;

            this._textureAttributesInspector.getField('filtering').binding = new pcui.BindingTwoWay({
                history: args.history,
                bindingElementToObservers: new MultiPathBindingElementToObservers({
                    formatters: {
                        'data.minfilter': v => `${v}_mip_${v}`
                    },
                    history: args.history,
                    historyName: 'assets.filtering',
                }),
                bindingObserversToElement: new pcui.BindingObserversToElement({
                    customUpdate: (element, observers, paths) => {
                        const getMergedValue = observer =>
                            paths.reduce((acc, path) => acc + observer.get(path), '');

                        let value = '';
                        let valueDifferent = false;
                        const firstMergedValue = getMergedValue(observers[0]);
                        for(let i = 1; i < observers.length; i++) {
                            if (firstMergedValue !== getMergedValue(observers[i])) {
                                valueDifferent = true;
                                break;
                            }
                        }

                        if (! valueDifferent) {
                            if (observers[0].get('data.minfilter') === 'linear_mip_linear' && observers[0].get('data.magfilter') === 'linear') {
                                value = 'linear';
                            } else if (observers[0].get('data.minfilter') === 'nearest_mip_nearest' && observers[0].get('data.magfilter') === 'nearest') {
                                value = 'nearest';
                            }
                        }

                        element.value = value;
                    },
                    history: args.history
                })
            })
        }

        _setupLegacy() {
            if (!this._hasBasis) return;
            const fieldLegacy = this._compressionLegacyAttributesInspector.getField('compress.legacy');
            var dirty = !this._btnCompressLegacy.disabled;
            this._showHideLegacyUi(this._hasLegacy || dirty);
            fieldLegacy.value = this._hasLegacy || dirty;
            fieldLegacy.disabled = this._hasLegacy || dirty;
            this._assetEvents.push(fieldLegacy.on('change', this._showHideLegacyUi));
        }

        _updateLegacy() {
            if (!this._hasBasis) return;
            const fieldLegacy = this._compressionLegacyAttributesInspector.getField('compress.legacy');
            var dirty = !this._btnCompressLegacy.disabled;
            fieldLegacy.disabled = this._hasLegacy || dirty;
        }

        _setupPanelReferences() {
            editor.call('attributes:reference:attach', 'asset:texture:asset', this._texturePanel._containerHeader);
            editor.call('attributes:reference:attach', 'asset:texture:compression', this._compressionPanel._containerHeader);
        }

        _setupPvrWarning() {
            const fieldPvr = this._compressionLegacyAttributesInspector.getField(`meta.compress.pvr`);
            const fieldPvrBpp = this._compressionLegacyAttributesInspector.getField(`meta.compress.pvrBpp`);

            this._pvrWarningLabel = new pcui.Label({
                text: 'Compressed texture will be resized square'
            });
            this._pvrWarningLabel.class.add('pcui-pvr-warning');
            this._pvrWarningLabel.hidden = true;

            fieldPvr.parent.parent.appendAfter(this._pvrWarningLabel, fieldPvrBpp.parent);
            this._assetEvents.push(fieldPvr.on('change', this._updatePvrWarning));
        }

        _setupSizeLabels() {
            const getCompressionField = format => {
                if (format === 'original')
                    return this._compressionLegacyAttributesInspector.getField('compress.original');


                if (this._hasBasis && format === 'basis')
                    return this._compressionBasisAttributesInspector.getField(`meta.compress.${format}`);

                return this._compressionLegacyAttributesInspector.getField(`meta.compress.${format}`);
            }

            for(let key in this._compressionFormats) {
                const field = getCompressionField(key)

                if (field) {
                    const sizeLabel = new SizeLabel({
                        format: this._compressionFormats[key]
                    });

                    this._compressionFormats[key].label = sizeLabel;

                    field.parent.append(sizeLabel);
                }
            }
        }

        _showHideLegacyUi(show) {
            this._compressionLegacyAttributesInspector.getField(`meta.compress.alpha`).parent.hidden = !show;
            this._compressionLegacyAttributesInspector.getField(`meta.compress.dxt`).parent.hidden = !show;
            this._compressionLegacyAttributesInspector.getField(`meta.compress.etc1`).parent.hidden = !show;
            this._compressionLegacyAttributesInspector.getField(`meta.compress.etc2`).parent.hidden = !show;
            this._compressionLegacyAttributesInspector.getField(`compress.original`).parent.hidden = !show;
            this._compressionLegacyAttributesInspector.getField(`meta.compress.pvr`).parent.hidden = !show;
            this._compressionLegacyAttributesInspector.getField(`meta.compress.pvrBpp`).parent.hidden = !show;
            this._btnCompressLegacy.hidden = !show;
        }

        _updatePvrWarning() {
            const assets = this._assets;
            const fieldPvr = this._compressionLegacyAttributesInspector.getField(`meta.compress.pvr`);

            // only show pvr warning if any selected texture is non-square and pvr is ticked
            let hidden = true;
            if (fieldPvr.value && !fieldPvr.disabled) {
                for (let i = 0; i < assets.length; i++) {
                    if (assets[i].get('meta.width') !== assets[i].get('meta.height')) {
                        hidden = false;
                        break;
                    }
                }
            }

            this._pvrWarningLabel.hidden = hidden;
        }

        link(assets) {
            this.unlink();
            this._assets = assets;

            this._textureAttributesInspector.link(assets);
            this._compressionLegacyAttributesInspector.link(assets);
            if (this._compressionBasisAttributesInspector) {
                this._compressionBasisAttributesInspector.link(assets);
            }

            this._setupBasis();

            // initial checks
            this._btnGetMetaVisibility();
            for(let key in this._compressionFormats) {
                if (key === 'basis' && !this._hasBasis)
                    continue;
                this._calculateSize(key);
            }
            this._checkFormats();
            this._checkCompression();
            this._checkCompressAlpha();

            // needs to be called after this._checkFormats to determine this._hasLegacy
            this._setupLegacy();

            // setup additional listeners
            this._assetEvents.push(editor.on('permissions:writeState', () => this._handleAssetChangeCompression('meta')));
            assets.forEach(asset => {
                // retriggers checkCompressAlpha, checkFormats, checkCompression
                this._assetEvents.push(asset.on('*:set', this._handleAssetChangeCompression));
                this._assetEvents.push(asset.on('*:unset', this._handleAssetChangeCompression));

                // show/hide Get Meta Button
                this._assetEvents.push(asset.on('meta:set', () => {
                    this._btnGetMetaVisibility();
                    // asset meta migration...
                    // this should probably eventually be moved to the pipline job
                    if (asset.get('meta') && ! asset.has('meta.compress')) {
                        setTimeout(() => {
                            const alpha = asset.get('meta.alpha') || (asset.get('meta.type').toLowerCase() || '') === 'truecoloralpha' || false;
                            asset.set('meta.compress', {
                                alpha: alpha,
                                normals: false,
                                dxt: false,
                                pvr: false,
                                pvrBpp: 4,
                                etc1: false,
                                etc2: false,
                                basis: false,
                                quality: 128
                            });
                        })
                    }
                }));
                this._assetEvents.push(asset.on('meta:unset', () => this._btnGetMeta.hidden = false ));

                // recalculate size
                for(let key in this._compressionFormats) {
                    if (key === 'basis' && !this._hasBasis)
                        continue;
                    this._assetEvents.push(asset.on(`file.variants.${key}.size:set`, () => this._queueSizeCalculate(key)));
                    this._assetEvents.push(asset.on(`file.variants.${key}.size:unset`, () => this._queueSizeCalculate(key)));
                    this._assetEvents.push(asset.on(`file.variants.${key}.sizeGzip:set`, () => this._queueSizeCalculate(key)));
                    this._assetEvents.push(asset.on(`file.variants.${key}.sizeGzip:unset`, () => this._queueSizeCalculate(key)));
                }
            });
        }

        unlink() {
            if (this._assets === null)
                return;

            this._textureAttributesInspector.unlink();
            this._compressionLegacyAttributesInspector.unlink();
            if (this._compressionBasisAttributesInspector) {
                this._compressionBasisAttributesInspector.unlink();
            }

            if (this._compressionChangeTimeout) {
                clearTimeout(this._compressionChangeTimeout);
            }
            this._compressionChangeTicking = false;

            this._assetEvents.forEach(e => e.unbind());
            this._assetEvents.length = 0;
            this._assets = null;
        }
    }

    return {
        TextureAssetInspector: TextureAssetInspector
    };
})());
