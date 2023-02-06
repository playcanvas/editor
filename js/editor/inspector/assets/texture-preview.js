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

            this._preview.style.backgroundImage = `url("${previewUrl}")`;
        }

        link(assets) {
            this.unlink();
            super.link();
            this._assets = assets;

            if (assets && Array.isArray(assets) && assets.length) {
                this._assetEvents.push(assets[0].on('file.hash:set', this._updatePreview));
                this._assetEvents.push(assets[0].on('file.url:set', this._updatePreview));
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
