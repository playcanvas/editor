import { ComponentInspector } from './component';
import type { Attribute } from '../attribute.type.d';
import { AttributesInspector } from '../attributes-inspector';


const ATTRIBUTES: Attribute[] = [];

class AudiolistenerComponentInspector extends ComponentInspector {
    constructor(args: Record<string, unknown>) {
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

    link(entities: import('@playcanvas/observer').Observer[]) {
        super.link(entities);
        this._attributesInspector.link(entities);
    }

    unlink() {
        super.unlink();
        this._attributesInspector.unlink();
    }
}

export { AudiolistenerComponentInspector };
