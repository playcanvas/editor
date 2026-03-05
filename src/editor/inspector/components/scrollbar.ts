import { ORIENTATION_HORIZONTAL, ORIENTATION_VERTICAL } from 'playcanvas';

import { deepCopy } from '@/common/utils';

import { ComponentInspector, type ComponentInspectorArgs } from './component';
import type { Attribute } from '../attribute.type.d';
import { AttributesInspector } from '../attributes-inspector';


const ATTRIBUTES: Attribute[] = [{
    label: 'Orientation',
    path: 'components.scrollbar.orientation',
    reference: 'scrollbar:orientation',
    type: 'select',
    args: {
        type: 'number',
        options: [{
            v: ORIENTATION_HORIZONTAL, t: 'Horizontal'
        }, {
            v: ORIENTATION_VERTICAL, t: 'Vertical'
        }]
    }
}, {
    label: 'Value',
    path: 'components.scrollbar.value',
    reference: 'scrollbar:value',
    type: 'number',
    args: {
        precision: 3,
        step: 0.01,
        min: 0,
        max: 1
    }
}, {
    label: 'Handle',
    path: 'components.scrollbar.handleEntity',
    reference: 'scrollbar:handleEntity',
    type: 'entity'
}, {
    label: 'Handle Size',
    path: 'components.scrollbar.handleSize',
    reference: 'scrollbar:handleSize',
    type: 'number',
    args: {
        precision: 3,
        step: 0.01,
        min: 0,
        max: 1
    }
}];

class ScrollbarComponentInspector extends ComponentInspector {
    constructor(args: ComponentInspectorArgs) {
        args = Object.assign({}, args);
        args.component = 'scrollbar';

        super(args);

        const attrs = deepCopy(ATTRIBUTES);
        attrs.forEach((attr) => {
            if (attr.type === 'entity') {
                attr.args = attr.args || {};
                attr.args.entities = args.entities;
            }
        });

        this._attributesInspector = new AttributesInspector({
            history: args.history,
            entities: args.entities,
            attributes: attrs,
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);
    }
}

export { ScrollbarComponentInspector };
