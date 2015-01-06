"use strict";

function TextField(args) {
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('input');
    this.element.classList.add('ui-text-field');
    this.element.type = 'text';

    if (args.default !== undefined) {
        this.value = args.default;
    }

    this.element.addEventListener('change', this._onChange.bind(this), false);
}
TextField.prototype = Object.create(ui.Element.prototype);

TextField.prototype._onLinkChange = function(value) {
    this.element.value = value;
    this.emit('change', value);
};

TextField.prototype._onChange = function() {
    this.value = this.element.value || '';

    if (! this._link)
        this.emit('change', this.value);
};

Object.defineProperty(TextField.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this.element.value;
        }
    },
    set: function(value) {
        if (this._link) {
            if (! this._link.set(this.path, value)) {
                this.element.value = this._link.get(this.path);
            }
        } else {
            if (this.element.value === value)
                return;

            this.element.value = value;
            this.emit('change', value);
        }
    }
});


window.ui.TextField = TextField;
