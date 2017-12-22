editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        var root = editor.call('attributes.rootPanel');

        for(var i = 0; i < assets.length; i++) {
            if (assets[i].get('type') !== 'sprite')
                return;
        }

        var events = [ ];

        if (assets.length > 1)
            editor.call('attributes:header', assets.length + ' Sprites');

        // Properties
        var panelProperties = editor.call('attributes:addPanel', {
            name: "Sprite"
        });
        panelProperties.class.add('component');

        var fieldPixelsPerUnit = editor.call('attributes:addField', {
            parent: panelProperties,
            name: 'Pixels Per Unit',
            type: 'number',
            min: 1,
            link: assets,
            path: 'data.pixelsPerUnit'
        });

        // reference
        editor.call('attributes:reference:attach', 'asset:sprite:pixelsPerUnit', fieldPixelsPerUnit.parent.innerElement.firstChild.ui);

        var fieldAtlas = editor.call('attributes:addField', {
            parent: panelProperties,
            name: 'Texture Atlas',
            type: 'asset',
            kind: 'textureatlas',
            link: assets,
            path: 'data.textureAtlasAsset'
        });

        // reference
        editor.call('attributes:reference:attach', 'asset:sprite:textureAtlasAsset', fieldAtlas._label);


        // preview
        if (assets.length === 1) {
            var previewContainer = document.createElement('div');
            previewContainer.classList.add('asset-preview-container');

            var preview = document.createElement('canvas');
            var ctx = preview.getContext('2d');
            preview.width = 256;
            preview.height = 256;
            preview.classList.add('asset-preview');
            preview.classList.add('flipY');
            previewContainer.appendChild(preview);

            preview.addEventListener('click', function() {
                if (root.element.classList.contains('large')) {
                    root.element.classList.remove('large');
                } else {
                    root.element.classList.add('large');
                }
            }, false);

            root.class.add('asset-preview');
            root.element.insertBefore(previewContainer, root.innerElement);

            var renderQueued;

            var renderPreview = function () {
                if (renderQueued)
                    renderQueued = false;

                // render
                var imageData = editor.call('preview:render', assets[0], root.element.clientWidth, root.element.clientWidth, {});
                if (! imageData) return;

                preview.width = imageData.width;
                preview.height = imageData.height;

                ctx.putImageData(imageData, 0, 0);
            };
            renderPreview();

            // queue up the rendering to prevent too oftern renders
            var queueRender = function() {
                if (renderQueued) return;
                renderQueued = true;
                requestAnimationFrame(renderPreview);
            };

            // render on resize
            var evtPanelResize = root.on('resize', queueRender);
            var evtSceneSettings = editor.on('preview:scene:changed', queueRender);

            var renderTimeout;

            panelProperties.once('destroy', function() {
                root.class.remove('asset-preview', 'animate');

                evtPanelResize.unbind();
                evtSceneSettings.unbind();

                if (previewContainer.parentNode)
                    previewContainer.parentNode.removeChild(previewContainer);

                panelProperties = null;
            });
        }

        panelProperties.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });
});
