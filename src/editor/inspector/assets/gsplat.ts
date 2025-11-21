import { Container, Panel } from '@playcanvas/pcui';

import type { Attribute } from '../attribute.type.d';
import { AttributesInspector } from '../attributes-inspector';


const META_ATTRIBUTES: Attribute[] = [{
    label: 'Format',
    alias: 'format',
    path: 'meta.format',
    type: 'label'
}, {
    label: 'Splats',
    alias: 'splats',
    path: 'meta.count',
    type: 'label'
}, {
    label: 'SH Bands',
    alias: 'bands',
    path: 'meta.bands',
    type: 'label'
}, {
    label: 'Bound Min',
    alias: 'bounds.min',
    path: 'meta.bounds.min',
    type: 'vec3'
}, {
    label: 'Bound Max',
    alias: 'bounds.max',
    path: 'meta.bounds.max',
    type: 'vec3'
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

        ['meta.bounds.min', 'meta.bounds.max'].forEach((path) => {
            this._metaAttributesInspector.getField(path).enabled = false;
        });
    }

    unlink() {
        this._metaAttributesInspector.unlink();
    }
}

export { GSplatAssetInspector };
