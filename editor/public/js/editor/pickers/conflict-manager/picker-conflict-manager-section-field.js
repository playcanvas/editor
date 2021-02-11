editor.once('load', function () {
    'use strict';

    // Base class for fields
    var ConflictField = function () {
        this.element = null;
    };

    // Creates a field with the specified value based on the specified type
    ConflictField.create = function (type, value) {
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

    ConflictField.prototype.onAddedToDom = function () {
        // reset height
        this.element.parent.style.height = '';
    };

    // Gets / sets the height of the field
    Object.defineProperty(ConflictField.prototype, 'height', {
        get: function () {
            return this.element.parent.element.clientHeight;
        },
        set: function (value) {
            this.element.parent.style.height = value + 'px';
        }
    });

    // A String field
    var ConflictFieldString = function (value) {
        this.element = new ui.Label({
            text: value + ''
        });
        this.element.class.add('field-string', 'selectable');
    };
    ConflictFieldString.prototype = Object.create(ConflictField.prototype);

    // A Vector field
    var ConflictFieldVector = function (value) {
        var panel = new ui.Panel();
        var vars = ['x: ', 'y: ', 'z: ', 'w: '];
        for (let i = 0; i < value.length; i++) {
            var label = new ui.Label({
                text: vars[i] + value[i] + ''
            });
            label.class.add('selectable');
            panel.append(label);
        }

        this.element = panel;
        this.element.class.add('field-vector');
    };
    ConflictFieldVector.prototype = Object.create(ConflictField.prototype);

    // A Color field
    var ConflictFieldColor = function (value) {
        this.element = new ui.ColorField();
        this.element.value = value.map(function (c) { return c * 255; });
        this.element.class.add('field-color');
    };
    ConflictFieldColor.prototype = Object.create(ConflictField.prototype);

    // A Curve field
    var ConflictFieldCurve = function (value) {
        this.element = new ui.CurveField({
            lineWidth: 3
        });
        this.element.value = value ? [value] : null;
        this.element.class.add('field-curve');
    };
    ConflictFieldCurve.prototype = Object.create(ConflictField.prototype);

    // An Asset field
    var ConflictFieldAsset = function (value) {
        this.element = new ui.Panel();
        this.element.class.add('field-asset');

        if (value && value.name) {
            var labelName = new ui.Label({
                text: value.name
            });
            labelName.class.add('asset-name', 'selectable');
            this.element.append(labelName);
        }

        var labelId = new ui.Label({
            text: value ? 'ID: ' + value.id : value + ''
        });
        labelId.class.add('asset-id', 'selectable');
        this.element.append(labelId);
    };
    ConflictFieldAsset.prototype = Object.create(ConflictField.prototype);

    // An Entity field
    var ConflictFieldEntity = function (value) {
        this.element = new ui.Panel();
        this.element.class.add('field-entity');

        if (value) {
            if (value.deleted) {
                var labelDeleted = new ui.Label({
                    text: 'The following parent was deleted on this branch:'
                });
                labelDeleted.class.add('deleted');
                this.element.append(labelDeleted);
            }

            if (value.name) {
                var labelName = new ui.Label({
                    text: value.name
                });
                labelName.class.add('entity-name', 'selectable');
                this.element.append(labelName);
            }
        }

        var labelId = new ui.Label({
            text: value ? 'GUID: ' + value.id : value + ''
        });
        labelId.class.add('entity-id', 'selectable');
        this.element.append(labelId);
    };
    ConflictFieldEntity.prototype = Object.create(ConflictField.prototype);

    // A Layer field
    var ConflictFieldLayer = function (value) {
        this.element = new ui.Label({
            text: value !== null && value !== undefined ? (value.name || value.id) : value + ''
        });
        this.element.class.add('field-layer', 'selectable');
    };
    ConflictFieldLayer.prototype = Object.create(ConflictField.prototype);

    // A sublayer field
    var ConflictFieldSublayer = function (value) {
        this.element = new ui.Label({
            text: value ? value.layer + ' ' + (value.transparent ? 'Transparent' : 'Opaque') : value
        });
        this.element.class.add('field-sublayer', 'selectable');
    };
    ConflictFieldSublayer.prototype = Object.create(ConflictField.prototype);

    // for JSON just stringify and show value
    var ConflictFieldJson = function (value){
        this.element = new pcui.TextAreaInput({
            readOnly: true,
            value: JSON.stringify(value, null, 2),
            height: 100
        });
        this.element.input.style.lineHeight = 1.1;
        this.element.on('click', (evt) => {
            evt.stopPropagation();
        });
        this.element.class.add('field-json', 'selectable');
    };

    ConflictFieldJson.prototype = Object.create(ConflictField.prototype);

    // A field saying that the object was deleted in one branch
    var ConflictFieldDeleted = function () {
        this.element = new ui.Panel();
        this.element.class.add('field-deleted');

        var label =  new ui.Label({
            text: 'DELETED'
        });
        label.class.add('title');
        this.element.append(label);

        label =  new ui.Label({
            text: 'This item was deleted on this branch'
        });
        this.element.append(label);
    };
    ConflictFieldDeleted.prototype = Object.create(ConflictField.prototype);

    // A field saying that the object was created in this branch
    var ConflictFieldCreated = function () {
        this.element = new ui.Panel();
        this.element.class.add('field-edited');

        var label =  new ui.Label({
            text: 'CREATED'
        });
        label.class.add('title');
        this.element.append(label);

        label =  new ui.Label({
            text: 'This item was created on this branch'
        });
        this.element.append(label);
    };
    ConflictFieldCreated.prototype = Object.create(ConflictField.prototype);

    // A field saying that the object was edited in one branch
    var ConflictFieldEdited = function () {
        this.element = new ui.Panel();
        this.element.class.add('field-edited');

        var label =  new ui.Label({
            text: 'EDITED'
        });
        label.class.add('title');
        this.element.append(label);

        label =  new ui.Label({
            text: 'This item was edited on this branch'
        });
        this.element.append(label);
    };
    ConflictFieldEdited.prototype = Object.create(ConflictField.prototype);

    // A field saying that no value is available
    var ConflictFieldNotAvailable = function (value) {
        this.element = new ui.Label({
            text: 'Not available'
        });
        this.element.class.add('field-missing');
    };
    ConflictFieldNotAvailable.prototype = Object.create(ConflictField.prototype);

    // A field saying that its value is not renderable
    var ConflictFieldNotRenderable = function (value) {
        this.element = new ui.Label({
            text: 'No preview available'
        });
        this.element.class.add('field-missing');
    };
    ConflictFieldNotRenderable.prototype = Object.create(ConflictField.prototype);

    // An array field is a list of other fields
    var ConflictArrayField = function (type, value) {
        this._size = value.length;

        this.element = new ui.Panel();
        this.element.class.add('field-array');
        this._labelSize = new ui.Label({
            text: 'Array Size: ' + this._size
        });
        this._labelSize.class.add('size');
        this.element.append(this._labelSize);

        this._list = new ui.List();

        for (let i = 0; i < this._size; i++) {
            var item = new ui.ListItem();
            var field = ConflictField.create(type, value[i]);
            field.element.class.add('array-' + type);
            item.element.appendChild(field.element.element);
            this._list.append(item);
        }

        this.element.append(this._list);
    };
    ConflictArrayField.prototype = Object.create(ConflictField.prototype);

    Object.defineProperty(ConflictArrayField.prototype, 'size', {
        get: function () {
            return this._size;
        }
    });

    window.ui.ConflictField = ConflictField;
    window.ui.ConflictArrayField = ConflictArrayField;
    window.ui.ConflictFieldDeleted = ConflictFieldDeleted;
    window.ui.ConflictFieldCreated = ConflictFieldCreated;
    window.ui.ConflictFieldEdited = ConflictFieldEdited;
    window.ui.ConflictFieldNotAvailable = ConflictFieldNotAvailable;
    window.ui.ConflictFieldNotRenderable = ConflictFieldNotRenderable;
});
