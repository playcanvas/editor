import { ComponentInspector } from './component.ts';
import { LAYERID_DEPTH, LAYERID_SKYBOX, LAYERID_IMMEDIATE } from '../../../core/constants.ts';
import { AttributesInspector } from '../attributes-inspector.ts';

/**
 * @import { Attribute } from '../attribute.type.d.ts'
 */

/**
 * @type {Attribute[]}
 */
const ATTRIBUTES = [{
    label: 'Asset',
    path: 'components.gsplat.asset',
    reference: 'gsplat:asset',
    type: 'asset',
    args: {
        assetType: 'gsplat'
    }
}, {
    label: 'Layers',
    path: 'components.gsplat.layers',
    reference: 'gsplat:layers',
    type: 'layers',
    args: {
        excludeLayers: [
            LAYERID_DEPTH,
            LAYERID_SKYBOX,
            LAYERID_IMMEDIATE
        ]
    }
}];

class GSplatComponentInspector extends ComponentInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.component = 'gsplat';

        super(args);

        this._assets = args.assets;

        this._attributesInspector = new AttributesInspector({
            assets: args.assets,
            entities: args.entities,
            projectSettings: args.projectSettings,
            history: args.history,
            attributes: ATTRIBUTES,
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);
    }

    _field(name) {
        return this._attributesInspector.getField(`components.gsplat.${name}`);
    }

    link(entities) {
        super.link(entities);
        this._attributesInspector.link(entities);
    }

    unlink() {
        super.unlink();
        this._attributesInspector.unlink();
    }
}

export { GSplatComponentInspector };
