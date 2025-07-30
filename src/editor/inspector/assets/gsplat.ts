import { Container, Panel } from '@playcanvas/pcui';

import { AttributesInspector } from '../attributes-inspector.ts';

/**
 * @import { Attribute } from '../attribute.type.d.ts'
 */

/**
 * @type {Attribute[]}
 */
const META_ATTRIBUTES = [{
    label: 'Format',
    alias: 'format',
    path: 'meta.format',
    type: 'label'
}, {
    label: 'Splats',
    alias: 'splats',
    path: 'meta.elements.vertex.count',
    type: 'label'
}, {
    label: 'Properties',
    alias: 'properties',
    path: 'meta.properties',
    type: 'label'
}];

const DOM = parent => [
    {
        root: {
            metaPanel: new Panel({
                headerText: 'META'
            })
        },
        children: [{
            metaAttributesInspector: new AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: META_ATTRIBUTES
            })
        }]
    }
];

class GSplatAssetInspector extends Container {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'GAUSSIAN SPLAT';

        super(args);
        this._args = args;
        this.buildDom(DOM(this));
    }

    link(assets) {
        this.unlink();
        this._metaAttributesInspector.link(assets);

        const props = {};
        assets.forEach((asset) => {
            const properties = asset.get('meta.elements.vertex.properties');
            if (properties) {
                Object.assign(props, properties);
            }
        });

        const text = Object.keys(props).join(', ');
        const field = this._metaAttributesInspector.getField('meta.properties');
        field.values = assets.map(asset => text);
    }

    unlink() {
        this._metaAttributesInspector.unlink();
    }
}

export { GSplatAssetInspector };
