"use strict";

function Button(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';

    this.element = document.createElement('div');
    this._element.classList.add('ui-button');
    this._element.innerHTML = this._text;

    this._element.ui = this;
    this._element.tabIndex = 0;

    // space > click
    this._element.addEventListener('keydown', this._onKeyDown, false);
    this.on('click', this._onClick);
}
Button.prototype = Object.create(ui.Element.prototype);

Button.prototype._onKeyDown = function(evt) {
    if (evt.keyCode === 27)
        return this.blur();

    if (evt.keyCode !== 32 || this.ui.disabled)
        return;

    evt.stopPropagation();
    evt.preventDefault();
    this.ui.emit('click');
};

Button.prototype._onClick = function() {
    this._element.blur();
};

Button.prototype._onLinkChange = function(value) {
    this._element.value = value;
};

Object.defineProperty(Button.prototype, 'text', {
    get: function() {
        return this._text;
    },
    set: function(value) {
        if (this._text === value) return;
        this._text = value;
        this._element.innerHTML = this._text;
    }
});

window.ui.Button = Button;
