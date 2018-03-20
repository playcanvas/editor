editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var cancelRender = function (width, height, canvas) {
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').clearRect(0, 0, width, height);
        return false;
    };

    editor.method('preview:sprite:render', function(asset, width, height, canvas, args) {
        var frameKeys = asset.get('data.frameKeys');
        if (! frameKeys || ! frameKeys.length) return cancelRender(width, height, canvas);

        var atlasId = asset.get('data.textureAtlasAsset');
        if (! atlasId) return cancelRender(width, height, canvas);

        var atlas = editor.call('assets:get', atlasId);
        if (! atlas) return cancelRender(width, height, canvas);

        var frames = atlas.get('data.frames');
        if (! frames) return cancelRender(width, height, canvas);

        var frame = frames[frameKeys[args && args.frame || 0]];
        if (! frame) return cancelRender(width, height, canvas);

        var ctx = canvas.getContext('2d');

        var engineAtlas = app.assets.get(atlasId);
        if (engineAtlas && engineAtlas.resource && engineAtlas.resource.texture) {
            var atlasTexture = engineAtlas.resource.texture;

            // find max dimensions in frames so that we render the entire sprite asset
            // with the same proportions
            var maxHeight = 0;
            var maxWidth = 0;
            var maxAspectRatio = 0;
            for (var i = 0, len = frameKeys.length; i<len; i++) {
                if (frames[frameKeys[i]]) {
                    var rect = frames[frameKeys[i]].rect;
                    maxWidth = Math.max(maxWidth, rect[2]);
                    maxHeight = Math.max(maxHeight, rect[3]);
                    maxAspectRatio = Math.max(maxAspectRatio, rect[2] / rect[3]);
                }
            }

            var x = frame.rect[0];
            // convert bottom left WebGL coord to top left pixel coord
            var y = atlasTexture.height - frame.rect[1] - frame.rect[3];
            var w = frame.rect[2];
            var h = frame.rect[3];

            // choose targetWidth and targetHeight keeping the aspect ratio
            var aspectRatio = w / h;
            var targetWidth, targetHeight, previewMaxWidth, previewMaxHeight;

            // make sure we never render anything higher than the available height
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

            var offsetX = (width - previewMaxWidth) / 2 + (previewMaxWidth - targetWidth) * frame.pivot[0];
            var offsetY = (height - previewMaxHeight) / 2 + (previewMaxHeight - targetHeight) * (1 - frame.pivot[1]);

            canvas.width = width;
            canvas.height = height;
            ctx.clearRect(0, 0, width, height);

            ctx.mozImageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;
            ctx.imageSmoothingEnabled = false;

            ctx.drawImage(atlasTexture.getSource(), x, y, w, h, offsetX, offsetY, targetWidth, targetHeight);

            return true;
        } else {
            return cancelRender(width, height, canvas);
        }
    });
});
