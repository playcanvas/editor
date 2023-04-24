import { ComponentInspector } from './component.js';

const ATTRIBUTES = [{
    label: 'Min Width',
    path: 'components.layoutchild.minWidth',
    type: 'number'
}, {
    label: 'Max Width',
    path: 'components.layoutchild.maxWidth',
    type: 'number'
}, {
    label: 'Min Height',
    path: 'components.layoutchild.minHeight',
    type: 'number'
}, {
    label: 'Max Height',
    path: 'components.layoutchild.maxHeight',
    type: 'number'
}, {
    label: 'Fit Width Proportion',
    path: 'components.layoutchild.fitWidthProportion',
    type: 'number'
}, {
    label: 'Fit Height Proportion',
    path: 'components.layoutchild.fitHeightProportion',
    type: 'number'
}, {
    label: 'Exclude from Layout',
    path: 'components.layoutchild.excludeFromLayout',
    type: 'boolean'
}];

ATTRIBUTES.forEach((attr) => {
    const parts = attr.path.split('.');
    attr.reference = `layoutchild:${parts[parts.length - 1]}`;
});

class LayoutchildComponentInspector extends ComponentInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.component = 'layoutchild';

        super(args);

        this._attributesInspector = new pcui.AttributesInspector({
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
