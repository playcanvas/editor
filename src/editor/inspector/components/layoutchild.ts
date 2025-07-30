import { ComponentInspector } from './component.ts';
import { AttributesInspector } from '../attributes-inspector.ts';

/**
 * @import { Attribute } from '../attribute.type.d.ts'
 */

/**
 * @type {Attribute[]}
 */
const ATTRIBUTES = [{
    label: 'Min Width',
    path: 'components.layoutchild.minWidth',
    reference: 'layoutchild:minWidth',
    type: 'number'
}, {
    label: 'Max Width',
    path: 'components.layoutchild.maxWidth',
    reference: 'layoutchild:maxWidth',
    type: 'number'
}, {
    label: 'Min Height',
    path: 'components.layoutchild.minHeight',
    reference: 'layoutchild:minHeight',
    type: 'number'
}, {
    label: 'Max Height',
    path: 'components.layoutchild.maxHeight',
    reference: 'layoutchild:maxHeight',
    type: 'number'
}, {
    label: 'Fit Width Proportion',
    path: 'components.layoutchild.fitWidthProportion',
    reference: 'layoutchild:fitWidthProportion',
    type: 'number'
}, {
    label: 'Fit Height Proportion',
    path: 'components.layoutchild.fitHeightProportion',
    reference: 'layoutchild:fitHeightProportion',
    type: 'number'
}, {
    label: 'Exclude from Layout',
    path: 'components.layoutchild.excludeFromLayout',
    reference: 'layoutchild:excludeFromLayout',
    type: 'boolean'
}];

class LayoutchildComponentInspector extends ComponentInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.component = 'layoutchild';

        super(args);

        this._attributesInspector = new AttributesInspector({
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

export { LayoutchildComponentInspector };
