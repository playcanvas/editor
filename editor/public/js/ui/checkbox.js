"use strict";

function Checkbox(args) {
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';

    this.element = document.createElement('div');
    this._element.classList.add('ui-checkbox', 'noSelect');
    this._element.tabIndex = 0;

    this._element.addEventListener('keydown', this._onKeyDown, false);

    this.on('click', this._onClick);
    this.on('change', this._onChange);
}
Checkbox.prototype = Object.create(ui.Element.prototype);


Checkbox.prototype._onClick = function() {
    this.value = ! this.value;
    this._element.blur();
};

Checkbox.prototype._onChange = function() {
    if (! this.renderChanges)
        return;

    this.flash();
};

Checkbox.prototype._onKeyDown = function(evt) {
    if (evt.keyCode === 27)
        return this.blur();

    if (evt.keyCode !== 32 || this.ui.disabled)
        return;

    evt.stopPropagation();
    evt.preventDefault();
    this.ui.value = ! this.ui.value;
};

Checkbox.prototype._onLinkChange = function(value) {
    if (value === null) {
        this._element.classList.remove('checked');
        this._element.classList.add('null');
    } else if (value) {
        this._element.classList.add('checked');
        this._element.classList.remove('null');
    } else {
        this._element.classList.remove('checked', 'null');
    }
    this.emit('change', value);
};


Object.defineProperty(Checkbox.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this._element.classList.contains('checked');
        }
    },
    set: function(value) {
        if (this._link) {
            this._link.set(this.path, value);
        } else {
            if (this._element.classList.contains('checked') !== value)
                this._onLinkChange(value);
        }
    }
});


window.ui.Checkbox = Checkbox;
