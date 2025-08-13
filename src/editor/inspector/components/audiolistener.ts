import { ComponentInspector } from './component.ts';
import { AttributesInspector } from '../attributes-inspector.ts';

/** @import { Attribute } from '../attribute.type.d.ts' */

/**
 * @type {Attribute[]}
 */
const ATTRIBUTES = [];

class AudiolistenerComponentInspector extends ComponentInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.component = 'audiolistener';

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

export { AudiolistenerComponentInspector };
