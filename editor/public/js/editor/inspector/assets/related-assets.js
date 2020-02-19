Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-related-assets';
    const CLASS_RELATED_ASSET = CLASS_ROOT + '-related-asset';

    const DOM = () => [
        {
            relatedAssetsPanel: new pcui.Panel({ flex: true, headerText: 'RELATED ASSETS' })
        }
    ];

    class RelatedAssetsInspector extends pcui.Container {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);

            this._args = args;
            this._relatedAssets = null;
            this._assetEvents = [];

            this.buildDom(DOM());
        }

        _loadRelatedAssets(sourceAsset) {
            const relatedAssets = this._args.assets.data.filter(
                asset => asset.get('source_asset_id') == sourceAsset.get('id')
            );
            this._relatedAssets = [];
            relatedAssets.forEach(asset => {
                const relatedAssetLabel = new pcui.Label({
                    text: asset.get('name'),
                    class: [CLASS_RELATED_ASSET, `asset-type-${asset.get('type')}`]
                });
                this._assetEvents.push(relatedAssetLabel.on('click', () => this._onClickRelatedAsset(asset.get('id'))));
                this._relatedAssetsPanel.append(relatedAssetLabel);
                this._relatedAssets.push(relatedAssetLabel);
            });
        }

        _removeRelatedAssets() {
            this._relatedAssets.forEach(assetLabel => {
                this._relatedAssetsPanel.remove(assetLabel);
            });
        }

        _onClickRelatedAsset(assetId) {
            const asset = editor.call('assets:get', assetId);
            if (! asset)
                return;
            editor.call('selector:set', 'asset', [asset]);
        }

        link(assets) {
            this.unlink();
            this._loadRelatedAssets(assets[0]);
        }

        unlink() {
            if (!this._relatedAssets) return;
            this._removeRelatedAssets();
            this._assetEvents.forEach(evt => evt.unbind());
            this._assetEvents = [];
        }
    }

    return {
        RelatedAssetsInspector: RelatedAssetsInspector
    };
})());
