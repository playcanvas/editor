import { Panel, BindingTwoWay } from '@playcanvas/pcui';
import { AttributesInspector } from '../attributes.js';

Object.assign(pcui, (function () {
    const ATTRIBUTES = [{
        label: 'Pixels Per Unit',
        path: 'data.pixelsPerUnit',
        type: 'number'
    },
    {
        label: 'Render Mode',
        path: 'data.renderMode',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: 0, t: 'Simple'
            }, {
                v: 1, t: 'Sliced'
            }, {
                v: 2, t: 'Tiled'
            }]
        }
    }];

    ATTRIBUTES.forEach((attr) => {
        const path = attr.alias || attr.path;
        if (!path) return;
        const parts = path.split('.');
        attr.reference = `asset:sprite:${parts[parts.length - 1]}`;
    });

    const DOM = parent => [
        {
            attributesInspector: new AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: ATTRIBUTES
            })
        }, {
            assetInput: new pcui.AssetInput({
                assetType: 'textureatlas',
                assets: parent._args.assets,
                text: 'Texture Atlas',
                flexGrow: 1,
                binding: new BindingTwoWay({
                    history: parent._args.history
                }),
                allowDragDrop: true
            })
        }
    ];

    class SpriteAssetInspector extends Panel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'SPRITE';

            super(args);
            this._args = args;
            this.buildDom(DOM(this));
        }

        link(assets) {
            this.unlink();
            this._attributesInspector.link(assets);
            this._assetInput.link(assets, 'data.textureAtlasAsset');
        }

        unlink() {
            this._attributesInspector.unlink();
            this._assetInput.unlink();
        }
    }

    return {
        SpriteAssetInspector: SpriteAssetInspector
    };
})());
