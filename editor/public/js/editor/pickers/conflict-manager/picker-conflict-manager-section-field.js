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
            case 'entity':
                return new ConflictFieldEntity(value);
            case 'vec2':
            case 'vec3':
            case 'vec4':
                return new ConflictFieldVector(value);
            case 'rgb':
            case 'rgba':
                return new ConflictFieldColor(value);
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
            text: value
        });
        this.element.class.add('field-string', 'selectable');
    };
    ConflictFieldString.prototype = Object.create(ConflictField.prototype);

    // A Vector field
    var ConflictFieldVector = function (value) {
        var panel = new ui.Panel();
        for (var i = 0; i < value.length; i++) {
            var label = new ui.Label({
                text: value[i] + ''
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
        this.element.value = value;
        this.element.class.add('field-color');
    };
    ConflictFieldColor.prototype = Object.create(ConflictField.prototype);

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
            text: 'ID: ' + (value && value.id)
        });
        labelId.class.add('asset-id', 'selectable');
        this.element.append(labelId);
    };
    ConflictFieldAsset.prototype = Object.create(ConflictField.prototype);

    // An Entity field
    var ConflictFieldEntity = function (value) {
        this.element = new ui.Panel();
        this.element.class.add('field-entity');

        if (value && value.name) {
            var labelName = new ui.Label({
                text: value.name
            });
            labelName.class.add('entity-name', 'selectable');
            this.element.append(labelName);
        }

        var labelId = new ui.Label({
            text: 'GUID: ' + (value && value.id)
        });
        labelId.class.add('entity-id', 'selectable');
        this.element.append(labelId);
    };
    ConflictFieldEntity.prototype = Object.create(ConflictField.prototype);

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

        for (var i = 0; i < this._size; i++) {
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
});
