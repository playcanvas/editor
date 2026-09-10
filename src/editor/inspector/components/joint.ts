import type { LabelGroup } from '@playcanvas/pcui';
import {
    JOINTTYPE_6DOF,
    JOINTTYPE_BALL,
    JOINTTYPE_FIXED,
    JOINTTYPE_HINGE,
    JOINTTYPE_SLIDER,
    MOTION_FREE,
    MOTION_LIMITED,
    MOTION_LOCKED
} from 'playcanvas';

import { CLASS_MULTIPLE_VALUES } from '@/common/pcui/constants';
import type { EntityObserver } from '@/editor-api';

import type { Attribute } from '../attribute.type.d';
import { AttributesInspector } from '../attributes-inspector';

import { ComponentInspector } from './component';
import type { ComponentInspectorArgs } from './component';

const MOTION_OPTIONS = [
    { v: MOTION_LOCKED, t: 'Locked' },
    { v: MOTION_LIMITED, t: 'Limited' },
    { v: MOTION_FREE, t: 'Free' }
];

const COMMON_FIELDS = new Set(['type', 'entityA', 'entityB', 'enableCollision', 'breakImpulse']);
const LIMIT_FIELDS = ['limits', 'swingLimitY', 'swingLimitZ', 'twistLimit'];
const DOF_FIELDS = [
    'linearMotionX',
    'linearMotionY',
    'linearMotionZ',
    'linearLimitsX',
    'linearLimitsY',
    'linearLimitsZ',
    'linearStiffness',
    'linearDamping',
    'linearEquilibrium',
    'angularMotionX',
    'angularMotionY',
    'angularMotionZ',
    'angularLimitsX',
    'angularLimitsY',
    'angularLimitsZ',
    'angularStiffness',
    'angularDamping',
    'angularEquilibrium'
];

const ATTRIBUTES: Attribute[] = [
    {
        label: 'Type',
        path: 'components.joint.type',
        reference: 'joint:type',
        type: 'select',
        args: {
            type: 'string',
            options: [
                { v: JOINTTYPE_FIXED, t: 'Fixed' },
                { v: JOINTTYPE_BALL, t: 'Ball' },
                { v: JOINTTYPE_HINGE, t: 'Hinge' },
                { v: JOINTTYPE_SLIDER, t: 'Slider' },
                { v: JOINTTYPE_6DOF, t: '6DoF' }
            ]
        }
    },
    {
        label: 'Entity A',
        path: 'components.joint.entityA',
        reference: 'joint:entityA',
        type: 'entity'
    },
    {
        label: 'Entity B',
        path: 'components.joint.entityB',
        reference: 'joint:entityB',
        type: 'entity'
    },
    {
        label: 'Enable Collision',
        path: 'components.joint.enableCollision',
        reference: 'joint:enableCollision',
        type: 'boolean'
    },
    {
        label: 'Break Impulse',
        path: 'components.joint.breakImpulse',
        reference: 'joint:breakImpulse',
        type: 'number',
        args: {
            allowNull: true,
            placeholder: 'Unbreakable'
        }
    },
    {
        label: 'Enable Limits',
        path: 'components.joint.enableLimits',
        reference: 'joint:enableLimits',
        type: 'boolean'
    },
    {
        label: 'Limits',
        path: 'components.joint.limits',
        reference: 'joint:limits',
        type: 'vec2',
        args: {
            placeholder: ['Lower', 'Upper']
        }
    },
    {
        label: 'Motor Speed',
        path: 'components.joint.motorSpeed',
        reference: 'joint:motorSpeed',
        type: 'number'
    },
    {
        label: 'Max Motor Force',
        path: 'components.joint.maxMotorForce',
        reference: 'joint:maxMotorForce',
        type: 'number'
    },
    {
        label: 'Swing Limit Y',
        path: 'components.joint.swingLimitY',
        reference: 'joint:swingLimitY',
        type: 'number'
    },
    {
        label: 'Swing Limit Z',
        path: 'components.joint.swingLimitZ',
        reference: 'joint:swingLimitZ',
        type: 'number'
    },
    {
        label: 'Twist Limit',
        path: 'components.joint.twistLimit',
        reference: 'joint:twistLimit',
        type: 'number'
    },
    ...['X', 'Y', 'Z'].flatMap((axis): Attribute[] => [
        {
            label: `Linear Motion ${axis}`,
            path: `components.joint.linearMotion${axis}`,
            reference: `joint:linearMotion${axis}`,
            type: 'select',
            args: {
                type: 'string',
                options: MOTION_OPTIONS
            }
        },
        {
            label: `Linear Limits ${axis}`,
            path: `components.joint.linearLimits${axis}`,
            reference: `joint:linearLimits${axis}`,
            type: 'vec2',
            args: {
                placeholder: ['Lower', 'Upper']
            }
        }
    ]),
    {
        label: 'Linear Stiffness',
        path: 'components.joint.linearStiffness',
        reference: 'joint:linearStiffness',
        type: 'vec3',
        args: {
            min: 0,
            placeholder: ['X', 'Y', 'Z']
        }
    },
    {
        label: 'Linear Damping',
        path: 'components.joint.linearDamping',
        reference: 'joint:linearDamping',
        type: 'vec3',
        args: {
            min: 0,
            placeholder: ['X', 'Y', 'Z']
        }
    },
    {
        label: 'Linear Equilibrium',
        path: 'components.joint.linearEquilibrium',
        reference: 'joint:linearEquilibrium',
        type: 'vec3',
        args: {
            placeholder: ['X', 'Y', 'Z']
        }
    },
    ...['X', 'Y', 'Z'].flatMap((axis): Attribute[] => [
        {
            label: `Angular Motion ${axis}`,
            path: `components.joint.angularMotion${axis}`,
            reference: `joint:angularMotion${axis}`,
            type: 'select',
            args: {
                type: 'string',
                options: MOTION_OPTIONS
            }
        },
        {
            label: `Angular Limits ${axis}`,
            path: `components.joint.angularLimits${axis}`,
            reference: `joint:angularLimits${axis}`,
            type: 'vec2',
            args: {
                placeholder: ['Lower', 'Upper']
            }
        }
    ]),
    {
        label: 'Angular Stiffness',
        path: 'components.joint.angularStiffness',
        reference: 'joint:angularStiffness',
        type: 'vec3',
        args: {
            min: 0,
            placeholder: ['X', 'Y', 'Z']
        }
    },
    {
        label: 'Angular Damping',
        path: 'components.joint.angularDamping',
        reference: 'joint:angularDamping',
        type: 'vec3',
        args: {
            min: 0,
            placeholder: ['X', 'Y', 'Z']
        }
    },
    {
        label: 'Angular Equilibrium',
        path: 'components.joint.angularEquilibrium',
        reference: 'joint:angularEquilibrium',
        type: 'vec3',
        args: {
            placeholder: ['X', 'Y', 'Z']
        }
    }
];

