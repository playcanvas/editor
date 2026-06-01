import { LAYERID_DEPTH, LAYERID_SKYBOX, LAYERID_IMMEDIATE } from 'playcanvas';

import { ComponentInspector, type ComponentInspectorArgs } from './component';
import type { Attribute } from '../attribute.type.d';
import { AttributesInspector } from '../attributes-inspector';


const ATTRIBUTES: Attribute[] = [{
    label: 'Asset',
    path: 'components.gsplat.asset',
    reference: 'gsplat:asset',
    type: 'asset',
    args: {
        assetType: 'gsplat'
    }
}, {
    label: 'Cast Shadows',
    path: 'components.gsplat.castShadows',
    reference: 'gsplat:castShadows',
    type: 'boolean'
}, {
    label: 'LOD Base Distance',
    path: 'components.gsplat.lodBaseDistance',
    reference: 'gsplat:lodBaseDistance',
    type: 'number',
    args: {
        min: 0.1,
        step: 0.1,
        precision: 2
    }
}, {
    label: 'LOD Multiplier',
    path: 'components.gsplat.lodMultiplier',
    reference: 'gsplat:lodMultiplier',
    type: 'number',
    args: {
        min: 1.2,
        step: 0.1,
        precision: 2
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
    constructor(args: ComponentInspectorArgs) {
        args = Object.assign({}, args);
        args.component = 'gsplat';

        super(args);

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
}

export { GSplatComponentInspector };
