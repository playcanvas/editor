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

        var onMinFilterChanged = function (value) {
            setMinMipFields(value);
        };

        asset.on('data.minfilter:set', onMinFilterChanged);

        paramsPanel.once('destroy', function () {
            asset.unbind('data.minfilter:set', onMinFilterChanged);
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

        var previewPanel = editor.call('attributes:addPanel', {
            name: 'Preview'
        });
        previewPanel.class.add('component', 'texture-preview', 'noSelect');

        // preview
        var image = editor.call('attributes:addField', {
            parent: previewPanel,
            type: 'image',
            src: config.url.home + '/' + asset.get('file.url')
        });

        image.style.backgroundImage = 'url("/editor/scene/img/asset-placeholder-texture.png")';
        image.style.backgroundRepeat = 'repeat';
        image.style.backgroundPosition = 'center center';
        image.style.margin = '0 auto';

        image.onload = function() {
            fieldDimensions.text = image.naturalWidth + ' x ' + image.naturalHeight;
        };
    });
});
