(function() {
    'use strict';

    msg.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].type !== 'texture')
            return;

        var asset = assets[0];


        // properties panel
        var paramsPanel = msg.call('attributes:addPanel');

        // dimensions
        var fieldDimensions = msg.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Dimensions',
            value: '...'
        });

        // minfilter
        msg.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Min Filter',
            link: asset,
            path: 'data.minfilter'
        });

        // magfilter
        msg.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Mag Filter',
            link: asset,
            path: 'data.minfilter'
        });

        // addressu
        msg.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Address U',
            link: asset,
            path: 'data.addressu'
        });

        // addressv
        msg.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Address V',
            link: asset,
            path: 'data.addressv'
        });

        // anisotropy
        msg.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Anisotropy',
            type: 'number',
            link: asset,
            path: 'data.anisotropy'
        });

        var previewPanel = msg.call('attributes:addPanel', {
            parent: paramsPanel,
            name: 'Preview'
        });

        // preview
        var image = msg.call('attributes:addField', {
            parent: previewPanel,
            type: 'image',
            src: "http://playcanvas.dev/api/" + asset.file.url
        });

        image.style.backgroundImage = 'url("/editor/img/asset-placeholder-texture.png")';
        image.style.backgroundRepeat = 'repeat';
        image.style.margin = '0 auto';

        image.onload = function() {
            fieldDimensions.text = image.naturalWidth + ' x ' + image.naturalHeight;
        };
    });
})();
