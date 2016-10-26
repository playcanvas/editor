editor.once('load', function() {
    'use strict';

    var panelsStates = { };
    var paidPlans = {
        2: true,
        3: true,
        4: true,
        5: true,
        6: true,
        7: true,
        8: true,
        9: true,
        10: true,
        11: true,
        12: true
    };

    editor.on('attributes:inspect[asset]', function(assets) {
        for(var i = 0; i < assets.length; i++) {
            if (assets[i].get('type') !== 'texture' || assets[i].get('source'))
                return;
        }

        var events = [ ];

        var ids = [ ];
        for(var i = 0; i < assets.length; i++)
            ids.push(assets[i].get('id'));
        ids = ids.sort(function(a, b) {
            return a - b;
        }).join(',');
        var panelState = panelsStates[ids];
        var panelStateNew = false;
        if (! panelState) {
            panelStateNew = true;
            panelState = panelsStates[ids] = { };

            panelState['texture'] = false;
            panelState['compression'] = false;
        }

        if (assets.length > 1)
            editor.call('attributes:header', assets.length + ' Textures');

        // properties panel
        var panel = editor.call('attributes:addPanel', {
            name: 'Texture',
            foldable: true,
            folded: panelState['texture']
        });
        panel.class.add('component');
        panel.on('fold', function() { panelState['texture'] = true; });
        panel.on('unfold', function() { panelState['texture'] = false; });
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:asset', panel, panel.headerElement);


        var btnGetMeta = new ui.Button({
            text: 'Calculate Meta'
        });
        btnGetMeta.class.add('calculate-meta', 'large-with-icon');
        var btnGetMetaVisibility = function() {
            var visible = false;
            for(var i = 0; i < assets.length; i++) {
                if (! visible && ! assets[i].get('meta'))
                    visible = true;
            }
            btnGetMeta.hidden = ! visible;
        };
        btnGetMeta.on('click', function() {
            if (! editor.call('permissions:write'))
                return;

            for(var i = 0; i < assets.length; i++) {
                if (assets[i].get('meta'))
                    continue;

                editor.call('realtime:send', 'pipeline', {
                    name: 'meta',
                    id: assets[i].get('id')
                });
            }
            this.enabled = false;
        });
        panel.append(btnGetMeta);

        btnGetMetaVisibility();
        for(var i = 0; i < assets.length; i++) {
            if (btnGetMeta.hidden && ! assets[i].get('meta'))
                btnGetMeta.hidden = false;

            events.push(assets[i].on('meta:set', function() {
                btnGetMetaVisibility();
            }));
            events.push(assets[i].on('meta:unset', function() {
                btnGetMeta.hidden = false;
            }));
        }


        // width
        var fieldWidth = editor.call('attributes:addField', {
            parent: panel,
            name: 'Width',
            link: assets,
            path: 'meta.width',
            placeholder: 'pixels'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:width', fieldWidth.parent.innerElement.firstChild.ui);

        // height
        var fieldHeight = editor.call('attributes:addField', {
            parent: panel,
            name: 'Height',
            link: assets,
            path: 'meta.height',
            placeholder: 'pixels'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:height', fieldHeight.parent.innerElement.firstChild.ui);

        // depth
        var fieldDepth = editor.call('attributes:addField', {
            parent: panel,
            name: 'Depth',
            link: assets,
            path: 'meta.depth',
            placeholder: 'bit'
        });
        var checkDepthField = function() {
            if (! fieldDepth.value)
                fieldDepth.element.innerHTML = 'unknown';
        };
        checkDepthField();
        fieldDepth.on('change', checkDepthField);
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:depth', fieldDepth.parent.innerElement.firstChild.ui);

        // rgbm
        var fieldRgbm = editor.call('attributes:addField', {
            parent: panel,
            name: 'Rgbm',
            link: assets,
            path: 'data.rgbm',
            type: 'checkbox'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:rgbm', fieldRgbm.parent.innerElement.firstChild.ui);

        // alpha
        var fieldAlpha = editor.call('attributes:addField', {
            parent: panel,
            name: 'Alpha',
            link: assets,
            path: 'meta.alpha'
        });
        var checkAlphaField = function() {
            if (! fieldAlpha.value)
                fieldAlpha.element.innerHTML = 'false';
        };
        checkAlphaField();
        fieldAlpha.on('change', checkAlphaField);
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:alpha', fieldAlpha.parent.innerElement.firstChild.ui);

        // interlaced
        var fieldInterlaced = editor.call('attributes:addField', {
            parent: panel,
            name: 'Interlaced',
            link: assets,
            path: 'meta.interlaced'
        });
        var checkInterlacedField = function() {
            if (! fieldInterlaced.value)
                fieldInterlaced.element.innerHTML = 'false';
        };
        checkInterlacedField();
        fieldInterlaced.on('change', checkInterlacedField);
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:interlaced', fieldInterlaced.parent.innerElement.firstChild.ui);


        // filtering
        var fieldFiltering = editor.call('attributes:addField', {
            parent: panel,
            name: 'Filtering',
            type: 'string',
            enum: {
                '': '...',
                'nearest': 'Point',
                'linear': 'Linear'
            }
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:filtering', fieldFiltering.parent.innerElement.firstChild.ui);

        var changingFiltering = false;

        var updateFiltering = function() {
            var value = '';
            var valueDifferent = false;
            var filter = assets[0].get('data.minfilter') + assets[0].get('data.magfilter');

            for(var i = 1; i < assets.length; i++) {
                if (filter !== (assets[i].get('data.minfilter') + assets[i].get('data.magfilter'))) {
                    valueDifferent = true;
                    break;
                }
            }

            if (! valueDifferent) {
                if (assets[0].get('data.minfilter') === 'linear_mip_linear' && assets[0].get('data.magfilter') === 'linear') {
                    value = 'linear';
                } else if (assets[0].get('data.minfilter') === 'nearest_mip_nearest' && assets[0].get('data.magfilter') === 'nearest') {
                    value = 'nearest';
                }
            }

            if (! valueDifferent && value) {
                fieldFiltering.optionElements[''].style.display = 'none';
            } else {
                fieldFiltering.optionElements[''].style.display = '';
            }

            changingFiltering = true;
            fieldFiltering.value = value;
            changingFiltering = false;
        };
        updateFiltering();

        fieldFiltering.on('change', function(value) {
            if (changingFiltering)
                return;

            var values = [ ];
            var valueMin = value + '_mip_' + value;
            var valueMag = value;

            changingFiltering = true;
            for(var i = 0; i < assets.length; i++) {
                values.push({
                    id: assets[i].get('id'),
                    valueMin: assets[i].get('data.minfilter'),
                    valueMag: assets[i].get('data.magfilter')
                });
                assets[i].history.enabled = false;
                assets[i].set('data.minfilter', valueMin);
                assets[i].set('data.magfilter', valueMag);
                assets[i].history.enabled = true;
            }
            changingFiltering = false;

            fieldFiltering.optionElements[''].style.display = 'none';

            // history
            editor.call('history:add', {
                name: 'assets.filtering',
                undo: function() {
                    for(var i = 0; i < values.length; i++) {
                        var asset = editor.call('assets:get', values[i].id);
                        if (! asset)
                            continue;

                        asset.history.enabled = false;
                        asset.set('data.minfilter', values[i].valueMin);
                        asset.set('data.magfilter', values[i].valueMag);
                        asset.history.enabled = true;
                    }
                },
                redo: function() {
                    for(var i = 0; i < values.length; i++) {
                        var asset = editor.call('assets:get', values[i].id);
                        if (! asset)
                            continue;

                        asset.history.enabled = false;
                        asset.set('data.minfilter', valueMin);
                        asset.set('data.magfilter', valueMag);
                        asset.history.enabled = true;
                    }
                }
            });
        });

        var eventsFiltering = [ ];
        var changingQueued = false;
        var changedFiltering = function() {
            if (changingQueued || changingFiltering)
                return;

            changingQueued = true;
            setTimeout(function() {
                changingQueued = false;
                updateFiltering();
            }, 0);
        };
        for(var i = 0; i < assets.length; i++) {
            eventsFiltering.push(assets[i].on('data.minfilter:set', changedFiltering));
            eventsFiltering.push(assets[i].on('data.magfilter:set', changedFiltering));
        }
        fieldFiltering.once('destroy', function() {
            for(var i = 0; i < eventsFiltering.length; i++) {
                eventsFiltering[i].unbind();
            }
        });



        // anisotropy
        var fieldAnisotropy = editor.call('attributes:addField', {
            parent: panel,
            name: 'Anisotropy',
            type: 'number',
            link: assets,
            path: 'data.anisotropy'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:anisotropy', fieldAnisotropy.parent.innerElement.firstChild.ui);



        // addressu
        var fieldAddressU = editor.call('attributes:addField', {
            parent: panel,
            name: 'Address U',
            type: 'string',
            enum: {
                '': '...',
                'repeat': 'Repeat',
                'clamp': 'Clamp',
                'mirror': 'Mirror Repeat'
            },
            link: assets,
            path: 'data.addressu'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:addressU', fieldAddressU.parent.innerElement.firstChild.ui);


        // addressv
        var fieldAddressV = editor.call('attributes:addField', {
            parent: panel,
            name: 'Address V',
            type: 'string',
            enum: {
                '': '...',
                'repeat': 'Repeat',
                'clamp': 'Clamp',
                'mirror': 'Mirror Repeat'
            },
            link: assets,
            path: 'data.addressv'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:addressV', fieldAddressV.parent.innerElement.firstChild.ui);


        var formats = {
            original: { size: 0, vram: 0 },
            dxt: { size: 0, vram: 0, timeout: false },
            pvr: { size: 0, vram: 0, timeout: false },
            etc1: { size: 0, vram: 0, timeout: false }
        };


        // compression panel
        var panelCompression = editor.call('attributes:addPanel', {
            name: 'Compression',
            foldable: true,
            folded: panelState['compression']
        });
        panelCompression.class.add('component', 'variants');
        panelCompression.on('fold', function() { panelState['compression'] = true; });
        panelCompression.on('unfold', function() { panelState['compression'] = false; });
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:compression', panelCompression, panelCompression.headerElement);

        if (! config.self.superUser && ! config.self.betaTester && ! paidPlans[config.self.plan.id])
            panelCompression.hidden = true;

        // compress alpha
        var fieldCompressAlpha = editor.call('attributes:addField', {
            parent: panelCompression,
            type: 'checkbox',
            name: 'Options',
            link: assets,
            path: 'meta.compress.alpha'
        });
        // label
        var labelCompressAlpha = new ui.Label({ text: 'Alpha' });
        labelCompressAlpha.style.verticalAlign = 'top';
        labelCompressAlpha.style.paddingRight = '12px';
        labelCompressAlpha.style.fontSize = '12px';
        labelCompressAlpha.style.lineHeight = '24px';
        fieldCompressAlpha.parent.append(labelCompressAlpha);

        var checkCompressAlpha = function() {
            var state = false;
            var different = false;
            for(var i = 0; i < assets.length; i++) {
                var alpha = assets[i].get('meta.alpha') || false;
                var trueColorAlpha = (assets[i].get('meta.type') || '').toLowerCase() === 'truecoloralpha';
                var rgbm = assets[i].get('data.rgbm');

                if (i === 0) {
                    state = (alpha || trueColorAlpha) && ! rgbm;
                } else if (state !== ((alpha || trueColorAlpha) && ! rgbm)) {
                    different = true;
                    break;
                }
            }

            fieldCompressAlpha.disabled = labelCompressAlpha.disabled = ! different && ! state;
        };
        checkCompressAlpha();

        // reference
        editor.call('attributes:reference:attach', 'asset:texture:compress:alpha', labelCompressAlpha);


        var originalExt = '';
        var labelSize = { };

        var calculateSize = function(format) {
            formats[format].size = 0;
            formats[format].vram = 0;

            for(var i = 0; i < assets.length; i++) {
                if (! assets[i].get('file'))
                    continue;

                var size = assets[i].get('file.variants.' + format + '.size') || 0;
                var sizeGzip = assets[i].get('file.variants.' + format + '.sizeGzip') || 0;

                if (size) formats[format].vram += size - 128;
                if (sizeGzip || size) formats[format].size += (sizeGzip || size) - 128;
            }
        };

        var calculateOriginalSize = function() {
            formats.original.size = 0;
            formats.original.vram = 0;

            for(var i = 0; i < assets.length; i++) {
                if (! assets[i].get('file'))
                    continue;

                var s = assets[i].get('file.size') || 0;
                if (s) {
                    formats.original.size += s;
                }

                var pixels = (assets[i].get('meta.width') || 0) * (assets[i].get('meta.height') || 0);

                formats.original.vram += pixels * 4;
            }
        };

        var queueSizeCalculate = function(format) {
            if (formats[format].timeout)
                return;

            formats[format].timeout = true;

            setTimeout(function() {
                formats[format].timeout = false;
                calculateSize(format);

                if (! formats[format].size && ! formats[format].vram) {
                    labelSize[format].text = '-';
                } else {
                    labelSize[format].text = bytesToHuman(formats[format].size) + ' [VRAM ' + bytesToHuman(formats[format].vram) + ']'
                }
            }, 0);
        };

        var checkFormats = function() {
            var width = -1;
            var height = -1;
            var rgbm = -1;
            var alpha = -1;
            var alphaValid = -1;

            for(var i = 0; i < assets.length; i++) {
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

                var alphaValidTmp = (assets[i].get('meta.alpha') || (assets[i].get('meta.type') || '').toLowerCase() === 'truecoloralpha') ? 1 : 0;
                if (alphaValid === -1) {
                    alphaValid = alphaValidTmp;
                } else if (alphaValid !== -2) {
                    if (alphaValid !== alphaValidTmp)
                        alphaValid = -2;
                }

                var ext = assets[i].get('file.url');
                ext = ext.slice(ext.lastIndexOf('.') + 1).toUpperCase();

                if (originalExt !== 'various' && originalExt && originalExt !== ext) {
                    originalExt = 'various';
                } else if (originalExt !== 'various') {
                    originalExt = ext;
                }
            }

            fieldOriginal.value = originalExt;

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
        };

        calculateOriginalSize();
        for(var key in formats) {
            if (key === 'original')
                continue;

            calculateSize(key);
        }

        // original
        var fieldOriginal = editor.call('attributes:addField', {
            parent: panelCompression,
            name: 'Original',
            value: originalExt
        });
        fieldOriginal.style.paddingLeft = '0px';
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:compress:original', fieldOriginal.parent.innerElement.firstChild.ui);

        // original sizes
        var labelOriginalSize = new ui.Label({
            text: bytesToHuman(formats.original.size) + ' [VRAM ' + bytesToHuman(formats.original.vram) + ']'
        });
        labelOriginalSize.class.add('size');
        fieldOriginal.parent.append(labelOriginalSize);


        // dxt
        var fieldDxt = editor.call('attributes:addField', {
            parent: panelCompression,
            type: 'checkbox',
            name: 'DXT',
            link: assets,
            path: 'meta.compress.dxt'
        });
        // label
        var labelDxtSize = labelSize['dxt'] = new ui.Label({
            text: bytesToHuman(formats.dxt.size) + ' [VRAM ' + bytesToHuman(formats.dxt.vram) + ']'
        });
        labelDxtSize.class.add('size');
        if (! formats.dxt.size && ! formats.dxt.vram) labelDxtSize.text = '-';
        fieldDxt.parent.append(labelDxtSize);
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:compress:dxt', fieldDxt.parent.innerElement.firstChild.ui);


        // pvr
        var fieldPvr = editor.call('attributes:addField', {
            parent: panelCompression,
            type: 'checkbox',
            name: 'PVR',
            link: assets,
            path: 'meta.compress.pvr'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:compress:pvr', fieldPvr.parent.innerElement.firstChild.ui);

        // pvrBpp
        var fieldPvrBpp = editor.call('attributes:addField', {
            panel: fieldPvr.parent,
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 2, t: '2 BPP' },
                { v: 4, t: '4 BPP' }
            ],
            link: assets,
            path: 'meta.compress.pvrBpp'
        });
        fieldPvrBpp.flexGrow = 0;
        fieldPvrBpp.style.width = '42px';
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:compress:pvrBpp', fieldPvrBpp);

        // label
        var labelPvrSize = labelSize['pvr'] = new ui.Label({
            text: bytesToHuman(formats.pvr.size) + ' [VRAM ' + bytesToHuman(formats.pvr.vram) + ']'
        });
        labelPvrSize.class.add('size');
        if (! formats.pvr.size && ! formats.pvr.vram) labelPvrSize.text = '-';
        fieldPvr.parent.append(labelPvrSize);


        // etc1
        var fieldEtc1 = editor.call('attributes:addField', {
            parent: panelCompression,
            type: 'checkbox',
            name: 'ETC1',
            link: assets,
            path: 'meta.compress.etc1'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:compress:etc1', fieldEtc1.parent.innerElement.firstChild.ui);

        // label
        var labelEtc1Size = labelSize['etc1'] = new ui.Label({
            text: bytesToHuman(formats.etc1.size) + ' [VRAM ' + bytesToHuman(formats.etc1.vram) + ']'
        });
        labelEtc1Size.class.add('size');
        if (! formats.etc1.size && ! formats.etc1.vram) labelEtc1Size.text = '-';
        fieldEtc1.parent.append(labelEtc1Size);


        checkFormats();

        var bindSizeCalculate = function(format) {
            for(var i = 0; i < assets.length; i++) {
                events.push(assets[i].on('file.variants.' + format + '.size:set', function() { queueSizeCalculate(format); }));
                events.push(assets[i].on('file.variants.' + format + '.size:unset', function() { queueSizeCalculate(format); }));
                events.push(assets[i].on('file.variants.' + format + '.sizeGzip:set', function() { queueSizeCalculate(format); }));
                events.push(assets[i].on('file.variants.' + format + '.sizeGzip:unset', function() { queueSizeCalculate(format); }));
            }
        };

        for(var key in formats) {
            if (key === 'original')
                continue;

            bindSizeCalculate(key);
        }


        var btnCompress = new ui.Button();
        btnCompress.text = 'Compress';
        btnCompress.class.add('compress-asset', 'large-with-icon');
        btnCompress.disabled = true;
        btnCompress.on('click', function() {
            for(var i = 0; i < assets.length; i++) {
                if (! assets[i].get('file'))
                    continue;

                var variants = [ ];
                var toDelete = [ ];

                for(var key in formats) {
                    if (key === 'original')
                        continue;

                    if (checkCompressRequired(assets[i], key)) {
                        var width = assets[i].get('meta.width');
                        var height = assets[i].get('meta.height');

                        // no width/height
                        if (! width || ! height)
                            continue;

                        // non pot
                        if ((width & (width - 1)) !== 0 || (height & (height - 1)) !== 0)
                            continue;

                        var compress = assets[i].get('meta.compress.' + key);

                        if (assets[i].get('data.rgbm'))
                            compress = false;

                        if (compress && key === 'etc1') {
                            if (assets[i].get('meta.compress.alpha') && (assets[i].get('meta.alpha') || (assets[i].get('meta.type') || '').toLowerCase() === 'truecoloralpha'))
                                compress = false;
                        }

                        if (compress) {
                            variants.push(key);
                        } else {
                            toDelete.push(key);
                        }
                    }
                }

                if (toDelete.length) {
                    editor.call('realtime:send', 'pipeline', {
                        name: 'delete-variant',
                        data: {
                            asset: parseInt(assets[i].get('id'), 10),
                            options: {
                                formats: toDelete
                            }
                        }
                    });
                }

                if (variants.length) {
                    var task = {
                        asset: parseInt(assets[i].get('id'), 10),
                        options: {
                            formats: variants,
                            alpha: assets[i].get('meta.compress.alpha') && (assets[i].get('meta.alpha') || assets[i].get('meta.type').toLowerCase() === 'truecoloralpha')
                        }
                    };

                    if (variants.indexOf('pvr') !== -1)
                        task.options.pvrBpp = assets[i].get('meta.compress.pvrBpp');

                    var sourceId = assets[i].get('source_asset_id');
                    if (sourceId) {
                        var sourceAsset = editor.call('assets:get', sourceId);
                        if (sourceAsset)
                            task.source = parseInt(sourceAsset.get('id'), 10);
                    }

                    editor.call('realtime:send', 'pipeline', {
                        name: 'compress',
                        data: task
                    });
                }
            }

            btnCompress.disabled = true;
        });
        panelCompression.append(btnCompress);

        var checkCompressRequired = function(asset, format) {
            if (! asset.get('file'))
                return false;

            var data = asset.get('file.variants.' + format);
            var rgbm = asset.get('data.rgbm');
            var alpha = asset.get('meta.compress.alpha') && (asset.get('meta.alpha') || ((asset.get('meta.type') || '').toLowerCase() === 'truecoloralpha')) || rgbm;
            var compress = asset.get('meta.compress.' + format);

            if (!! data !== compress) {
                if (format === 'etc1' && alpha)
                    return false;

                if (rgbm && ! data)
                    return false;

                return true;
            } else if (data && ((((data.opt & 1) != 0) != alpha))) {
                return true;
            }

            if (data && format === 'pvr') {
                var bpp = asset.get('meta.compress.pvrBpp');
                if (data && ((data.opt & 128) !== 0 ? 4 : 2) !== bpp)
                    return true;
            } else if (format === 'etc1') {
                if (data && alpha)
                    return true;

                if (! data && alpha)
                    return false;
            }

            return false;
        };

        var checkCompression = function() {
            var different = false;

            for(var i = 0; i < assets.length; i++) {
                if (! assets[i].get('file') || !! assets[i].get('task'))
                    continue;

                for(var key in formats) {
                    if (key === 'original')
                        continue;

                    if (checkCompressRequired(assets[i], key)) {
                        different = true;
                        break;
                    }
                }

                if (different)
                    break;
            }

            btnCompress.disabled = ! different;
        };
        var queueCheck = false;
        var onAssetChaneCompression = function(path) {
            if (queueCheck || (path !== 'task' && ! path.startsWith('meta') && ! path.startsWith('file') && ! path.startsWith('data.rgbm')))
                return;

            queueCheck = true;
            setTimeout(function() {
                queueCheck = false;
                checkFormats();
                checkCompression();
                checkCompressAlpha();
            }, 0);
        };
        for(var i = 0; i < assets.length; i++) {
            events.push(assets[i].on('*:set', onAssetChaneCompression));
            events.push(assets[i].on('*:unset', onAssetChaneCompression));
        }
        checkCompression();


        // preview
        if (assets.length === 1) {
            var root = editor.call('attributes.rootPanel');

            var reloadImage = function() {
                if (assets[0].get('has_thumbnail') && assets[0].get('thumbnails.xl') && assets[0].get('file.hash')) {
                    // image.src = config.url.home + assets[0].get('file.url') + '?t=' + assets[0].get('file.hash');
                    image.src = config.url.home + assets[0].get('thumbnails.xl') + '?t=' + assets[0].get('file.hash');
                    image.style.display = '';
                } else {
                    image.style.display = 'none';
                }
            };

            var image = new Image();
            image.onload = function() {
                root.class.add('animate');
            };
            reloadImage();

            image.addEventListener('click', function() {
                if (root.element.classList.contains('large')) {
                    root.element.classList.remove('large');
                } else {
                    root.element.classList.add('large');
                }
            }, false);

            image.classList.add('asset-preview');
            root.class.add('asset-preview');
            root.element.insertBefore(image, root.innerElement);

            var events = [ ];
            events.push(assets[0].on('file.hash:set', reloadImage));
            events.push(assets[0].on('has_thumbnail:set', reloadImage));
            events.push(assets[0].on('thumbnails.xl:set', reloadImage));

            panel.on('destroy', function() {
                for(var i = 0; i < events.length; i++)
                    events[i].unbind();
                image.parentNode.removeChild(image);
                root.class.remove('asset-preview', 'animate');
            });
        }

        panel.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });
});
