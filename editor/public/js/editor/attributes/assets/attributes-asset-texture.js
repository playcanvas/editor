editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        // if (assets.length !== 1 || assets[0].get('type') !== 'texture')
        //     return;

        for(var i = 0; i < assets.length; i++) {
            if (assets[i].get('type') !== 'texture')
                return;
        }

        // properties panel
        var paramsPanel = editor.call('attributes:addPanel', {
            name: 'Texture'
        });
        paramsPanel.class.add('component');
        // reference
        editor.call('attributes:reference:asset:texture:asset:attach', paramsPanel, paramsPanel.headerElement);



        // dimensions
        if (assets.length === 1) {
            var fieldDimensions = editor.call('attributes:addField', {
                parent: paramsPanel,
                name: 'Dimensions',
                value: '...'
            });
            fieldDimensions.renderChanges = false;
            // reference
            editor.call('attributes:reference:asset:texture:dimensions:attach', fieldDimensions.parent.innerElement.firstChild.ui);
        }



        // hdr
        var fieldHdr = editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'HDR',
            value: assets[0].get('data.rgbm') ? 'yes' : 'no'
        });
        if (assets.length > 1) {
            var hdr = assets[0].get('data.rgbm');
            for(var i = 1; i < assets.length; i++) {
                if (hdr !== assets[i].get('data.rgbm')) {
                    hdr = 'various';
                    break;
                }
            }
            fieldHdr.value = hdr;
        }



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
            var image = new Image();
            // size
            image.onload = function() {
                fieldDimensions.text = image.naturalWidth + ' x ' + image.naturalHeight;
            };
            image.src = config.url.home + (assets[0].get('thumbnails.xl') || assets[0].get('file.url')) + '?t=' + assets[0].get('modified_at');

            image.classList.add('asset-preview');
            root.class.add('asset-preview');
            root.element.insertBefore(image, root.innerElement);
            var scrolledFully = false;
            var scrollHeightLast = -1;
            var scrollEvt = root.on('scroll', function(evt) {
                var scrollBudget = root.innerElement.scrollHeight - (root.element.clientHeight - 32 - 320);
                var scrollHeight = 128 - Math.max(0, 320 - scrollBudget);

                if (root.innerElement.scrollTop > scrollHeight) {
                    if (! scrolledFully) {
                        scrolledFully = true;
                        scrollHeightLast = -1;

                        root.innerElement.style.marginTop = '50%';
                        image.style.width = 'calc(50% - 16px)';
                        image.style.paddingLeft = '25%';
                        image.style.paddingRight = '25%';
                    }
                } else {
                    scrolledFully = false;

                    var p = 100 - Math.floor((root.innerElement.scrollTop / scrollHeight) * 50);

                    if (p === scrollHeightLast) return;
                    scrollHeightLast = p;

                    root.innerElement.style.marginTop = p + '%';
                    image.style.width = 'calc(' + p + '% - 16px)';
                    image.style.paddingLeft = ((100 - p) / 2) + '%';
                    image.style.paddingRight = ((100 - p) / 2) + '%';
                }
            });

            var evtImgUpdate = assets[0].on('file.hash:set', function(hash) {
                image.src = config.url.home + assets[0].get('file.url') + '?t=' + assets[0].get('modified_at');
            });

            paramsPanel.on('destroy', function() {
                scrollEvt.unbind();
                evtImgUpdate.unbind();
                image.parentNode.removeChild(image);
                root.class.remove('asset-preview');
                root.innerElement.style.marginTop = '';
            });
        }
    });
});
