Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = [{
        label: 'Name',
        path: 'data.moduleName',
        type: 'string'
    }];

    const DOM = parent => [
        {
            attributesInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: ATTRIBUTES
            })
        }, {
            glueInput: new pcui.AssetInput({
                assetType: 'script',
                assets: parent._args.assets,
                text: 'Glue script',
                flexGrow: 1,
                binding: new pcui.BindingTwoWay({
                    history: parent._args.history
                }),
                allowDragDrop: true
            })
        }, {
            fallbackInput: new pcui.AssetInput({
                assetType: 'script',
                assets: parent._args.assets,
                text: 'Fallback script',
                flexGrow: 1,
                binding: new pcui.BindingTwoWay({
                    history: parent._args.history
                }),
                allowDragDrop: true
            })
        }
    ];

    class WasmAssetInspector extends pcui.Panel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'WASM MODULE';

            super(args);
            this._args = args;
            this.buildDom(DOM(this));
        }

        link(assets) {
            this.unlink();
            this._attributesInspector.link(assets);
            window._v = assets[0];
            this._glueInput.link(assets, 'data.glueScriptId');
            this._fallbackInput.link(assets, 'data.fallbackScriptId');
        }

        unlink() {
            this._attributesInspector.unlink();
            this._glueInput.unlink();
            this._fallbackInput.unlink();
        }
    }

    return {
        WasmAssetInspector: WasmAssetInspector
    };
})());
