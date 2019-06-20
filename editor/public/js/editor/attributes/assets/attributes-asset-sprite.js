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

        var fieldRenderMode = editor.call('attributes:addField', {
            parent: panelProperties,
            name: 'Render Mode',
            type: 'number',
            enum: [
                {v:0, t: 'Simple'},
                {v:1, t:'Sliced'},
                {v:2, t:'Tiled'}
            ],
            link: assets,
            path: 'data.renderMode'
        });

        // reference
        editor.call('attributes:reference:attach', 'asset:sprite:renderMode', fieldRenderMode.parent.innerElement.firstChild.ui);

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
            var previewContainer = new pcui.Container();
            previewContainer.class.add('asset-preview-container');

            var preview = document.createElement('canvas');
            var ctx = preview.getContext('2d');
            preview.width = 256;
            preview.height = 256;
            preview.classList.add('asset-preview');
            previewContainer.append(preview);

            preview.addEventListener('click', function() {
                if (root.class.contains('large')) {
                    root.class.remove('large');
                } else {
                    root.class.add('large');
                }
                queueRender();
            }, false);

            root.class.add('asset-preview');
            root.prepend(previewContainer);

            var time = 0;
            var playing = false;
            var fps = 10;
            var frame = 0;
            var lastTime = Date.now();

            var btnPlay = new ui.Button({
                text: '&#57649;'
            });
            previewContainer.append(btnPlay.element);
            btnPlay.parent = panelProperties;

            btnPlay.on('click', function() {
                playing = !playing;

                if (playing) {
                    lastTime = Date.now();
                    btnPlay.class.add('active', 'pinned');
                } else {
                    btnPlay.class.remove('active', 'pinned');
                }

                queueRender();
            });

            var renderQueued;

            var renderPreview = function () {
                if (renderQueued)
                    renderQueued = false;

                if (playing) {
                    var now = Date.now();
                    time += (now - lastTime) / 1000;

                    frame = Math.floor(time * fps);
                    var numFrames = assets[0].get('data.frameKeys').length;
                    if (frame >= numFrames) {
                        frame = 0;
                        time -= numFrames / fps;
                    }

                    lastTime = now;
                }

                // render
                editor.call('preview:render', assets[0], previewContainer.width, previewContainer.height, preview, {
                    frame: frame,
                    animating: true
                });

                if (playing) {
                    queueRender();
                }
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

            var spriteWatch = editor.call('assets:sprite:watch', {
                asset: assets[0],
                callback: queueRender
            });

            panelProperties.once('destroy', function() {
                root.class.remove('asset-preview', 'animate');

                evtPanelResize.unbind();

                editor.call('assets:sprite:unwatch', assets[0], spriteWatch);

                panelProperties = null;

                playing = false;
            });
        }

        panelProperties.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });
});
