"use strict";

function TextField(args) {
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.element.classList.add('ui-text-field');

    this.elementInput = document.createElement('input');
    this.elementInput.ui = this;
    this.elementInput.classList.add('field');
    this.elementInput.type = 'text';
    this.elementInput.tabIndex = 0;
    this.elementInput.addEventListener('focus', this._onInputFocus, false);
    this.elementInput.addEventListener('blur', this._onInputBlur, false);
    this.element.appendChild(this.elementInput);

    if (args.default !== undefined)
        this.value = args.default;

    this.elementInput.addEventListener('change', this._onChange, false);
    this.elementInput.addEventListener('keydown', this._onKeyDown, false);
    this.elementInput.addEventListener('dblclick', this._onFullSelect, false);
    this.elementInput.addEventListener('contextmenu', this._onFullSelect, false);
    this.evtKeyChange = false;
    this.ignoreChange = false;

    this.blurOnEnter = true;
    this.refocusable = true;

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
    if (this.ui.ignoreChange) return;

    this.ui.value = this.ui.value || '';

    if (! this.ui._link)
        this.ui.emit('change', this.ui.value);
};


TextField.prototype._onKeyDown = function(evt) {
    if (evt.keyCode === 27) {
        this.blur();
    } else if (this.ui.blurOnEnter && evt.keyCode === 13) {
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


TextField.prototype._onFullSelect = function() {
    this.select();
};


TextField.prototype.focus = function(select) {
    this.elementInput.focus();
    if (select) this.elementInput.select();
};


TextField.prototype._onInputFocus = function() {
    this.ui.class.add('focus');
    this.ui.emit('input:focus');
};


TextField.prototype._onInputBlur = function() {
    this.ui.class.remove('focus');
    this.ui.emit('input:blur');
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

            this.elementInput.value = value || '';
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


Object.defineProperty(TextField.prototype, 'proxy', {
    get: function() {
        return this.element.getAttribute('proxy');
    },
    set: function(value) {
        if (! value) {
            this.element.removeAttribute('proxy');
        } else {
            this.element.setAttribute('proxy', value);
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
            this.elementInput.addEventListener('keyup', this._onChange, false);
        } else {
            this.elementInput.removeEventListener('keyup', this._onChange);
        }
    }
});


window.ui.TextField = TextField;
