import {
    ORIENTATION_HORIZONTAL,
    ORIENTATION_VERTICAL,
    FITTING_NONE,
    FITTING_STRETCH,
    FITTING_SHRINK,
    FITTING_BOTH
} from '@/core/constants';

import { ComponentInspector } from './component';
import type { Attribute } from '../attribute.type.d';
import { AttributesInspector } from '../attributes-inspector';


const ATTRIBUTES: Attribute[] = [{
    label: 'Orientation',
    path: 'components.layoutgroup.orientation',
    reference: 'layoutgroup:orientation',
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
    label: 'Reverse X',
    path: 'components.layoutgroup.reverseX',
    reference: 'layoutgroup:reverseX',
    type: 'boolean'
}, {
    label: 'Reverse Y',
    path: 'components.layoutgroup.reverseY',
    reference: 'layoutgroup:reverseY',
    type: 'boolean'
}, {
    label: 'Alignment',
    path: 'components.layoutgroup.alignment',
    reference: 'layoutgroup:alignment',
    type: 'vec2',
    args: {
        placeholder: ['↔', '↕'],
        precision: 2,
        step: 0.1,
        min: 0,
        max: 1
    }
}, {
    label: 'Padding',
    path: 'components.layoutgroup.padding',
    reference: 'layoutgroup:padding',
    type: 'vec4',
    args: {
        placeholder: ['←', '↓', '→', '↑']
    }
}, {
    label: 'Spacing',
    path: 'components.layoutgroup.spacing',
    reference: 'layoutgroup:spacing',
    type: 'vec2',
    args: {
        placeholder: ['↔', '↕']
    }
}, {
    label: 'Width Fitting',
    path: 'components.layoutgroup.widthFitting',
    reference: 'layoutgroup:widthFitting',
    type: 'select',
    args: {
        type: 'number',
        options: [{
            v: FITTING_NONE, t: 'None'
        }, {
            v: FITTING_STRETCH, t: 'Stretch'
        }, {
            v: FITTING_SHRINK, t: 'Shrink'
        }, {
            v: FITTING_BOTH, t: 'Both'
        }]
    }
}, {
    label: 'Height Fitting',
    path: 'components.layoutgroup.heightFitting',
    reference: 'layoutgroup:heightFitting',
    type: 'select',
    args: {
        type: 'number',
        options: [{
            v: FITTING_NONE, t: 'None'
        }, {
            v: FITTING_STRETCH, t: 'Stretch'
        }, {
            v: FITTING_SHRINK, t: 'Shrink'
        }, {
            v: FITTING_BOTH, t: 'Both'
        }]
    }
}, {
    label: 'Wrap',
    path: 'components.layoutgroup.wrap',
    reference: 'layoutgroup:wrap',
    type: 'boolean'
}];

class LayoutgroupComponentInspector extends ComponentInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.component = 'layoutgroup';

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

export { LayoutgroupComponentInspector };
