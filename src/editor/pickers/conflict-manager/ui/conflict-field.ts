import { TextAreaInput } from '@playcanvas/pcui';

import { LegacyColorField } from '@/common/ui/color-field';
import { LegacyCurveField } from '@/common/ui/curve-field';
import { LegacyLabel } from '@/common/ui/label';
import { LegacyList } from '@/common/ui/list';
import { LegacyListItem } from '@/common/ui/list-item';
import { LegacyPanel } from '@/common/ui/panel';

// Base class for fields
class ConflictField {
    constructor() {
        this.element = null;
    }

    onAddedToDom() {
        // reset height
        this.element.parent.style.height = '';
    }

    // Gets / sets the height of the field
    set height(value) {
        this.element.parent.style.height = `${value}px`;
    }

    get height() {
        return this.element.parent.element.clientHeight;
    }
}

// A String field
class ConflictFieldString extends ConflictField {
    constructor(value: unknown) {
        super();

        this.element = new LegacyLabel({
            text: `${value}`
        });
        this.element.class.add('field-string', 'selectable');
    }
}

// A Vector field
class ConflictFieldVector extends ConflictField {
    constructor(value: number[]) {
        super();

        const panel = new LegacyPanel();
        const vars = ['x: ', 'y: ', 'z: ', 'w: '];
        for (let i = 0; i < value.length; i++) {
            const label = new LegacyLabel({
                text: `${vars[i] + value[i]}`
            });
            label.class.add('selectable');
            panel.append(label);
        }

        this.element = panel;
        this.element.class.add('field-vector');
    }
}

// A Color field
class ConflictFieldColor extends ConflictField {
    constructor(value: number[]) {
        super();

        this.element = new LegacyColorField();
        this.element.value = value.map((c: number) => {
            return c * 255;
        });
        this.element.class.add('field-color');
    }
}

// A Curve field
class ConflictFieldCurve extends ConflictField {
    constructor(value: unknown) {
        super();

        this.element = new LegacyCurveField({
            lineWidth: 3
        });
        this.element.value = value ? [value] : null;
        this.element.class.add('field-curve');
    }
}

// An Asset field
class ConflictFieldAsset extends ConflictField {
    constructor(value: { id?: unknown; name?: string } | null) {
        super();

        this.element = new LegacyPanel();
        this.element.class.add('field-asset');

        if (value && value.name) {
            const labelName = new LegacyLabel({
                text: value.name
            });
            labelName.class.add('asset-name', 'selectable');
            this.element.append(labelName);
        }

        const labelId = new LegacyLabel({
            text: value ? `ID: ${value.id}` : `${value}`
        });
        labelId.class.add('asset-id', 'selectable');
        this.element.append(labelId);
    }
}

// An Entity field
class ConflictFieldEntity extends ConflictField {
    constructor(value: { id?: unknown; name?: string; deleted?: boolean } | null) {
        super();

        this.element = new LegacyPanel();
        this.element.class.add('field-entity');

        if (value) {
            if (value.deleted) {
                const labelDeleted = new LegacyLabel({
                    text: 'The following parent was deleted on this branch:'
                });
                labelDeleted.class.add('deleted');
                this.element.append(labelDeleted);
            }

            if (value.name) {
                const labelName = new LegacyLabel({
                    text: value.name
                });
                labelName.class.add('entity-name', 'selectable');
                this.element.append(labelName);
            }
        }

        const labelId = new LegacyLabel({
            text: value ? `GUID: ${value.id}` : `${value}`
        });
        labelId.class.add('entity-id', 'selectable');
        this.element.append(labelId);
    }
}

// A Layer field
class ConflictFieldLayer extends ConflictField {
    constructor(value: { id?: unknown; name?: string } | null) {
        super();

        this.element = new LegacyLabel({
            text: value !== null && value !== undefined ? (value.name || value.id) : `${value}`
        });
        this.element.class.add('field-layer', 'selectable');
    }
}

// A sublayer field
class ConflictFieldSublayer extends ConflictField {
    constructor(value: { layer?: unknown; transparent?: boolean } | null) {
        super();

        this.element = new LegacyLabel({
            text: value ? `${value.layer} ${value.transparent ? 'Transparent' : 'Opaque'}` : value
        });
        this.element.class.add('field-sublayer', 'selectable');
    }
}

