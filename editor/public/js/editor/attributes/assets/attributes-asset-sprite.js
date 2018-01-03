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

            var currentFrame = 0;

            var btnNextFrame = new ui.Button({
                text: '&#57649;'
            });
            previewContainer.appendChild(btnNextFrame.element);
            btnNextFrame.parent = panelProperties;

            btnNextFrame.on('click', function() {
                var frames = assets[0].get('data.frameKeys');
                if (! frames) return;

                currentFrame++;
                if (currentFrame >= frames.length)
                    currentFrame = 0;

                renderPreview();
            });

            var renderQueued;

            var renderPreview = function () {
                if (renderQueued)
                    renderQueued = false;

                // render
                editor.call('preview:render', assets[0], root.element.clientWidth, preview, {
                    frame: currentFrame
                });
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

            var spriteWatch = editor.call('assets:sprite:watch', {
                asset: assets[0],
                callback: queueRender
            });

            panelProperties.once('destroy', function() {
                root.class.remove('asset-preview', 'animate');

                evtPanelResize.unbind();
                evtSceneSettings.unbind();

                if (previewContainer.parentNode)
                    previewContainer.parentNode.removeChild(previewContainer);

                editor.call('assets:sprite:unwatch', assets[0], spriteWatch);

                panelProperties = null;
            });
        }

        panelProperties.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });
});
