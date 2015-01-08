"use strict";

function Label(text) {
    ui.Element.call(this);

    this._text = text || '';

    this.element = document.createElement('label');
    this.element.classList.add('ui-label');
    this.element.innerHTML = this._text;
    this.element.title = this._text;
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


window.ui.Label = Label;
