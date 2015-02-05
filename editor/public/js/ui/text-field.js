"use strict";

function TextField(args) {
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.element.classList.add('ui-text-field');

    this.elementInput = document.createElement('input');
    this.elementInput.classList.add('field');
    this.elementInput.type = 'text';
    this.elementInput.addEventListener('focus', this._onInputFocus.bind(this), false);
    this.elementInput.addEventListener('blur', this._onInputBlur.bind(this), false);
    this.element.appendChild(this.elementInput);

    if (args.default !== undefined) {
        this.value = args.default;
    }

    this.elementInput.addEventListener('change', this._onChange.bind(this), false);

    this.on('disable', function() {
        this.elementInput.disabled = true;
    });
    this.on('enable', function() {
        this.elementInput.disabled = false;
    });

    this.on('change', function() {
        if (! this.renderChanges)
            return;

        this.flash();
    });

    if (args.placeholder)
        this.placeholder = args.placeholder;
}
TextField.prototype = Object.create(ui.Element.prototype);


TextField.prototype._onLinkChange = function(value) {
    this.elementInput.value = value;
    this.emit('change', value);
};

TextField.prototype._onChange = function() {
    this.value = this.elementInput.value || '';

    if (! this._link)
        this.emit('change', this.value);
};

TextField.prototype._onInputFocus = function() {
    this.class.add('focus');
};

TextField.prototype._onInputBlur = function() {
    this.class.remove('focus');
};

Object.defineProperty(TextField.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this.elementInput.value;
        }
    },
    set: function(value) {
        if (this._link) {
            if (! this._link.set(this.path, value)) {
                this.elementInput.value = this._link.get(this.path);
            }
        } else {
            if (this.elementInput.value === value)
                return;

            this.elementInput.value = value;
            this.emit('change', value);
        }
    }
});

Object.defineProperty(TextField.prototype, 'placeholder', {
    get: function() {
        return this.element.getAttribute('placeholder');
    },
    set: function(value) {
        this.element.setAttribute('placeholder', value);
    }
});


window.ui.TextField = TextField;
