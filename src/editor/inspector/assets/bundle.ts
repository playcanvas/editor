import { Panel, BindingTwoWay } from '@playcanvas/pcui';

import { AssetList } from '@/common/pcui/element/element-asset-list';

const DOM = parent => [
    {
        assetList: new AssetList({
            assets: parent._args.assets,
            binding: new BindingTwoWay({
                history: parent._args.history
            })
        })
    }
];

class BundleAssetInspector extends Panel {
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

export { BundleAssetInspector };
