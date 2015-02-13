"use strict";

function Button(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';

    this.element = document.createElement('div');
    this.element.classList.add('ui-button');
    this.element.innerHTML = this._text;

    this.element.tabIndex = 0;

    // space > click
    this.element.addEventListener('keydown', function(evt) {
        if (evt.keyCode !== 32 || self.disabled)
            return;

        evt.stopPropagation();
        evt.preventDefault();
        self.emit('click');
    }, false);
}
Button.prototype = Object.create(ui.Element.prototype);

Button.prototype._onLinkChange = function(value) {
    this.element.value = value;
};

Object.defineProperty(Button.prototype, 'text', {
    get: function() {
        return this._text;
    },
    set: function(value) {
        if (this._text === value) return;
        this._text = value;
        this.element.innerHTML = this._text;
    }
});


window.ui.Button = Button;
