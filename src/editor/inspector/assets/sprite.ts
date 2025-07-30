import { Panel, BindingTwoWay } from '@playcanvas/pcui';

import { AssetInput } from '../../../common/pcui/element/element-asset-input.ts';
import { AttributesInspector } from '../attributes-inspector.ts';

/**
 * @import { Attribute } from '../attribute.type.d.ts'
 */

/**
 * @type {Attribute[]}
 */
const ATTRIBUTES = [{
    label: 'Pixels Per Unit',
    path: 'data.pixelsPerUnit',
    reference: 'asset:sprite:pixelsPerUnit',
    type: 'number'
},
{
    label: 'Render Mode',
    path: 'data.renderMode',
    reference: 'asset:sprite:renderMode',
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

const DOM = parent => [
    {
        attributesInspector: new AttributesInspector({
            assets: parent._args.assets,
            history: parent._args.history,
            attributes: ATTRIBUTES
        })
    }, {
        assetInput: new AssetInput({
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

export { SpriteAssetInspector };
