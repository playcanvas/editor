Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'container-asset-inspector';
    const CLASS_ASSET = CLASS_ROOT + '-asset';

    const DOM = args => [{
        relatedAssetsInspector: new pcui.RelatedAssetsInspector({
            assets: args.assets,
            relatedFn: (asset, sourceAssetId) => {
                return asset.get('type') === 'render' && asset.get('data.containerAsset') === sourceAssetId ||
                       asset.get('type') === 'template' && asset.get('meta.containerAsset') === sourceAssetId;
            }
        })
    }];

    class ContainerAssetInspector extends pcui.Container {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);
            this.class.add(CLASS_ROOT);
            this.class.add(CLASS_ASSET);

            this.buildDom(DOM(args));
        }

        link(assets) {
            this.unlink();
            this._relatedAssetsInspector.link(assets);
        }

        unlink() {
            this._relatedAssetsInspector.unlink();
        }
    }

    return {
        ContainerAssetInspector: ContainerAssetInspector
    };
})());
