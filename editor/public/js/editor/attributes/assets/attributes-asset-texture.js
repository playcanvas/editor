editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'texture')
            return;

        var asset = assets[0];


        // properties panel
        var paramsPanel = editor.call('attributes:addPanel', {
            name: 'Properties'
        });
        paramsPanel.class.add('component');

        // dimensions
        var fieldDimensions = editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Dimensions',
            value: '...'
        });
        fieldDimensions.renderChanges = false;

        // minfilter
        var minFilterField = editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Min Filter',
            enum: {
                'nearest': 'Nearest',
                'linear': 'Linear'
            }
        });

        // mipfilter
        var mipFilterField = editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Mip Filter',
            enum: {
                'none': 'None',
                'nearest': 'Nearest',
                'linear': 'Linear'
            }
        });

        var suspendEvents = false;

        // convert minFilter value to min field and mip field values
        var setMinMipFields = function (minFilter) {
            suspendEvents = true;

            var parts = minFilter.split('_');
            if (parts.length === 1) {
                minFilterField.value = minFilter;
                mipFilterField.value = 'none';
            } else if (parts.length === 3) {
                minFilterField.value = parts[0];
                mipFilterField.value = parts[2];
            }

            suspendEvents = false;
        };

        minFilterField.on('change', function (value) {
            if (suspendEvents) return;

            var finalValue = mipFilterField.value === 'none' ? value : value + '_mip_' + mipFilterField.value;
            suspendEvents = true;
            asset.set('data.minfilter', finalValue);
            suspendEvents = false;
        });

        mipFilterField.on('change', function (value) {
            if (suspendEvents) return;

            var finalValue = value === 'none' ? minFilterField.value : minFilterField.value + '_mip_' + value;
            suspendEvents = true;
            asset.set('data.minfilter', finalValue);
            suspendEvents = false;
        });

        setMinMipFields(asset.get('data.minfilter'));

        var evtMinFilterChanged = asset.on('data.minfilter:set', function (value) {
            setMinMipFields(value);
        });

        paramsPanel.once('destroy', function () {
            evtMinFilterChanged.unbind();
        });

        // magfilter
        var magFilterField = editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Mag Filter',
            link: asset,
            path: 'data.magfilter',
            enum: {
                'nearest': 'Nearest',
                'linear': 'Linear'
            }
        });

        // addressu
        editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Address U',
            type: 'string',
            enum: {
                'repeat': 'Repeat',
                'clamp': 'Clamp',
                'mirror': 'Mirror Repeat'
            },
            link: asset,
            path: 'data.addressu'
        });

        // addressv
        editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Address V',
            type: 'string',
            enum: {
                'repeat': 'Repeat',
                'clamp': 'Clamp',
                'mirror': 'Mirror Repeat'
            },
            link: asset,
            path: 'data.addressv'
        });

        // anisotropy
        editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Anisotropy',
            type: 'number',
            link: asset,
            path: 'data.anisotropy'
        });

        var root = editor.call('attributes.rootPanel');

        // preview
        var image = new Image();
        // size
        image.onload = function() {
            fieldDimensions.text = image.naturalWidth + ' x ' + image.naturalHeight;
        };
        image.src = config.url.home + asset.get('file.url') + '?t=' + asset.get('modified_at');
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

        var evtImgUpdate = asset.on('file.hash:set', function(hash) {
            image.src = config.url.home + asset.get('file.url') + '?t=' + asset.get('modified_at');
        });
        paramsPanel.on('destroy', function() {
            scrollEvt.unbind();
            evtImgUpdate.unbind();
            image.parentNode.removeChild(image);
            root.class.remove('asset-preview');
            root.innerElement.style.marginTop = '';
        });
    });
});
