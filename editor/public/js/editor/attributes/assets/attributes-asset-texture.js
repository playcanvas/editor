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
        editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Min Filter',
            link: asset,
            path: 'data.minfilter'
        });

        // magfilter
        editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Mag Filter',
            link: asset,
            path: 'data.magfilter'
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
