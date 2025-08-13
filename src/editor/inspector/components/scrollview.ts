import { ComponentInspector } from './component.ts';
import { deepCopy } from '../../../common/utils.ts';
import {
    SCROLL_MODE_BOUNCE,
    SCROLL_MODE_CLAMP,
    SCROLL_MODE_INFINITE,
    SCROLLBAR_VISIBILITY_SHOW_ALWAYS,
    SCROLLBAR_VISIBILITY_SHOW_WHEN_REQUIRED
} from '../../../core/constants.ts';
import { AttributesInspector } from '../attributes-inspector.ts';

import type { Attribute, Divider } from '../attribute.type.d.ts'

/**
 * @type {(Attribute | Divider)[]}
 */
const ATTRIBUTES = [{
    label: 'Scroll Mode',
    path: 'components.scrollview.scrollMode',
    reference: 'scrollview:scrollMode',
    type: 'select',
    args: {
        type: 'number',
        options: [{
            v: SCROLL_MODE_CLAMP, t: 'Clamp'
        }, {
            v: SCROLL_MODE_BOUNCE, t: 'Bounce'
        }, {
            v: SCROLL_MODE_INFINITE, t: 'Infinite'
        }]
    }
}, {
    label: 'Bounce',
    path: 'components.scrollview.bounceAmount',
    reference: 'scrollview:bounceAmount',
    type: 'number',
    args: {
        precision: 3,
        step: 0.01,
        min: 0,
        max: 10
    }
}, {
    label: 'Friction',
    path: 'components.scrollview.friction',
    reference: 'scrollview:friction',
    type: 'number',
    args: {
        precision: 3,
        step: 0.01,
        min: 0,
        max: 10
    }
}, {
    label: 'Use Mouse Wheel',
    path: 'components.scrollview.useMouseWheel',
    reference: 'scrollview:useMouseWheel',
    type: 'boolean'

}, {
    label: 'Mouse Wheel Sensitivity',
    path: 'components.scrollview.mouseWheelSensitivity',
    reference: 'scrollview:mouseWheelSensitivity',
    type: 'vec2',
    args: {
        precision: 2,
        step: 0.1,
        placeholder: ['↔', '↕']
    }
}, {
    type: 'divider'
}, {
    label: 'Viewport',
    path: 'components.scrollview.viewportEntity',
    reference: 'scrollview:viewportEntity',
    type: 'entity'
}, {
    label: 'Content',
    path: 'components.scrollview.contentEntity',
    reference: 'scrollview:contentEntity',
    type: 'entity'
}, {
    type: 'divider'
}, {
    label: 'Horizontal',
    path: 'components.scrollview.horizontal',
    reference: 'scrollview:horizontal',
    type: 'boolean'
}, {
    label: 'Scrollbar',
    path: 'components.scrollview.horizontalScrollbarEntity',
    reference: 'scrollview:horizontalScrollbarEntity',
    type: 'entity'
}, {
    label: 'Visibility',
    path: 'components.scrollview.horizontalScrollbarVisibility',
    reference: 'scrollview:horizontalScrollbarVisibility',
    type: 'select',
    args: {
        type: 'number',
        options: [{
            v: SCROLLBAR_VISIBILITY_SHOW_ALWAYS, t: 'Show Always'
        }, {
            v: SCROLLBAR_VISIBILITY_SHOW_WHEN_REQUIRED, t: 'Show When Required'
        }]
    }
}, {
    type: 'divider'
}, {
    label: 'Vertical',
    path: 'components.scrollview.vertical',
    reference: 'scrollview:vertical',
    type: 'boolean'
}, {
    label: 'Scrollbar',
    path: 'components.scrollview.verticalScrollbarEntity',
    reference: 'scrollview:verticalScrollbarEntity',
    type: 'entity'
}, {
    label: 'Visibility',
    path: 'components.scrollview.verticalScrollbarVisibility',
    reference: 'scrollview:verticalScrollbarVisibility',
    type: 'select',
    args: {
        type: 'number',
        options: [{
            v: SCROLLBAR_VISIBILITY_SHOW_ALWAYS, t: 'Show Always'
        }, {
            v: SCROLLBAR_VISIBILITY_SHOW_WHEN_REQUIRED, t: 'Show When Required'
        }]
    }
}];

class ScrollviewComponentInspector extends ComponentInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.component = 'scrollview';

        super(args);

        const attrs = deepCopy(ATTRIBUTES);
        attrs.forEach((attr) => {
            if (attr.type === 'entity') {
                attr.args = attr.args || {};
                attr.args.entities = args.entities;
            }
        });

        this._attributesInspector = new AttributesInspector({
            entities: args.entities,
            history: args.history,
            attributes: attrs,
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);

        ['scrollMode', 'useMouseWheel', 'vertical', 'horizontal'].forEach((field) => {
            this._field(field).on('change', this._toggleFields.bind(this));
        });

        this._suppressToggleFields = false;
    }

    _field(name) {
        return this._attributesInspector.getField(`components.scrollview.${name}`);
    }

    _toggleFields() {
        if (this._suppressToggleFields) {
            return;
        }

        const isBounceMode = this._field('scrollMode').value === SCROLL_MODE_BOUNCE;
        const useMouseWheel = this._field('useMouseWheel').value === true;
        const verticalScrollingEnabled = this._field('vertical').value === true;
        const horizontalScrollingEnabled = this._field('horizontal').value === true;

        this._field('bounceAmount').parent.hidden = !isBounceMode;
        this._field('mouseWheelSensitivity').parent.hidden = !useMouseWheel;
        this._field('verticalScrollbarEntity').parent.hidden = !verticalScrollingEnabled;
        this._field('verticalScrollbarVisibility').parent.hidden = !verticalScrollingEnabled;
        this._field('horizontalScrollbarEntity').parent.hidden = !horizontalScrollingEnabled;
        this._field('horizontalScrollbarVisibility').parent.hidden = !horizontalScrollingEnabled;
    }

    link(entities) {
        super.link(entities);
        this._suppressToggleFields = true;
        this._attributesInspector.link(entities);
        this._suppressToggleFields = false;
        this._toggleFields();
    }

    unlink() {
        super.unlink();
        this._attributesInspector.unlink();
    }
}

export { ScrollviewComponentInspector };
