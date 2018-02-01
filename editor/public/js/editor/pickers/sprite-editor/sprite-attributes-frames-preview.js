editor.once('load', function () {
    'use strict';

    editor.method('picker:sprites:attributes:frames:preview', function (args) {
        var parent = editor.call('picker:sprites:editor:rightPanel');

        var atlasAsset = args.atlasAsset;
        var atlasImage = args.atlasImage;
        var frames = args.frames;

        var frameObservers = frames.map(function (f) {return atlasAsset.getRaw('data.frames.' + f);});

        var events = [];

        var previewContainer = document.createElement('div');
        previewContainer.classList.add('asset-preview-container');

        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 256;
        canvas.classList.add('asset-preview');
        previewContainer.append(canvas);

        canvas.addEventListener('click', function() {
            if (parent.class.contains('large')) {
                parent.class.remove('large');
            } else {
                parent.class.add('large');
            }
            queueRender();
        }, false);

        parent.class.add('asset-preview');
        parent.element.insertBefore(previewContainer, parent.innerElement);

        var panelControls = new ui.Panel();
        panelControls.class.add('preview-controls');
        previewContainer.appendChild(panelControls.element);

        var time = 0;
        var playing = true;
        var fps = 10;
        var frame = 0;
        var lastTime = Date.now();

        // var btnPlay = new ui.Button({
        //     text: '&#57649;'
        // });
        // panelControls.append(btnPlay);

        // btnPlay.on('click', function() {
        //     playing = !playing;

        //     if (playing) {
        //         lastTime = Date.now();
        //         btnPlay.class.add('active', 'pinned');
        //     } else {
        //         btnPlay.class.remove('active', 'pinned');
        //     }

        //     queueRender();
        // });

        var renderQueued;

        // queue up the rendering to prevent too oftern renders
        var queueRender = function() {
            if (renderQueued) return;
            renderQueued = true;
            requestAnimationFrame(renderPreview);
        };

        var renderPreview = function () {
            if (! previewContainer) return;

            if (renderQueued)
                renderQueued = false;

            if (playing) {
                var now = Date.now();
                time += (now - lastTime) / 1000;

                frame = Math.floor(time * fps);
                var numFrames = frames.length;
                if (frame >= numFrames) {
                    frame = 0;
                    time -= numFrames / fps;
                }

                lastTime = now;
            }

            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            // render
            editor.call('picker:sprites:editor:renderFramePreview', frameObservers[frame]._data, canvas, frameObservers);

            if (playing) {
                queueRender();
            }
        };
        renderPreview();


        // render on resize
        events.push(parent.on('resize', queueRender));

        events.push(parent.on('clear', function () {
            parent.class.remove('asset-preview', 'animate');

            previewContainer.parentElement.removeChild(previewContainer);
            previewContainer = null;

            playing = false;

            panelControls.destroy();

            for (var i = 0, len = events.length; i<len; i++) {
                events[i].unbind();
            }
            events.length = 0;
        }));
    });
});
