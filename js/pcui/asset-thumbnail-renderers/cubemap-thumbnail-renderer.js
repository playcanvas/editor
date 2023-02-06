Object.assign(pcui, (function () {
    const POSITIONS = [
        [30 / 64, 22 / 64],
        [0, 22 / 64],
        [15 / 64, 7 / 64],
        [15 / 64, 37 / 64],
        [15 / 64, 22 / 64],
        [45 / 64, 22 / 64]
    ];

    const GRID_SIZE = 15 / 64;

    class CubemapThumbnailRenderer {
        constructor(asset, canvas, assetsList) {
            this._asset = asset;
            this._assets = assetsList;
            this._canvas = canvas;

            this._images = [null, null, null, null, null, null];

            this._queueRenderHandler = this.queueRender.bind(this);
            this._onImageLoadHandler = this._onImageLoad.bind(this);

            this._watch = editor.call('assets:cubemap:watch', {
                asset: asset,
                autoLoad: true,
                callback: this._queueRenderHandler
            });

            this._queuedRender = false;
            this._frameRequest = null;
        }

        _onImageLoad() {
            // if the renderer is destroyed before the image is loaded
            // the canvas will be null so check here...
            if (!this._canvas) return;
            this.queueRender();
        }

        queueRender() {
            if (this._queuedRender) return;
            if (!this._asset) return;

            this._queuedRender = true;
            this._frameRequest = requestAnimationFrame(this.render.bind(this));
        }

        render() {
            this._queuedRender = false;

            if (!this._asset) return;

            const images = this._images;

            const ctx = this._canvas.getContext('2d');
            ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

            let width = this._canvas.width;
            let height = this._canvas.height;

            if (width > height) {
                width = height;
            } else {
                height = width;
            }


            for (let i = 0; i < 6; i++) {
                const id = this._asset.get('data.textures.' + i);
                let image = null;

                if (id) {
                    const texture = this._assets.get(id);
                    if (texture) {
                        const hash = texture.get('file.hash');
                        if (images[i] && images[i].hash === hash) {
                            image = images[i];
                        } else {
                            const url = texture.get('thumbnails.s');

                            if (images[i])
                                images[i].onload = null;

                            images[i] = null;

                            if (url) {
                                image = images[i] = new Image();
                                image.hash = hash;
                                image.onload = this._onImageLoadHandler;
                                image.src = url.appendQuery('t=' + hash);
                            }
                        }
                    } else if (images[i]) {
                        images[i].onload = null;
                        images[i] = null;
                    }
                } else if (images[i]) {
                    images[i].onload = null;
                    images[i] = null;
                }

                if (image) {
                    ctx.drawImage(image, POSITIONS[i][0] * width, POSITIONS[i][1] * height, width * GRID_SIZE, height * GRID_SIZE);
                } else {
                    ctx.beginPath();
                    ctx.rect(POSITIONS[i][0] * width, POSITIONS[i][1] * height, width * GRID_SIZE, height * GRID_SIZE);
                    ctx.fillStyle = '#000';
                    ctx.fill();
                }
            }
        }

        destroy() {
            if (this._watch) {
                editor.call('assets:cubemap:unwatch', this._asset, this._watch);
                this._watch = null;
            }

            if (this._frameRequest) {
                cancelAnimationFrame(this._frameRequest);
                this._frameRequest = null;
            }

            this._asset = null;
            this._assets = null;
            this._canvas = null;
            this._images = null;
        }
    }

    return {
        CubemapThumbnailRenderer: CubemapThumbnailRenderer
    };
})());
