editor.once('load', function () {
    'use strict';

    // Renders a frame to the canvas taking into account the size of all the specified frames
    // to determine aspect ratio
    editor.method('picker:sprites:renderFramePreview', function (frame, canvas, allFrames) {
        var ctx = canvas.getContext('2d');
        var width = canvas.width;
        var height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        if (! frame || ! frame.pivot || ! frame.rect) {
            return;
        }

        var atlasImage = editor.call('picker:sprites:atlasImage');
        if (! atlasImage) return;

        var x = frame.rect[0];
        // convert bottom left WebGL coord to top left pixel coord
        var y = atlasImage.height - frame.rect[1] - frame.rect[3];
        var w = frame.rect[2];
        var h = frame.rect[3];

        var aspectRatio = w / h;

        // choose targetWidth and targetHeight keeping the aspect ratio
        var targetWidth = width;
        var targetHeight = height;
        var offsetX = 0;
        var offsetY = 0;

        if (allFrames) {
            var maxHeight = 0;
            var maxWidth = 0;
            var maxAspectRatio = 0;
            for (var i = 0, len = allFrames.length; i<len; i++) {
                var f = allFrames[i];
                if (! f) continue;

                if (f._data)
                    f = f._data;

                maxWidth = Math.max(maxWidth, f.rect[2]);
                maxHeight = Math.max(maxHeight, f.rect[3]);
                maxAspectRatio = Math.max(maxAspectRatio, f.rect[2] / f.rect[3]);
            }

            var previewMaxWidth, previewMaxHeight;

            if (width / maxAspectRatio > height || maxWidth < maxHeight) {
                targetHeight = height * h / maxHeight;
                targetWidth = targetHeight * aspectRatio;

                previewMaxHeight = height;
                previewMaxWidth = Math.min(height * maxWidth / maxHeight, width);
            } else {
                targetWidth = width * w / maxWidth;
                targetHeight = targetWidth / aspectRatio;

                previewMaxWidth = width;
                previewMaxHeight = Math.min(width / (maxWidth / maxHeight), height);
            }

            offsetX = (width - previewMaxWidth) / 2 + (previewMaxWidth - targetWidth) * frame.pivot[0];
            offsetY = (height - previewMaxHeight) / 2 + (previewMaxHeight - targetHeight) * (1 - frame.pivot[1]);

        } else {
            if (w >= h) {
                targetHeight = width / aspectRatio;
            } else {
                targetWidth = height * aspectRatio;
            }

            offsetX = (width - targetWidth) / 2;
            offsetY = (height - targetHeight) / 2;
        }


        // disable smoothing
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(atlasImage, x, y, w, h, offsetX, offsetY, targetWidth, targetHeight);
    });

});
