Object.assign(pcui, (function () {
    const getPreviewUrl = (asset) => {
        const url = asset.get('file.url');
        const hash = asset.get('file.hash');
        if (!config || !config.url || !config.url.home || !url || !hash)
            return null;

        return config.url.home + asset.get('file.url').appendQuery('t=' + asset.get('file.hash'));
    };

    class TextureAssetInspectorPreview extends pcui.AssetInspectorPreviewBase {
        constructor(args) {
            super(args);
            this._assets = null;
            this._assetEvents = [];

            this._preview = document.createElement('div');
            this._preview.classList.add('pcui-texture-asset-preview');
            this.append(this._preview);

            this._updatePreview = this._updatePreview.bind(this);
        }

        _updatePreview() {
            const assets = this._assets;
            if (!assets || !Array.isArray(assets) || !assets.length)
                return;

            const previewUrl = getPreviewUrl(assets[0]);
            if (!previewUrl)
                return;

            if (assets[0].get('data.rgbm')) {
                const image = new Image();
                image.src = previewUrl;
                image.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = image.width;
                    canvas.height = image.height;

                    const context = canvas.getContext('2d');
                    context.globalCompositeOperation = 'copy';
                    context.drawImage(image, 0, 0);

                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    const numPixels = canvas.width * canvas.height;

                    // decode RGBM in-place
                    for (let i = 0; i < numPixels; ++i) {
                        const a = data[i * 4 + 3] / 255 * 8;
                        data[i * 4 + 0] = Math.min(255, data[i * 4 + 0] * a);
                        data[i * 4 + 1] = Math.min(255, data[i * 4 + 1] * a);
                        data[i * 4 + 2] = Math.min(255, data[i * 4 + 2] * a);
                        data[i * 4 + 3] = 255;
                    }

                    context.putImageData(imageData, 0, 0);

                    const decodedImage = new Image();
                    decodedImage.src = canvas.toDataURL();
                    this._preview.style.backgroundImage = `url("${decodedImage.src}")`;
                };
            } else {
                this._preview.style.backgroundImage = `url("${previewUrl}")`;
            }
        }

        link(assets) {
            this.unlink();
            super.link();
            this._assets = assets;

            if (assets && Array.isArray(assets) && assets.length) {
                this._assetEvents.push(assets[0].on('file.hash:set', this._updatePreview));
                this._assetEvents.push(assets[0].on('file.url:set', this._updatePreview));
                this._assetEvents.push(assets[0].on('data.rgbm:set', this._updatePreview));
            }

            this._updatePreview();
        }

        unlink() {
            super.unlink();

            this._assetEvents.forEach(e => e.unbind());
            this._assetEvents.length = 0;
            this._assets = null;
        }
    }

    return {
        TextureAssetInspectorPreview: TextureAssetInspectorPreview
    };
})());
