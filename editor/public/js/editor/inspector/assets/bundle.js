Object.assign(pcui, (function () {
    'use strict';

    const DOM = parent => [
        {
            assetList: new pcui.AssetList({
                assets: parent._args.assets,
                binding: new pcui.BindingTwoWay({
                    history: parent._args.history
                })
            })
        }
    ];

    class BundleAssetInspector extends pcui.Panel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'ASSETS';

            super(args);
            this._args = args;

            this.buildDom(DOM(this));
        }

        link(assets) {
            this.unlink();
            this._assetList.link(assets, 'data.assets');
        }

        unlink() {
            this._assetList.unlink();
        }
    }

    return {
        BundleAssetInspector: BundleAssetInspector
    };
})());
