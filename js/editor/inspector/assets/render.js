import { Panel, Container } from '@playcanvas/pcui';
import { AttributesInspector } from '../attributes.js';

const META_ATTRIBUTES = [{
    label: 'Vertices',
    alias: 'vertices',
    path: 'meta.vertices',
    type: 'label'
}, {
    label: 'Triangles',
    alias: 'triangles',
    path: 'meta.triangles',
    type: 'label'
}, {
    label: 'Meshes',
    path: 'meta.meshes',
    type: 'label'
}, {
    label: 'Skinned',
    path: 'meta.skinned',
    type: 'label'
}, {
    label: 'Attributes',
    path: 'meta.attributes',
    type: 'label'
}, {
    label: 'Mesh Compression',
    path: 'meta.meshCompression',
    type: 'label'
}];

const ATTRIBUTES = [{
    label: 'Index',
    path: 'data.renderIndex',
    type: 'label',
    reference: 'asset:render:renderIndex'
}, {
    label: 'Container',
    path: 'data.containerAsset',
    type: 'asset',
    reference: 'asset:render:containerAsset',
    args: {
        readOnly: true,
        assetType: 'container'
    }
}];


const DOM = parent => [
    {
        root: {
            metaPanel: new Panel({
                headerText: 'META'
            })
        },
        children: [
            {
                metaAttributesInspector: new AttributesInspector({
                    assets: parent._args.assets,
                    history: parent._args.history,
                    attributes: META_ATTRIBUTES
                })
            }
        ]
    },
    {
        root: {
            metaPanel: new Panel({
                headerText: 'RENDER'
            })
        },
        children: [
            {
                attributesInspector: new AttributesInspector({
                    assets: parent._args.assets,
                    history: parent._args.history,
                    attributes: ATTRIBUTES
                })
            }
        ]
    }
];

class RenderAssetInspector extends Container {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'RENDER';

        super(args);
        this._args = args;
        this.buildDom(DOM(this));
    }

    link(assets) {
        this.unlink();
        this._metaAttributesInspector.link(assets);
        this._attributesInspector.link(assets);

        this._formatMetaAttribute(assets);
        this._formatMetaMeshCompression(assets);
    }

    unlink() {
        this._attributesInspector.unlink();
        this._metaAttributesInspector.unlink();
    }

    _formatMetaAttribute(assets) {
        const metaAttributes = {};
        assets.forEach((asset) => {
            const currMetaAttributes = asset.get('meta.attributes');
            if (currMetaAttributes) {
                Object.assign(metaAttributes, currMetaAttributes);
            }
        });

        const text = Object.keys(metaAttributes).join(', ');
        const field = this._metaAttributesInspector.getField('meta.attributes');
        field.values = assets.map(asset => text);
    }

    _formatMetaMeshCompression(assets) {
        const attribute = 'meta.meshCompression';
        const names = {
            none: 'Disabled',
            draco: 'Draco'
        };
        const text =
            Array.from(new Set(assets.map(asset => asset.get(attribute))))
            .map(v => names[v] || v)
            .join(', ');
        const field = this._metaAttributesInspector.getField(attribute);
        field.values = assets.map(asset => text);
    }
}

export { RenderAssetInspector };