class JointComponentInspector extends ComponentInspector {
    _suppressToggleFields = false;

    _importAmmoPanel: LabelGroup;

    constructor(args: ComponentInspectorArgs) {
        args = Object.assign({}, args);
        args.component = 'joint';

        super(args);

        this._attributesInspector = new AttributesInspector({
            assets: args.assets,
            entities: args.entities,
            projectSettings: args.projectSettings,
            history: args.history,
            attributes: ATTRIBUTES,
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);
        this._field('breakImpulse').parent.style.marginBottom = '6px';

        [
            'type',
            'enableLimits',
            'linearMotionX',
            'linearMotionY',
            'linearMotionZ',
            'angularMotionX',
            'angularMotionY',
            'angularMotionZ'
        ].forEach((field) => {
            this._field(field).on('change', this._toggleFields.bind(this));
        });

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

    _toggleFields() {
        if (this._suppressToggleFields) {
            return;
        }

        const typeField = this._field('type');
        const type = typeField.class.contains(CLASS_MULTIPLE_VALUES) ? null : typeField.value;
        const limits = this._field('enableLimits').value;
        const hinge = type === JOINTTYPE_HINGE || type === JOINTTYPE_SLIDER;
        const ball = type === JOINTTYPE_BALL;
        const dof = type === JOINTTYPE_6DOF;

        ATTRIBUTES.forEach((attr) => {
            const field = attr.path?.split('.').pop();
            if (field && !COMMON_FIELDS.has(field)) {
                this._field(field).parent.hidden = true;
            }
        });

        this._field('enableLimits').parent.hidden = !hinge && !ball;
        this._field('limits').parent.hidden = !hinge || !limits;
        this._field('motorSpeed').parent.hidden = !hinge;
        this._field('maxMotorForce').parent.hidden = !hinge;
        LIMIT_FIELDS.slice(1).forEach((field) => {
            this._field(field).parent.hidden = !ball || !limits;
        });
        DOF_FIELDS.forEach((field) => {
            this._field(field).parent.hidden = !dof;
        });
        ['linear', 'angular'].forEach((group) => {
            ['X', 'Y', 'Z'].forEach((axis) => {
                const motion = `${group}Motion${axis}`;
                this._field(`${group}Limits${axis}`).parent.hidden =
                    !dof || this._field(motion).value !== MOTION_LIMITED;
            });
        });
    }

    link(entities: EntityObserver[]) {
        this._suppressToggleFields = true;
        super.link(entities);
        this._suppressToggleFields = false;
        this._toggleFields();
    }
}

export { JointComponentInspector };
