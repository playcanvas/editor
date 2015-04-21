"use strict";

function Label(args) {
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';

    this.element = document.createElement('label');
    this.element.classList.add('ui-label');
    this.element.innerHTML = this._text;
    // this.element.title = this._text;

    this.on('change', function() {
        if (! this.renderChanges)
            return;

        this.flash();
    });

    if (args.placeholder)
        this.placeholder = args.placeholder;
}
Label.prototype = Object.create(ui.Element.prototype);


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
                this.element.innerHTML = this._link.get(this.path);
                this.element.title = this.element.innerHTML;
            }
        } else {
            if (this._text === value) return;
            this._text = value;
            this.element.innerHTML = this._text;
            this.element.title = this._text;
            this.emit('change', value);
        }
    }
});

Object.defineProperty(Label.prototype, 'placeholder', {
    get: function() {
        return this.element.getAttribute('placeholder');
    },
    set: function(value) {
        this.element.setAttribute('placeholder', value);
    }
});


window.ui.Label = Label;
