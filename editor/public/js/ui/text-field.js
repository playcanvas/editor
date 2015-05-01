"use strict";

function TextField(args) {
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.element.classList.add('ui-text-field');

    this.elementInput = document.createElement('input');
    this.elementInput.classList.add('field');
    this.elementInput.type = 'text';
    this.elementInput.tabIndex = 0;
    this.elementInput.addEventListener('focus', this._onInputFocus.bind(this), false);
    this.elementInput.addEventListener('blur', this._onInputBlur.bind(this), false);
    this.element.appendChild(this.elementInput);

    if (args.default !== undefined)
        this.value = args.default;

    this.elementInput.addEventListener('change', this._onChange.bind(this), false);
    this.elementInput.addEventListener('keydown', this._onKeyDown.bind(this), false);
    this.evtKeyChange = false;

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


TextField.prototype._onKeyDown = function(evt) {
    if (evt.keyCode === 27)
        this.elementInput.blur();
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
        if (! value) {
            this.element.removeAttribute('placeholder');
        } else {
            this.element.setAttribute('placeholder', value);
        }
    }
});


Object.defineProperty(TextField.prototype, 'keyChange', {
    get: function() {
        return !! this.evtKeyChange;
    },
    set: function(value) {
        if (!! this.evtKeyChange === !! value)
            return;

        if (value) {
            var self = this;
            this.evtKeyChange = function() {
                self._onChange();
            };
            this.elementInput.addEventListener('keyup', this.evtKeyChange, false);
        } else {
            this.elementInput.removeEventListener('keyup', this.evtKeyChange);
            this.evtKeyChange = null;
        }
    }
});


window.ui.TextField = TextField;
