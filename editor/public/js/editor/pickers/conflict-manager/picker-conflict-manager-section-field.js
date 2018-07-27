editor.once('load', function () {
    'use strict';

    var ConflictField = function () {
        this.element = null;
    };

    ConflictField.create = function (type, value) {
        switch (type) {
            case 'vec2':
            case 'vec3':
            case 'vec4':
                return new ConflictFieldVector(value);
            default:
                return new ConflictFieldString(value);
        }
    };

    ConflictField.prototype.onAddedToDom = function () {};

    Object.defineProperty(ConflictField.prototype, 'height', {
        get: function () {
            return this.element.element.clientHeight;
        }
    });

    var ConflictFieldString = function (value) {
        this.element = new ui.Label({
            text: value
        });
    };
    ConflictFieldString.prototype = Object.create(ConflictField.prototype);

    var ConflictFieldVector = function (value) {
        var panel = new ui.Panel();
        for (var i = 0; i < value.length; i++) {
            panel.append(new ui.Label({
                text: value[i] + ''
            }));
        }

        this.element = panel;
    };
    ConflictFieldVector.prototype = Object.create(ConflictField.prototype);

    var ConflictArrayField = function (type, value) {
        this._size = value.length;

        this.element = new ui.Panel();
        this._labelSize = new ui.Label({
            text: 'Array Size: ' + this._size
        });
        this._labelSize.class.add('size');
        this.element.append(this._labelSize);

        this._list = new ui.List();

        for (var i = 0; i < this._size; i++) {
            var item = new ui.ListItem();
            var field = ConflictField.create(type, value[i]);
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
    window.ui.ConflictFieldString = ConflictFieldString;
    window.ui.ConflictFieldVector = ConflictFieldString;
    window.ui.ConflictArrayField = ConflictArrayField;

});
