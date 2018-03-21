editor.once('load', function () {
    'use strict';

    var centerPivot = [0.5, 0.5];

    // Renders a frame to the canvas taking into account the size of all the specified frames
    // to determine aspect ratio.
    // - frame: The frame index to render
    // - canvas: The canvas where the preview will be rendered
    // - allFrames: All the frames relevant to this render
    // - animating: If true then the frames pivot will be used otherwise everything will be rendered as if centered
    editor.method('picker:sprites:renderFramePreview', function (frame, canvas, allFrames, animating) {
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

        // choose targetWidth and targetHeight keeping the aspect ratio
        var targetWidth = width;
        var targetHeight = height;
        var offsetX = 0;
        var offsetY = 0;

        if (allFrames) {
            var maxHeight = 0;
            var maxWidth = 0;
            var leftBound = Number.POSITIVE_INFINITY;
            var rightBound = Number.NEGATIVE_INFINITY;
            var bottomBound = Number.POSITIVE_INFINITY;
            var topBound = Number.NEGATIVE_INFINITY;
            for (var i = 0, len = allFrames.length; i<len; i++) {
                var f = allFrames[i];
                if (! f) continue;

                if (f._data)
                    f = f._data;

                var pivot = animating ? f.pivot : centerPivot;

                var left = -f.rect[2] * pivot[0];
                var right = (1-pivot[0]) * f.rect[2];
                var bottom = -f.rect[3] * pivot[1];
                var top = (1 - pivot[1]) * f.rect[3];

                leftBound = Math.min(leftBound, left);
                rightBound = Math.max(rightBound, right);
                bottomBound = Math.min(bottomBound, bottom);
                topBound = Math.max(topBound, top);
            }

            maxWidth = rightBound - leftBound;
            maxHeight = topBound - bottomBound;

            var widthFactor = width;
            var heightFactor = height;

            var canvasRatio = width / height;
            var aspectRatio = maxWidth / maxHeight;

            // resize all frames based on aspect ratio of all frames
            // together
            if (canvasRatio > aspectRatio) {
                widthFactor = height * aspectRatio;
            } else {
                heightFactor = width / aspectRatio;
            }

            // calculate x and width
            var pivot = animating ? frame.pivot : centerPivot;
            var left = -frame.rect[2] * pivot[0];
            offsetX = widthFactor * (left - leftBound) / maxWidth;
            targetWidth = widthFactor * frame.rect[2] / maxWidth;

            // calculate y and height
            var top = (1 - pivot[1]) * frame.rect[3];
            offsetY = heightFactor * (1 - (top - bottomBound) / maxHeight);
            targetHeight = heightFactor * frame.rect[3] / maxHeight;

            // center it
            offsetX += (width - widthFactor) / 2;
            offsetY += (height - heightFactor) / 2;
        } else {
            var aspectRatio = w / h;

            if (aspectRatio >= 1) {
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
