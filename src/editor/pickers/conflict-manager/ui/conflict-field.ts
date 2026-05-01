import { ColorPicker, Container, type Element, Label, TextAreaInput } from '@playcanvas/pcui';

import { CurveInput } from '@/common/pcui/element/element-curve-input';

// Base class for fields
class ConflictField {
    element: Element = null;

    onAddedToDom() {
        // reset height
        this.element.parent.style.height = '';
    }

    // Gets / sets the height of the field
    set height(value: number) {
        this.element.parent.style.height = `${value}px`;
    }

    get height() {
        return this.element.parent.element.clientHeight;
    }

    static create(type: string, value: unknown): ConflictField {
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
    }
}

// A String field
class ConflictFieldString extends ConflictField {
    constructor(value: unknown) {
        super();

        this.element = new Label({
            class: ['field-string', 'selectable'],
            text: `${value}`
        });
    }
}

// A Vector field
class ConflictFieldVector extends ConflictField {
    constructor(value: number[]) {
        super();

        const container = new Container({
            class: 'field-vector'
        });
        const vars = ['x: ', 'y: ', 'z: ', 'w: '];
        for (let i = 0; i < value.length; i++) {
            const label = new Label({
                class: 'selectable',
                text: `${vars[i] + value[i]}`
            });
            container.append(label);
        }

        this.element = container;
    }
}

// A Color field
class ConflictFieldColor extends ConflictField {
    constructor(value: number[]) {
        super();

        this.element = new ColorPicker({
            class: 'field-color',
            value: value,
            channels: value.length,
            readOnly: true
        });
    }
}

// A Curve field
class ConflictFieldCurve extends ConflictField {
    constructor(value: unknown) {
        super();

        const curve = new CurveInput({
            class: 'field-curve',
            readOnly: true
        });
        curve.value = value ? [value] : null;
        this.element = curve;
    }
}

// An Asset field
class ConflictFieldAsset extends ConflictField {
    constructor(value: { id?: unknown; name?: string } | null) {
        super();

        const container = new Container({
            class: 'field-asset'
        });

        if (value && value.name) {
            const labelName = new Label({
                class: ['asset-name', 'selectable'],
                text: value.name
            });
            container.append(labelName);
        }

        const labelId = new Label({
            class: ['asset-id', 'selectable'],
            text: value ? `ID: ${value.id}` : `${value}`
        });
        container.append(labelId);

        this.element = container;
    }
}

// An Entity field
class ConflictFieldEntity extends ConflictField {
    constructor(value: { id?: unknown; name?: string; deleted?: boolean } | null) {
        super();

        const container = new Container({
            class: 'field-entity'
        });

        if (value) {
            if (value.deleted) {
                const labelDeleted = new Label({
                    class: 'deleted',
                    text: 'The following parent was deleted on this branch:'
                });
                container.append(labelDeleted);
            }

            if (value.name) {
                const labelName = new Label({
                    class: ['entity-name', 'selectable'],
                    text: value.name
                });
                container.append(labelName);
            }
        }

        const labelId = new Label({
            class: ['entity-id', 'selectable'],
            text: value ? `GUID: ${value.id}` : `${value}`
        });
        container.append(labelId);

        this.element = container;
    }
}

// A Layer field
class ConflictFieldLayer extends ConflictField {
    constructor(value: { id?: unknown; name?: string } | null) {
        super();

        this.element = new Label({
            class: ['field-layer', 'selectable'],
            text: value !== null && value !== undefined ? `${value.name || value.id}` : `${value}`
        });
    }
}

// A sublayer field
class ConflictFieldSublayer extends ConflictField {
    constructor(value: { layer?: unknown; transparent?: boolean } | null) {
        super();

        this.element = new Label({
            class: ['field-sublayer', 'selectable'],
            text: value ? `${value.layer} ${value.transparent ? 'Transparent' : 'Opaque'}` : `${value}`
        });
    }
}

// for JSON just stringify and show value
class ConflictFieldJson extends ConflictField {
    constructor(value: unknown) {
        super();

        const textarea = new TextAreaInput({
            class: ['field-json', 'selectable'],
            readOnly: true,
            value: JSON.stringify(value, null, 2),
            height: 100
        });
        textarea.input.style.lineHeight = '1.1';
        textarea.on('click', (evt: MouseEvent) => {
            evt.stopPropagation();
        });
        this.element = textarea;
    }
}

// A field saying that the object was deleted in one branch
class ConflictFieldDeleted extends ConflictField {
    constructor() {
        super();

        const container = new Container({
            class: 'field-deleted'
        });

        const title = new Label({
            class: 'title',
            text: 'DELETED'
        });
        container.append(title);

        const message = new Label({
            text: 'This item was deleted on this branch'
        });
        container.append(message);

        this.element = container;
    }
}

// A field saying that the object was created in this branch
class ConflictFieldCreated extends ConflictField {
    constructor() {
        super();

        const container = new Container({
            class: 'field-edited'
        });

        const title = new Label({
            class: 'title',
            text: 'CREATED'
        });
        container.append(title);

        const message = new Label({
            text: 'This item was created on this branch'
        });
        container.append(message);

        this.element = container;
    }
}

// A field saying that the object was edited in one branch
class ConflictFieldEdited extends ConflictField {
    constructor() {
        super();

        const container = new Container({
            class: 'field-edited'
        });

        const title = new Label({
            class: 'title',
            text: 'EDITED'
        });
        container.append(title);

        const message = new Label({
            text: 'This item was edited on this branch'
        });
        container.append(message);

        this.element = container;
    }
}

// A field saying that no value is available
class ConflictFieldNotAvailable extends ConflictField {
    constructor() {
        super();

        this.element = new Label({
            class: 'field-missing',
            text: 'Not available'
        });
    }
}

// A field saying that its value is not renderable
class ConflictFieldNotRenderable extends ConflictField {
    constructor() {
        super();

        this.element = new Label({
            class: 'field-missing',
            text: 'No preview available'
        });
    }
}

// An array field is a list of other fields
class ConflictArrayField extends ConflictField {
    private _size: number;

    private _labelSize: Label;

    private _list: Container;

    constructor(type: string, value: unknown[]) {
        super();

        this._size = value.length;

        const container = new Container({
            class: 'field-array'
        });

        this._labelSize = new Label({
            class: 'size',
            text: `Array Size: ${this._size}`
        });
        container.append(this._labelSize);

        this._list = new Container({
            class: 'field-array-list'
        });

        for (let i = 0; i < this._size; i++) {
            const item = new Container({
                class: 'field-array-item'
            });
            const field = ConflictField.create(type, value[i]);
            field.element.class.add(`array-${type}`);
            item.append(field.element);
            this._list.append(item);
        }

        container.append(this._list);

        this.element = container;
    }

    get size() {
        return this._size;
    }
}

export {
    ConflictArrayField,
    ConflictField,
    ConflictFieldCreated,
    ConflictFieldDeleted,
    ConflictFieldEdited,
    ConflictFieldNotAvailable,
    ConflictFieldNotRenderable
};
