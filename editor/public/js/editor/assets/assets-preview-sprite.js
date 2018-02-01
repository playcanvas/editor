editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    editor.method('preview:sprite:render', function(asset, width, height, canvas, args) {
        var frameKeys = asset.get('data.frameKeys');
        if (! frameKeys || ! frameKeys.length) return;

        var atlasId = asset.get('data.textureAtlasAsset');
        if (! atlasId) return;

        var atlas = editor.call('assets:get', atlasId);
        if (! atlas) return;

        var frames = atlas.get('data.frames');
        if (! frames) return;

        var frame = frames[frameKeys[args && args.frame || 0]];
        if (! frame) return;

        var ctx = canvas.getContext('2d');

        var engineAtlas = app.assets.get(atlasId);
        if (engineAtlas && engineAtlas.resource && engineAtlas.resource.texture) {
            var atlasTexture = engineAtlas.resource.texture;
            var atlasWidth = atlasTexture.width;
            var atlasHeight = atlasTexture.height;

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
                    maxAspectRatio = Math.max(maxAspectRatio, rect[2] * atlasWidth / (rect[3] * atlasHeight));
                }
            }
            maxWidth *= atlasWidth;
            maxHeight *= atlasHeight;

            var x = frame.rect[0] * atlasWidth;
            // convert bottom left WebGL coord to top left pixel coord
            var y = (1 - frame.rect[1] - frame.rect[3]) * atlasHeight;
            var w = frame.rect[2] * atlasWidth;
            var h = frame.rect[3] * atlasHeight;

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
            ctx.drawImage(atlasTexture.getSource(), x, y, w, h, offsetX, offsetY, targetWidth, targetHeight);

            return true;
        } else {
            canvas.width = width;
            canvas.height = height;
            ctx.clearRect(0, 0, width, height);

            return false;
        }
    });
});
