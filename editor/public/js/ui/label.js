"use strict";

function Label(args) {
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';

    // if unsafe is true then use innerHTML for the
    // contents
    this._unsafe = !!args.unsafe;

    this.element = document.createElement('span');
    this._element.classList.add('ui-label');

    if (this._text)
        this._setText(this._text);

    this.on('change', this._onChange);

    if (args.placeholder)
        this.placeholder = args.placeholder;
}
Label.prototype = Object.create(ui.Element.prototype);

Label.prototype._setText = function (text) {
    if (this._unsafe) {
        this._element.innerHTML = text;
    } else {
        this._element.textContent = text;
    }
};

Label.prototype._onChange = function() {
    if (! this.renderChanges)
        return;

    this.flash();
};

Label.prototype._onLinkChange = function(value) {
    this.text = value;
    this.emit('change', value);
};


Object.defineProperty(Label.prototype, 'text', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this._text;
        }
    },
    set: function(value) {
        if (this._link) {
            if (! this._link.set(this.path, value)) {
                value = this._link.get(this.path);
                this._setText(value);
            }
        } else {
            if (this._text === value) return;

            this._text = value;
            if (value === undefined || value === null)
                this._text = '';

            this._setText(this._text);
            this.emit('change', value);
        }
    }
});

Object.defineProperty(Label.prototype, 'value', {
    get: function () {
        return this.text;
    },
    set: function (value) {
        this.text = value;
    }
});

Object.defineProperty(Label.prototype, 'placeholder', {
    get: function() {
        return this._element.getAttribute('placeholder');
    },
    set: function(value) {
        this._element.setAttribute('placeholder', value);
    }
});


window.ui.Label = Label;
