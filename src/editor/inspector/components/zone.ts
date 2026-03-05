import { ComponentInspector, type ComponentInspectorArgs } from './component';
import type { Attribute } from '../attribute.type.d';
import { AttributesInspector } from '../attributes-inspector';


const ATTRIBUTES: Attribute[] = [{
    label: 'Size',
    path: 'components.zone.size',
    type: 'vec3',
    args: {
        precision: 2,
        step: 0.1,
        min: 0,
        placeholder: ['W', 'H', 'D']
    }
}];

class ZoneComponentInspector extends ComponentInspector {
    constructor(args: ComponentInspectorArgs) {
        args = Object.assign({}, args);
        args.component = 'zone';

        super(args);

        this._attributesInspector = new AttributesInspector({
            assets: args.assets,
            history: args.history,
            attributes: ATTRIBUTES,
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);
    }
}

export { ZoneComponentInspector };
