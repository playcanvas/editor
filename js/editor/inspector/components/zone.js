import { AttributesInspector } from '../attributes.js';
import { ComponentInspector } from './component.js';

const ATTRIBUTES = [{
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
    constructor(args) {
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

    link(entities) {
        super.link(entities);
        this._attributesInspector.link(entities);
    }

    unlink() {
        super.unlink();
        this._attributesInspector.unlink();
    }
}

export { ZoneComponentInspector };