// for JSON just stringify and show value
class ConflictFieldJson extends ConflictField {
    constructor(value: unknown) {
        super();

        this.element = new TextAreaInput({
            readOnly: true,
            value: JSON.stringify(value, null, 2),
            height: 100
        });
        this.element.input.style.lineHeight = 1.1;
        this.element.on('click', (evt: MouseEvent) => {
            evt.stopPropagation();
        });
        this.element.class.add('field-json', 'selectable');
    }
}

// A field saying that the object was deleted in one branch
class ConflictFieldDeleted extends ConflictField {
    constructor() {
        super();

        this.element = new LegacyPanel();
        this.element.class.add('field-deleted');

        let label =  new LegacyLabel({
            text: 'DELETED'
        });
        label.class.add('title');
        this.element.append(label);

        label =  new LegacyLabel({
            text: 'This item was deleted on this branch'
        });
        this.element.append(label);
    }
}

// A field saying that the object was created in this branch
class ConflictFieldCreated extends ConflictField {
    constructor() {
        super();

        this.element = new LegacyPanel();
        this.element.class.add('field-edited');

        let label =  new LegacyLabel({
            text: 'CREATED'
        });
        label.class.add('title');
        this.element.append(label);

        label =  new LegacyLabel({
            text: 'This item was created on this branch'
        });
        this.element.append(label);
    }
}

// A field saying that the object was edited in one branch
class ConflictFieldEdited extends ConflictField {
    constructor() {
        super();

        this.element = new LegacyPanel();
        this.element.class.add('field-edited');

        let label =  new LegacyLabel({
            text: 'EDITED'
        });
        label.class.add('title');
        this.element.append(label);

        label =  new LegacyLabel({
            text: 'This item was edited on this branch'
        });
        this.element.append(label);
    }
}

// A field saying that no value is available
class ConflictFieldNotAvailable extends ConflictField {
    constructor() {
        super();

        this.element = new LegacyLabel({
            text: 'Not available'
        });
        this.element.class.add('field-missing');
    }
}

// A field saying that its value is not renderable
class ConflictFieldNotRenderable extends ConflictField {
    constructor() {
        super();

        this.element = new LegacyLabel({
            text: 'No preview available'
        });
        this.element.class.add('field-missing');
    }
}

// An array field is a list of other fields
class ConflictArrayField extends ConflictField {
    constructor(type: string, value: unknown[]) {
        super();

        this._size = value.length;

        this.element = new LegacyPanel();
        this.element.class.add('field-array');
        this._labelSize = new LegacyLabel({
            text: `Array Size: ${this._size}`
        });
        this._labelSize.class.add('size');
        this.element.append(this._labelSize);

        this._list = new LegacyList();

        for (let i = 0; i < this._size; i++) {
            const item = new LegacyListItem();
            const field = ConflictField.create(type, value[i]);
            field.element.class.add(`array-${type}`);
            item.element.appendChild(field.element.element);
            this._list.append(item);
        }

        this.element.append(this._list);
    }

    get size() {
        return this._size;
    }
}

// Creates a field with the specified value based on the specified type
ConflictField.create = function (type: string, value: unknown) {
    switch (type) {
        case 'asset':
            return new ConflictFieldAsset(value);
        case 'curve':
        case 'curveset':
            return new ConflictFieldCurve(value);
        case 'entity':
            return new ConflictFieldEntity(value);
        case 'layer':
        case 'batchGroup':
            return new ConflictFieldLayer(value);
        case 'sublayer':
            return new ConflictFieldSublayer(value);
        case 'vec2':
        case 'vec3':
        case 'vec4':
            return new ConflictFieldVector(value);
        case 'rgb':
        case 'rgba':
            return new ConflictFieldColor(value);
        case 'json':
            return new ConflictFieldJson(value);
        case 'object':
            return new ConflictFieldNotRenderable();
        default:
            return new ConflictFieldString(value);
    }
};

export {
    ConflictArrayField,
    ConflictField,
    ConflictFieldCreated,
    ConflictFieldDeleted,
    ConflictFieldEdited,
    ConflictFieldNotAvailable,
    ConflictFieldNotRenderable
};
