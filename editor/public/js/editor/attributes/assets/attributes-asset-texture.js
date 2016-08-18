editor.once('load', function() {
    'use strict';

    var panelsStates = { };

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
            dxt: { size: 0, vram: 0, timeout: false }
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
                var formatAvailable = false;

                for(key in formats) {
                    if (key === 'original')
                        continue;

                    if (assets[i].get('meta.compress.' + key)) {
                        formatAvailable = true;
                        break;
                    }
                }

                if (i === 0) {
                    state = (alpha || trueColorAlpha) && formatAvailable;
                } else if (state !== ((alpha || trueColorAlpha) && formatAvailable)) {
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

        for(var i = 0; i < assets.length; i++) {
            if (! assets[i].get('file'))
                continue;

            var ext = assets[i].get('file.url');
            ext = ext.slice(ext.lastIndexOf('.') + 1).toUpperCase();

            if (originalExt !== 'various' && originalExt && originalExt !== ext) {
                originalExt = 'various';
            } else {
                originalExt = ext;
            }
        }

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


        // disable dxt for non pot textures
        if (fieldWidth.value && fieldHeight.value && (fieldWidth.value & (fieldWidth.value - 1)) === 0 && (fieldHeight.value & (fieldHeight.value - 1)) === 0) {
            fieldDxt.disabled = false;
        } else {
            fieldDxt.disabled = true;
        }

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

                for(var key in formats) {
                    if (key === 'original')
                        continue;

                    if (checkCompressRequired(assets[i], key)) {
                        var task = {
                            asset: {
                                id: parseInt(assets[i].get('id'), 10),
                                type: assets[i].get('type'),
                                filename: assets[i].get('file.filename'),
                                scope: assets[i].get('scope'),
                                user_id: assets[i].get('user_id'),
                                region: assets[i].get('region'),
                                meta: assets[i].get('meta')
                            },
                            options: {
                                format: key
                            }
                        };

                        if (assets[i].get('meta.compress.' + key)) {
                            task.options.alpha = assets[i].get('meta.compress.alpha') && (assets[i].get('meta.alpha') || assets[i].get('meta.type').toLowerCase() === 'truecoloralpha');

                            var sourceId = assets[i].get('source_asset_id');
                            if (sourceId) {
                                var sourceAsset = editor.call('assets:get', sourceId);

                                task.source = {
                                    id: parseInt(sourceAsset.get('id'), 10),
                                    type: sourceAsset.get('type'),
                                    filename: sourceAsset.get('file.filename'),
                                    scope: sourceAsset.get('scope'),
                                    user_id: sourceAsset.get('user_id'),
                                    region: sourceAsset.get('region'),
                                    meta: sourceAsset.get('meta')
                                }
                            }

                            editor.call('realtime:send', 'pipeline', {
                                name: 'compress',
                                data: task
                            });
                        } else {
                            editor.call('realtime:send', 'pipeline', {
                                name: 'delete-variant',
                                data: task
                            });
                        }
                    }
                }
            }

            btnCompress.disabled = true;
        });
        panelCompression.append(btnCompress);

        var checkCompressRequired = function(asset, format) {
            if (! asset.get('file'))
                return false;

            var data = asset.get('file.variants.' + format);
            var alpha = asset.get('meta.compress.alpha') && (asset.get('meta.alpha') || ((asset.get('meta.type') || '').toLowerCase() === 'truecoloralpha'));
            var compress = asset.get('meta.compress.' + format);

            if (!! data !== compress) {
                return true;
            } else if (data && ((((data.opt & 1) != 0) != alpha))) {
                return true;
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
        var onAssetChaneCompression = function(path) {
            if (path !== 'task' && ! path.startsWith('meta.compress') && ! path.startsWith('file'))
                return;

            checkCompression();
            checkCompressAlpha();
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
