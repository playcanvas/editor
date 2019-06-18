"use strict";

function Canvas(args) {
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('canvas');
    this._element.classList.add('ui-canvas');

    if (args.id !== undefined)
        this._element.id = args.id;

    if (args.tabindex !== undefined)
        this._element.setAttribute('tabindex', args.tabindex);

    // Disable I-bar cursor on click+drag
    this._element.onselectstart = this.onselectstart;
}
Canvas.prototype = Object.create(ui.Element.prototype);

Canvas.prototype.onselectstart = function() {
    return false;
};

Canvas.prototype.resize = function(width, height) {
    if (this._element.width === width && this._element.height === height)
        return;

    this._element.width = width;
    this._element.height = height;
    this.emit('resize', this._element.width, this._element.height);
};

Object.defineProperty(Canvas.prototype, 'width', {
    get: function() {
        return this._element.width;
    },
    set: function(value) {
        if (this._element.width === value)
            return;

        this._element.width = value;
        this.emit('resize', this._element.width, this._element.height);
    }
});


Object.defineProperty(Canvas.prototype, 'height', {
    get: function() {
        return this._element.height;
    },
    set: function(value) {
        if (this._element.height === value)
            return;

        this._element.height = value;
        this.emit('resize', this._element.width, this._element.height);
    }
});


window.ui.Canvas = Canvas;
