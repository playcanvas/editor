editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var centerPivot = [0.5, 0.5];

    var cancelRender = function (width, height, canvas) {
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').clearRect(0, 0, width, height);
        return false;
    };


    // ImageCache holds Image objects
    // cached with some key (asset.id)
    var ImageCache = function () {
        this._items = {};
    };

    // return true if key exists
    ImageCache.prototype.has = function (key) {
        return !!this._items[key];
    };

    // return the ImageCacheEntry at key
    ImageCache.prototype.get = function (key) {
        if (this.has(key)) return this._items[key];
        return null;
    };

    // Insert an Image element into the cache
    // Returns the new ImageCacheEntry
    ImageCache.prototype.insert = function (key, image) {
        var entry = new ImageCacheEntry(image);
        this._items[key] = entry;

        return entry;
    };

    // ImageCacheEntry
    // an item in the ImageCache
    // fires 'loaded' event if the Image element loads after being created
    var ImageCacheEntry = function (image) {
        Events.call(this);

        this.value = image;
        this.status = 'loading';

        var self = this;
        image.onload = function () {
            self.status = 'loaded';
            self.emit('loaded', self);
        };
    };
    ImageCacheEntry.prototype = Object.create(Events.prototype);


    // Cache for holding Image elements used by compressed textures
    var imageCache = new ImageCache();

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

        var animating = args && args.animating;

        var ctx = canvas.getContext('2d');

        var engineAtlas = app.assets.get(atlasId);
        if (engineAtlas && engineAtlas.resource && engineAtlas.resource.texture) {
            var atlasTexture = engineAtlas.resource.texture;

            var leftBound = Number.POSITIVE_INFINITY;
            var rightBound = Number.NEGATIVE_INFINITY;
            var bottomBound = Number.POSITIVE_INFINITY;
            var topBound = Number.NEGATIVE_INFINITY;

            for (var i = 0, len = frameKeys.length; i<len; i++) {
                var f = frames[frameKeys[i]];
                if (! f) continue;

                var pivot = animating ? f.pivot : centerPivot;
                var rect = f.rect;

                var left = -rect[2] * pivot[0];
                var right = (1-pivot[0]) * rect[2];
                var bottom = -rect[3] * pivot[1];
                var top = (1 - pivot[1]) * rect[3];

                leftBound = Math.min(leftBound, left);
                rightBound = Math.max(rightBound, right);
                bottomBound = Math.min(bottomBound, bottom);
                topBound = Math.max(topBound, top);
            }

            var maxWidth = rightBound - leftBound;
            var maxHeight = topBound - bottomBound;

            var x = frame.rect[0];
            // convert bottom left WebGL coord to top left pixel coord
            var y = atlasTexture.height - frame.rect[1] - frame.rect[3];
            var w = frame.rect[2];
            var h = frame.rect[3];

            var canvasRatio = width / height;
            var aspectRatio = maxWidth / maxHeight;

            var widthFactor = width;
            var heightFactor = height;

            if (canvasRatio > aspectRatio) {
                widthFactor = height * aspectRatio;
            } else {
                heightFactor = width / aspectRatio;
            }

            // calculate x and width
            var pivot = animating ? frame.pivot : centerPivot;
            var left = -frame.rect[2] * pivot[0];
            var offsetX = widthFactor * (left - leftBound) / maxWidth;
            var targetWidth = widthFactor * frame.rect[2] / maxWidth;

            // calculate y and height
            var top = (1 - pivot[1]) * frame.rect[3];
            var offsetY = heightFactor * (1 - (top - bottomBound) / maxHeight);
            var targetHeight = heightFactor * frame.rect[3] / maxHeight;

            // center it
            offsetX += (width - widthFactor) / 2;
            offsetY += (height - heightFactor) / 2;

            canvas.width = width;
            canvas.height = height;
            ctx.clearRect(0, 0, width, height);

            ctx.mozImageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;
            ctx.imageSmoothingEnabled = false;

            var img;
            if (atlasTexture._compressed) {
                var entry = imageCache.get(engineAtlas.id);
                if (entry) {
                    if (entry.status === 'loaded') {
                        img = entry.value;
                    } else {
                        entry.once('loaded', function (entry) {
                            editor.call('assets:sprite:watch:trigger', asset);
                        });
                    }

                } else {

                    // create an image element from the asset source file
                    // used in the preview if the texture contains compressed data
                    img = new Image();
                    img.src = asset.file.url;

                    // insert image into cache which fires an event when the image is loaded
                    var entry = imageCache.insert(engineAtlas.id, img);
                    entry.once('loaded', function (entry) {
                        editor.call('assets:sprite:watch:trigger', asset);
                    });
                }
            } else {
                img = atlasTexture.getSource();
            }

            if (img) {
                ctx.drawImage(img, x, y, w, h, offsetX, offsetY, targetWidth, targetHeight);
            } else {
                cancelRender(width, height, canvas);
            }

            return true;
        } else {
            return cancelRender(width, height, canvas);
        }
    });
});
