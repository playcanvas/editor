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
            label: "Anisotropy",
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
            type: "boolean",
            reference: null
        },
        {
            label: "Normals",
            path: "meta.compress.normals",
            type: "boolean"
        },
        {
            label: "Mode",
            path: "meta.compress.compressionMode",
            type: "select",
            args: {
                type: "string",
                options: [
                    { v: "etc", t: "ETC (smaller size, lower quality)" },
                    { v: "astc", t: "ASTC (larger size, higher quality)" }
                ]
            }
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
            alias: 'compress.legacy',
            reference: null
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

    const DOM = (parent) => [
        {
            root: {
                texturePanel: new pcui.Panel({
                    headerText: 'TEXTURE',
                    collapsible: true
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
                                flexGrow: 1
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
                    collapsible: true
                })
            },
            children: [
                {
                    recompressWarning: new pcui.InfoBox({
                        icon: 'E218',
                        title: 'Warning',
                        text: 'This texture must be recompressed due to a non-backwards compatible engine change. This texture will appear upside down if it isn\'t recompressed.'
                    })
                },
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
                                title: 'Texture dimensions are not square and power of two',
                                text: 'On devices that only support PVR compression, Basis will transcode this texture to 565 uncompressed format. <strong><a href="https://developer.playcanvas.com/en/user-manual/assets/textures/texture-compression/#basis-limitations" target="_blank">Read more</a></strong>',
                                unsafe: true
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
                }, {
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
                                        text: 'COMPRESS LEGACY',
                                        flexGrow: 1,
                                        class: CLASS_COMPRESS_BUTTON
                                    })
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ];


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
                historyPostfix: this._historyPostfix,
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
            this.text = (!format.size && !format.vram)
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
            this._handleAssetChangeWebGl1PotWarnings = this._handleAssetChangeWebGl1PotWarnings.bind(this);
            this._showHideLegacyUi = this._showHideLegacyUi.bind(this);
            this._updatePvrWarning = this._updatePvrWarning.bind(this);
            this._updateWebGl1PowerOfTwoWarnings = this._updateWebGl1PowerOfTwoWarnings.bind(this);

            this.buildDom(DOM(this));
            this._setupCompressionSubheads();
            this._setupFilteringTwoWayBinding();
            this._setupPanelReferences();
            this._setupSizeLabels();
            this._setupPvrWarning();
            this._btnGetMeta.on('click', this._handleBtnGetMetaClick);

            this._btnCompressBasis.on('click', this._handleBtnCompressBasisClick);
            this._btnCompressBasis.disabled = true;

            this._btnCompressLegacy.on('click', this._handleBtnCompressLegacyClick);
            this._btnCompressLegacy.disabled = true;

            // Add WebGL1 warnings below the relevant settings in the inspector
            this._webgl1NonPotWithMipmapsWarning = new pcui.InfoBox({
                icon: 'E218',
                title: 'Texture dimensions are not power of two (POT) and Mipmaps are enabled',
                text: 'Only WebGL2 supports mipmap generation on non power of two textures in width and height. (E.g. 256 x 256, 512 x 1024). Visit <strong><a href="https://caniuse.com/webgl2" target="_blank">can I use webgl2</a></strong> to see current browser support. Expect browsers that only support WebGL1 to render differently. Please use textures with dimensions of POT wherever possible for best compatibility.',
                unsafe: true
            });

            const mipmapsField = this._textureAttributesInspector.getField('data.mipmaps');
            mipmapsField.parent.parent.appendAfter(this._webgl1NonPotWithMipmapsWarning.dom, mipmapsField.parent.dom);

            this._webgl1NonPotWithoutAddressClampWarning = new pcui.InfoBox({
                icon: 'E218',
                title: 'Texture dimensions are not power of two (POT) and Address UV are not clamped',
                text: 'Only WebGL2 supports Address UV modes \'Repeat\' or \'Mirror Repeat\' on non power of two textures in width and height. (E.g. 256 x 256, 512 x 1024). Visit <strong><a href="https://caniuse.com/webgl2" target="_blank">can I use webgl2</a></strong> to see current browser support. Expect browsers that only support WebGL1 to render differently. Please use textures with dimensions of POT wherever possible for best compatibility.',
                unsafe: true
            });

            const addressVField = this._textureAttributesInspector.getField('data.addressv');
            addressVField.parent.parent.appendAfter(this._webgl1NonPotWithoutAddressClampWarning.dom, addressVField.parent.dom);
        }

        _btnGetMetaVisibility() {
            const assets = this._assets;

            let visible = false;
            for (let i = 0; i < assets.length; i++) {
                if (!visible && !assets[i].get('meta')) {
                    visible = true;
                    break;
                }
            }
            this._btnGetMeta.hidden = !visible;
        }

        _calculateSize(format) {
            const assets = this._assets;
            const formats = this._compressionFormats;

            formats[format].size = 0;
            formats[format].vram = 0;
            for (let i = 0; i < assets.length; i++) {
                if (!assets[i].get('file') || !assets[i].get('meta'))
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
                        const alpha = assets[i].get('meta.alpha');
                        const pixelFormat = alpha ? pc.PIXELFORMAT_DXT5 : pc.PIXELFORMAT_DXT1;
                        const mipmaps = assets[i].get('data.mipmaps');
                        const depth = 1;
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

        _checkCompression() {
            const assets = this._assets;
            if (!editor.call('permissions:write') || !Array.isArray(assets) || !assets.length) {
                this._btnCompressBasis.disabled = true;
                this._btnCompressLegacy.disabled = true;
                return;
            };

            let differentBasis = false;
            let differentLegacy = false;
            for (let i = 0; i < assets.length; i++) {
                if (!assets[i].get('file') || !!assets[i].get('task'))
                    continue;

                for (let key in this._compressionFormats) {
                    if (key === 'original')
                        continue;

                    if (pcui.TextureCompressor.determineRequiredProcessing(assets[i], key, false) !== 'none') {
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

            this._btnCompressBasis.disabled = !differentBasis;
            this._btnCompressLegacy.disabled = !differentLegacy;
        }

        // set the enable state of the compression format checkboxes based on the selected textures
        _checkFormats() {
            const assets = this._assets;
            const writeAccess = editor.call('permissions:write');

            let hasAlpha = -1;
            let selectedAlpha = false;
            let displayExt = '';
            let showBasisPvrWarning = false;

            const compressionFormats = ['dxt', 'pvr', 'etc1', 'etc2', 'basis'];
            const allowed = {};
            const selected = {};

            for (let i = 0; i < assets.length; i++) {
                const asset = assets[i];

                if (!asset.get('file'))
                    continue;

                const hasAlphaTmp = pcui.TextureCompressor.hasAlpha(asset) ? 1 : 0;
                if (hasAlpha === -1) {
                    hasAlpha = hasAlphaTmp;
                } else if (hasAlpha !== -2) {
                    if (hasAlpha !== hasAlphaTmp)
                    hasAlpha = -2;
                }

                selectedAlpha = selectedAlpha || asset.get('meta.compress.alpha');

                if (displayExt !== 'various') {
                    let ext = asset.get('file.url');
                    ext = ext.slice(ext.lastIndexOf('.') + 1).toUpperCase();
                    ext = ext.split('?')[0];
                    displayExt = displayExt && displayExt !== ext ? 'various' : ext;
                }

                // update allowed and selected flags
                compressionFormats.forEach((format) => {
                    allowed[format] = allowed[format] || pcui.TextureCompressor.isCompressAllowed(asset, format);
                    selected[format] = selected[format] || asset.get(`meta.compress.${format}`);
                });

                // PVR format only supports square power-of-two textures. If basis is selected then
                // we display a warning
                // NOTE: ideally the basis transcoder would optionally resize the compressed image to
                // be square POT, but this isn't currently possible.
                if (!showBasisPvrWarning && asset.get('meta.compress.basis')) {
                    const thisWidth = asset.get('meta.width');
                    const thisHeight = asset.get('meta.height');
                    showBasisPvrWarning = (!pcui.TextureCompressor.isPOT(thisWidth, thisHeight) || thisWidth !== thisHeight);
                }
            }

            this._hasLegacy = selected.dxt || selected.pvr || selected.etc1 || selected.etc2 || false;

            // enable/disable basis controls based on whether basis is enabled
            const basisUiDisabled = !writeAccess || !selected.basis;
            if (this._compressionBasisAttributesInspector) {
                this._compressionBasisAttributesInspector.getField('meta.compress.normals').disabled = basisUiDisabled;
                this._compressionBasisAttributesInspector.getField('meta.compress.compressionMode').disabled = basisUiDisabled;
                this._compressionBasisAttributesInspector.getField('meta.compress.quality').disabled = basisUiDisabled;
            }

            if (this._containerImportBasis) {
                this._containerImportBasis.disabled = basisUiDisabled;
            }

            if (this._compressionBasisPvrWarning) {
                this._compressionBasisPvrWarning.hidden = !showBasisPvrWarning;
            }

            // update enable state of compression format selector
            // we enable the compression option if any one of the selected textures are allowed
            // to be compressed
            const alphaField = this._compressionLegacyAttributesInspector.getField('meta.compress.alpha');
            const fieldOriginal = this._compressionLegacyAttributesInspector.getField(`compress.original`);
            const fieldDxt = this._compressionLegacyAttributesInspector.getField(`meta.compress.dxt`);
            const fieldPvr = this._compressionLegacyAttributesInspector.getField(`meta.compress.pvr`);
            const fieldPvrBpp = this._compressionLegacyAttributesInspector.getField(`meta.compress.pvrBpp`);
            const fieldEtc1 = this._compressionLegacyAttributesInspector.getField(`meta.compress.etc1`);
            const fieldEtc2 = this._compressionLegacyAttributesInspector.getField(`meta.compress.etc2`);

            alphaField.disabled = (hasAlpha === 0) && !selectedAlpha;
            fieldOriginal.value = displayExt;
            fieldDxt.disabled = !allowed.dxt && !selected.dxt;
            fieldPvr.disabled = fieldPvrBpp.disabled = !allowed.pvr && !selected.pvr;
            fieldEtc1.disabled = !allowed.etc1 && !selected.etc1;
            fieldEtc2.disabled = !allowed.etc2 && !selected.etc2;

            this._updatePvrWarning();
        }

        _handleAssetChangeCompression(path) {
            if (this._compressionChangeTicking ||
                (path !== 'task' &&
                    !path.startsWith('meta') &&
                    !path.startsWith('file') &&
                    !path.startsWith('data.rgbm') &&
                    !path.startsWith('data.mipmaps')))
                return;

            this._compressionChangeTicking = true;
            this._compressionChangeTimeout = setTimeout(() => {
                this._compressionChangeTicking = false;
                this._checkFormats();
                this._checkCompression();
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

            if (!editor.call('permissions:write'))
                return;

            for (let i = 0; i < assets.length; i++) {
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

            pcui.TextureCompressor.compress(assets, formats);
        }

        _handleAssetChangeWebGl1PotWarnings(path) {
            if (path !== 'task' &&
                !path.startsWith('meta.width') &&
                !path.startsWith('meta.height') &&
                !path.startsWith('file') &&
                !path.startsWith('data.addressu') &&
                !path.startsWith('data.addressv') &&
                !path.startsWith('data.mipmaps'))
                return;

            this._updateWebGl1PowerOfTwoWarnings();
        }

        _setupBasis() {
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
                };
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
                    historyName: 'assets.filtering'
                }),
                bindingObserversToElement: new pcui.BindingObserversToElement({
                    customUpdate: (element, observers, paths) => {
                        const getMergedValue = observer =>
                            paths.reduce((acc, path) => acc + observer.get(path), '');

                        let value = '';
                        let valueDifferent = false;
                        const firstMergedValue = getMergedValue(observers[0]);
                        for (let i = 1; i < observers.length; i++) {
                            if (firstMergedValue !== getMergedValue(observers[i])) {
                                valueDifferent = true;
                                break;
                            }
                        }

                        if (!valueDifferent) {
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
            });
        }

        _setupLegacy() {
            const fieldLegacy = this._compressionLegacyAttributesInspector.getField('compress.legacy');
            var dirty = !this._btnCompressLegacy.disabled;
            this._showHideLegacyUi(this._hasLegacy || dirty);
            fieldLegacy.value = this._hasLegacy || dirty;
            fieldLegacy.disabled = this._hasLegacy || dirty;
            this._assetEvents.push(fieldLegacy.on('change', this._showHideLegacyUi));
        }

        _updateLegacy() {
            const fieldLegacy = this._compressionLegacyAttributesInspector.getField('compress.legacy');
            var dirty = !this._btnCompressLegacy.disabled;
            fieldLegacy.disabled = this._hasLegacy || dirty;
        }

        _setupPanelReferences() {
            let ref = editor.call('attributes:reference:get', 'asset:texture:asset');
            if (ref) {
                (new pcui.TooltipReference({
                    reference: ref
                })).attach({
                    target: this._texturePanel.header
                });
            }

            ref = editor.call('attributes:reference:get', 'asset:texture:compression');
            if (ref) {
                (new pcui.TooltipReference({
                    reference: ref
                })).attach({
                    target: this._compressionPanel.header
                });
            }
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


                if (format === 'basis')
                    return this._compressionBasisAttributesInspector.getField(`meta.compress.${format}`);

                return this._compressionLegacyAttributesInspector.getField(`meta.compress.${format}`);
            };

            for (let key in this._compressionFormats) {
                const field = getCompressionField(key);

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

        _updateWebGl1PowerOfTwoWarnings() {
            this._webgl1NonPotWithoutAddressClampWarning.hidden = true;
            this._webgl1NonPotWithMipmapsWarning.hidden = true;

            const assets = this._assets;
            // Show the warnings if any of the assets have an issue

            for (let i = 0; i < assets.length; i++) {
                let asset = assets[i];
                if (!pcui.TextureCompressor.isPOT(asset.get('meta.width'), asset.get('meta.height'))) {
                    if (asset.get('data.mipmaps')) {
                        this._webgl1NonPotWithMipmapsWarning.hidden = false;
                        break;
                    }
                }
            }

            for (let i = 0; i < assets.length; i++) {
                let asset = assets[i];
                if (!pcui.TextureCompressor.isPOT(asset.get('meta.width'), asset.get('meta.height'))) {
                    if (asset.get('data.addressu') !== 'clamp' || asset.get('data.addressv') !== 'clamp') {
                        this._webgl1NonPotWithoutAddressClampWarning.hidden = false;
                        break;
                    }
                }
            }
        }

        link(assets) {
            this.unlink();
            this._assets = assets;

            this._textureAttributesInspector.link(assets);
            this._compressionLegacyAttributesInspector.link(assets);
            if (this._compressionBasisAttributesInspector) {
                this._compressionBasisAttributesInspector.link(assets);
            }

            if (editor.call('users:hasFlag', 'hasRecompressFlippedTextures')) {
                if (assets.length > 1) {
                    this._recompressWarning.hidden = true;
                } else {
                    const variants = [...LEGACY_COMPRESSION_PARAMS, 'basis'];
                    let hideWarning = true;
                    variants.forEach(variant => {
                        if (!hideWarning) return;
                        if (assets[0].has(`file.variants.${variant}`) && !assets[0].get(`file.variants.${variant}.noFlip`)) {
                            hideWarning = false;
                        }
                    });

                    this._recompressWarning.hidden = hideWarning;
                }
            } else {
                this._recompressWarning.hidden = true;
            }

            this._setupBasis();

            // initial checks
            this._btnGetMetaVisibility();
            for (let key in this._compressionFormats) {
                this._calculateSize(key);
            }
            this._checkFormats();
            this._checkCompression();
            this._updateWebGl1PowerOfTwoWarnings();

            // needs to be called after this._checkFormats to determine this._hasLegacy
            this._setupLegacy();

            // setup additional listeners
            this._assetEvents.push(editor.on('permissions:writeState', () => this._handleAssetChangeCompression('meta')));
            assets.forEach(asset => {
                // retriggers checkCompressAlpha, checkFormats, checkCompression
                this._assetEvents.push(asset.on('*:set', this._handleAssetChangeCompression));
                this._assetEvents.push(asset.on('*:unset', this._handleAssetChangeCompression));

                this._assetEvents.push(asset.on('*:set', this._handleAssetChangeWebGl1PotWarnings));

                // show/hide Get Meta Button
                this._assetEvents.push(asset.on('meta:set', () => {
                    this._btnGetMetaVisibility();
                    // asset meta migration...
                    // this should probably eventually be moved to the pipline job
                    if (asset.get('meta') && !asset.has('meta.compress')) {
                        setTimeout(() => {
                            asset.set('meta.compress', {
                                alpha: pcui.TextureCompressor.hasAlpha(asset),
                                normals: false,
                                dxt: false,
                                pvr: false,
                                pvrBpp: 4,
                                etc1: false,
                                etc2: false,
                                basis: false,
                                quality: 128
                            });
                        });
                    }
                }));
                this._assetEvents.push(asset.on('meta:unset', () => this._btnGetMeta.hidden = false));

                // recalculate size
                for (let key in this._compressionFormats) {
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
