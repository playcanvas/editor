"use strict";

function TextAreaField(args) {
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this._element.classList.add('ui-textarea-field');

    this.elementInput = document.createElement('textarea');
    this.elementInput.ui = this;
    this.elementInput.classList.add('field');
    this.elementInput.tabIndex = 0;
    this.elementInput.addEventListener('focus', this._onInputFocus, false);
    this.elementInput.addEventListener('blur', this._onInputBlur, false);
    this._element.appendChild(this.elementInput);

    if (args.default !== undefined)
        this.value = args.default;

    this.elementInput.addEventListener('change', this._onChange, false);
    this.elementInput.addEventListener('keydown', this._onKeyDown, false);
    this.elementInput.addEventListener('contextmenu', this._onFullSelect, false);
    this.evtKeyChange = false;
    this.ignoreChange = false;

    this.blurOnEnter = args.blurOnEnter !== undefined ? args.blurOnEnter : true;
    this.refocusable = true;

    this.on('disable', this._onDisable);
    this.on('enable', this._onEnable);
    this.on('change', this._onChangeField);

    if (args.placeholder)
        this.placeholder = args.placeholder;
}
TextAreaField.prototype = Object.create(ui.Element.prototype);


TextAreaField.prototype._onLinkChange = function(value) {
    this.elementInput.value = value;
    this.emit('change', value);
};


TextAreaField.prototype._onChange = function() {
    if (this.ui.ignoreChange) return;

    this.ui.value = this.ui.value || '';

    if (! this.ui._link)
        this.ui.emit('change', this.ui.value);
};


TextAreaField.prototype._onKeyDown = function(evt) {
    if (evt.keyCode === 27) {
        this.blur();
    } else if (this.ui.blurOnEnter && evt.keyCode === 13 && ! evt.shiftKey) {
        var focused = false;

        var parent = this.ui.parent;
        while(parent) {
            if (parent.focus) {
                parent.focus();
                focused = true;
                break;
            }

            parent = parent.parent;
        }

        if (! focused)
            this.blur();
    }
};


TextAreaField.prototype._onFullSelect = function() {
    this.select();
};


TextAreaField.prototype.focus = function(select) {
    this.elementInput.focus();
    if (select) this.elementInput.select();
};


TextAreaField.prototype._onInputFocus = function() {
    this.ui.class.add('focus');
    this.ui.emit('input:focus');
};


TextAreaField.prototype._onInputBlur = function() {
    this.ui.class.remove('focus');
    this.ui.emit('input:blur');
};

TextAreaField.prototype._onDisable = function() {
    this.elementInput.readOnly = true;
};

TextAreaField.prototype._onEnable = function() {
    this.elementInput.readOnly = false;
};

TextAreaField.prototype._onChangeField = function() {
    if (! this.renderChanges)
        return;

    this.flash();
};


Object.defineProperty(TextAreaField.prototype, 'value', {
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

            this.elementInput.value = value || '';
            this.emit('change', value);
        }
    }
});


Object.defineProperty(TextAreaField.prototype, 'placeholder', {
    get: function() {
        return this._element.getAttribute('placeholder');
    },
    set: function(value) {
        if (! value) {
            this._element.removeAttribute('placeholder');
        } else {
            this._element.setAttribute('placeholder', value);
        }
    }
});


Object.defineProperty(TextAreaField.prototype, 'keyChange', {
    get: function() {
        return !! this.evtKeyChange;
    },
    set: function(value) {
        if (!! this.evtKeyChange === !! value)
            return;

        if (value) {
            this.elementInput.addEventListener('keyup', this._onChange, false);
        } else {
            this.elementInput.removeEventListener('keyup', this._onChange);
        }
    }
});

window.ui.TextAreaField = TextAreaField;
