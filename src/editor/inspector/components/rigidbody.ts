import { ComponentInspector } from './component.ts';
import type { Attribute } from '../attribute.type.d.ts';
import { AttributesInspector } from '../attributes-inspector.ts';


const ATTRIBUTES: Attribute[] = [{
    label: 'Type',
    path: 'components.rigidbody.type',
    reference: 'rigidbody:type',
    type: 'select',
    args: {
        type: 'string',
        options: [{
            v: 'static', t: 'Static'
        }, {
            v: 'dynamic', t: 'Dynamic'
        }, {
            v: 'kinematic', t: 'Kinematic'
        }]
    }
}, {
    label: 'Mass',
    path: 'components.rigidbody.mass',
    reference: 'rigidbody:mass',
    type: 'number',
    args: {
        precision: 2,
        step: 0.1,
        min: 0,
        placeholder: 'Kg'
    }
}, {
    label: 'Linear Damping',
    path: 'components.rigidbody.linearDamping',
    reference: 'rigidbody:linearDamping',
    type: 'number',
    args: {
        precision: 6,
        step: 0.01,
        min: 0,
        max: 1
    }
}, {
    label: 'Angular Damping',
    path: 'components.rigidbody.angularDamping',
    reference: 'rigidbody:angularDamping',
    type: 'number',
    args: {
        precision: 6,
        step: 0.01,
        min: 0,
        max: 1
    }
}, {
    label: 'Linear Factor',
    path: 'components.rigidbody.linearFactor',
    reference: 'rigidbody:linearFactor',
    type: 'vec3',
    args: {
        precision: 4,
        step: 0.01,
        min: 0,
        max: 1,
        placeholder: ['X', 'Y', 'Z']
    }
}, {
    label: 'Angular Factor',
    path: 'components.rigidbody.angularFactor',
    reference: 'rigidbody:angularFactor',
    type: 'vec3',
    args: {
        precision: 4,
        step: 0.01,
        min: 0,
        max: 1,
        placeholder: ['X', 'Y', 'Z']
    }
}, {
    label: 'Friction',
    path: 'components.rigidbody.friction',
    reference: 'rigidbody:friction',
    type: 'slider',
    args: {
        precision: 4,
        step: 0.01,
        min: 0,
        max: 1
    }
}, {
    label: 'Restitution',
    path: 'components.rigidbody.restitution',
    reference: 'rigidbody:restitution',
    type: 'slider',
    args: {
        precision: 4,
        step: 0.01,
        min: 0,
        max: 1
    }
}];

class RigidbodyComponentInspector extends ComponentInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.component = 'rigidbody';

        super(args);

        this._attributesInspector = new AttributesInspector({
            assets: args.assets,
            history: args.history,
            attributes: ATTRIBUTES,
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);

        this._field('type').on('change', this._toggleFields.bind(this));

        this._suppressToggleFields = false;

        this._importAmmoPanel = editor.call('attributes:appendImportAmmo', this);
        this._importAmmoPanel.hidden = true;
        this._importAmmoPanel.label.text = 'Ammo module not found';
        this._importAmmoPanel.class.add('library-warning');
        this._importAmmoPanel.label.class.add('library-warning-text');
        this._importAmmoPanel.style.margin = '6px';

        this.on('show', () => {
            this._importAmmoPanel.hidden = editor.call('project:settings:hasPhysics');
        });
    }

    _field(name) {
        return this._attributesInspector.getField(`components.rigidbody.${name}`);
    }

    _toggleFields() {
        if (this._suppressToggleFields) {
            return;
        }

        const isDynamic = this._field('type').value === 'dynamic';

        [
            'mass',
            'linearDamping',
            'angularDamping',
            'linearFactor',
            'angularFactor'
        ].forEach((field) => {
            this._field(field).parent.hidden = !isDynamic;
        });
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

export { RigidbodyComponentInspector };
