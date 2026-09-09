import { LAYERID_DEPTH, LAYERID_SKYBOX, LAYERID_IMMEDIATE } from 'playcanvas';

import type { Attribute } from '../attribute.type.d';
import { AttributesInspector } from '../attributes-inspector';

import { ComponentInspector } from './component';
import type { ComponentInspectorArgs } from './component';

const ATTRIBUTES: Attribute[] = [
    {
        label: 'Asset',
        path: 'components.gsplat.asset',
        reference: 'gsplat:asset',
        type: 'asset',
        args: {
            assetType: 'gsplat'
        }
    },
    {
        label: 'Cast Shadows',
        path: 'components.gsplat.castShadows',
        reference: 'gsplat:castShadows',
        type: 'boolean'
    },
    {
        label: 'LOD Range Min',
        path: 'components.gsplat.lodRangeMin',
        reference: 'gsplat:lodRangeMin',
        type: 'number',
        args: {
            min: 0,
            step: 1,
            precision: 0
        }
    },
    {
        label: 'LOD Range Max',
        path: 'components.gsplat.lodRangeMax',
        reference: 'gsplat:lodRangeMax',
        type: 'number',
        args: {
            min: 0,
            step: 1,
            precision: 0
        }
    },
    {
        label: 'LOD Falloff',
        path: 'components.gsplat.lodFalloff',
        reference: 'gsplat:lodFalloff',
        type: 'slider',
        args: {
            min: 0,
            max: 8,
            step: 0.1,
            precision: 2
        }
    },
    {
        label: 'Layers',
        path: 'components.gsplat.layers',
        reference: 'gsplat:layers',
        type: 'layers',
        args: {
            excludeLayers: [LAYERID_DEPTH, LAYERID_SKYBOX, LAYERID_IMMEDIATE]
        }
    }
];

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
