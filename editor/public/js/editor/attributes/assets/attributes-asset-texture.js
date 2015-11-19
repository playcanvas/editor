editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        for(var i = 0; i < assets.length; i++) {
            if (assets[i].get('type') !== 'texture' || assets[i].get('source'))
                return;
        }

        var events = [ ];

        if (assets.length > 1)
            editor.call('attributes:header', assets.length + ' Textures');

        // properties panel
        var paramsPanel = editor.call('attributes:addPanel', {
            name: 'Texture'
        });
        paramsPanel.class.add('component');
        // reference
        editor.call('attributes:reference:asset:texture:asset:attach', paramsPanel, paramsPanel.headerElement);

        // width
        var fieldWidth = editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Width',
            link: assets,
            path: 'meta.width',
            placeholder: 'pixels'
        });
        // reference
        editor.call('attributes:reference:asset:texture:width:attach', fieldWidth.parent.innerElement.firstChild.ui);

        // height
        var fieldHeight = editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Height',
            link: assets,
            path: 'meta.height',
            placeholder: 'pixels'
        });
        // reference
        editor.call('attributes:reference:asset:texture:height:attach', fieldHeight.parent.innerElement.firstChild.ui);

        // depth
        var fieldDepth = editor.call('attributes:addField', {
            parent: paramsPanel,
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
        editor.call('attributes:reference:asset:texture:depth:attach', fieldDepth.parent.innerElement.firstChild.ui);

        // rgbm
        var fieldRgbm = editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Rgbm',
            link: assets,
            path: 'data.rgbm'
        });
        var checkRgbmField = function() {
            if (! fieldRgbm.value)
                fieldRgbm.element.innerHTML = 'false';
        };
        checkRgbmField();
        fieldRgbm.on('change', checkRgbmField);
        // reference
        editor.call('attributes:reference:asset:texture:rgbm:attach', fieldRgbm.parent.innerElement.firstChild.ui);

        // alpha
        var fieldAlpha = editor.call('attributes:addField', {
            parent: paramsPanel,
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
        editor.call('attributes:reference:asset:texture:alpha:attach', fieldAlpha.parent.innerElement.firstChild.ui);

        // interlaced
        var fieldInterlaced = editor.call('attributes:addField', {
            parent: paramsPanel,
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
        editor.call('attributes:reference:asset:texture:interlaced:attach', fieldInterlaced.parent.innerElement.firstChild.ui);


        // filtering
        var fieldFiltering = editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Filtering',
            type: 'string',
            enum: {
                '': '...',
                'nearest': 'Point',
                'linear': 'Linear'
            }
        });
        // reference
        editor.call('attributes:reference:asset:texture:filtering:attach', fieldFiltering.parent.innerElement.firstChild.ui);

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
            parent: paramsPanel,
            name: 'Anisotropy',
            type: 'number',
            link: assets,
            path: 'data.anisotropy'
        });
        // reference
        editor.call('attributes:reference:asset:texture:anisotropy:attach', fieldAnisotropy.parent.innerElement.firstChild.ui);



        // addressu
        var fieldAddressU = editor.call('attributes:addField', {
            parent: paramsPanel,
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
        editor.call('attributes:reference:asset:texture:addressU:attach', fieldAddressU.parent.innerElement.firstChild.ui);


        // addressv
        var fieldAddressV = editor.call('attributes:addField', {
            parent: paramsPanel,
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
        editor.call('attributes:reference:asset:texture:addressV:attach', fieldAddressV.parent.innerElement.firstChild.ui);



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

            paramsPanel.on('destroy', function() {
                for(var i = 0; i < events.length; i++)
                    events[i].unbind();
                image.parentNode.removeChild(image);
                root.class.remove('asset-preview', 'animate');
            });
        }

        paramsPanel.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });
});
