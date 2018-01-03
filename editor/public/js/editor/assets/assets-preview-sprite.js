editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    editor.method('preview:sprite:render', function(asset, canvas, args) {
        var width = canvas.width;
        var height = canvas.height;

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
        ctx.clearRect(0, 0, width, height);

        var hash = atlas.get('file.hash');
        var url = atlas.get('file.url');
        if (url) {
            var image = new Image();
            image.onload = function () {
                var atlasWidth = atlas.get('meta.width');
                var atlasHeight = atlas.get('meta.height');
                var x = frame.rect[0] * atlasWidth;
                var y = frame.rect[1] * atlasHeight;
                var w = frame.rect[2] * atlasWidth;
                var h = frame.rect[3] * atlasHeight;

                ctx.drawImage(image, x, y, w, h, 0, 0, width, height);
            };
            image.src = url + '?t=' + hash;
        } else {
            return false;
        }
    });
});
