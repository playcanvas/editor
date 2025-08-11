import { ComponentInspector } from './component.ts';
import { deepCopy } from '../../../common/utils.ts';
import { AttributesInspector } from '../attributes-inspector.ts';

/**
 * @import { Attribute } from '../attribute.type.d.ts'
 */

/**
 * @type {Attribute[]}
 */
const ATTRIBUTES = [{
    label: 'Screen Space',
    path: 'components.screen.screenSpace',
    reference: 'screen:screenSpace',
    type: 'boolean'
}, {
    label: 'Resolution',
    path: 'components.screen.resolution',
    reference: 'screen:resolution',
    type: 'vec2',
    args: {
        placeholder: ['Width', 'Height']
    }
}, {
    label: 'Ref Resolution',
    path: 'components.screen.referenceResolution',
    reference: 'screen:referenceResolution',
    type: 'vec2',
    args: {
        placeholder: ['Width', 'Height']
    }
}, {
    label: 'Scale Mode',
    path: 'components.screen.scaleMode',
    reference: 'screen:scaleMode',
    type: 'select',
    args: {
        type: 'string',
        options: [{
            v: 'none', t: 'None'
        }, {
            v: 'blend', t: 'Blend'
        }]
    }
}, {
    label: 'Scale Blend',
    path: 'components.screen.scaleBlend',
    reference: 'screen:scaleBlend',
    type: 'slider',
    args: {
        min: 0,
        max: 1,
        precision: 2,
        step: 0.1
    }
}, {
    label: 'Priority',
    path: 'components.screen.priority',
    reference: 'screen:priority',
    type: 'number',
    args: {
        min: 0,
        max: 127,
        precision: 0,
        step: 1
    }
}];
class ScreenComponentInspector extends ComponentInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.component = 'screen';

        super(args);

        this._attributesInspector = new AttributesInspector({
            history: args.history,
            attributes: deepCopy(ATTRIBUTES),
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);

        this._field('scaleMode').on('change', this._toggleFields.bind(this));
        this._field('screenSpace').on('change', this._toggleFields.bind(this));

        this._suppressToggleFields = false;
    }

    _field(name) {
        return this._attributesInspector.getField(`components.screen.${name}`);
    }

    _toggleFields() {
        if (this._suppressToggleFields) {
            return;
        }

        const scaleMode = this._field('scaleMode').value;
        const screenSpace = this._field('screenSpace').value;

        this._field('resolution').parent.hidden = !!screenSpace;
        this._field('referenceResolution').parent.hidden = scaleMode === 'none' || !screenSpace;
        this._field('scaleMode').parent.hidden = !screenSpace;
        this._field('scaleBlend').parent.hidden = scaleMode !== 'blend' || !screenSpace;
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

export { ScreenComponentInspector };
