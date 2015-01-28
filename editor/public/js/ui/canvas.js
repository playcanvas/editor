"use strict";

function Canvas(args) {
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';

    this.element = document.createElement('canvas');

    if (args.id !== undefined) {
        this.element.setAttribute('id', args.id);
    }

    if (args.tabindex !== undefined) {
        this.element.setAttribute('tabindex', args.tabindex);
    }

    // Disable I-bar cursor on click+drag
    this.element.onselectstart = function () { return false; };

    this.element.classList.add('ui-canvas');
}

Canvas.prototype = Object.create(ui.Element.prototype);


Canvas.prototype._onChangeDelay = function() {
    this.class.remove('changed');
};


Canvas.prototype._onLinkChange = function(value) {
    this.text = value;
    this.emit('change', value);
};

window.ui.Canvas = Canvas;
