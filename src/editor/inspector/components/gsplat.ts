import { LAYERID_DEPTH, LAYERID_SKYBOX, LAYERID_IMMEDIATE } from 'playcanvas';

import { pathExists } from '@/common/utils';
import { ComponentInspector } from './component';
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
}, {
    label: 'Unified',
    path: 'components.gsplat.unified',
    reference: 'gsplat:unified',
    type: 'boolean'
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

        this._field('unified').parent.hidden = !pathExists(pc, 'GSplatComponent.prototype.unified');
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
