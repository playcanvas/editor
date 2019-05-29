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

    this._ratio = (args.useDevicePixelRatio !== undefined && args.useDevicePixelRatio) ? window.devicePixelRatio : 1;
    this._width = 300;
    this._height = 150;

    // Disable I-bar cursor on click+drag
    this._element.onselectstart = this.onselectstart;
}
Canvas.prototype = Object.create(ui.Element.prototype);

Canvas.prototype.onselectstart = function() {
    return false;
};

Canvas.prototype.resize = function(width, height) {
    if (this._width === width && this._height === height)
        return;

    this._width = width;
    this._height = height;
    this._element.style.width = width + 'px';
    this._element.style.height = height + 'px';
    this._element.width = width * this._ratio;
    this._element.height = height * this._ratio;
    this.emit('resize', width, height);
};

Object.defineProperty(Canvas.prototype, 'width', {
    get: function() {
        return this._width;
    },
    set: function(value) {
        if (this._width === value)
            return;

        this._element.style.width = value * 'px';
        this._element.width = value * this._ratio;
        this.emit('resize', this._width, this._height);
    }
});

Object.defineProperty(Canvas.prototype, 'height', {
    get: function() {
        return this._height;
    },
    set: function(value) {
        if (this._height === value)
            return;

        this._element.style.height = value + 'px';
        this._element.height = value * this._ratio;
        this.emit('resize', this._width, this._height);
    }
});

Object.defineProperty(Canvas.prototype, 'pixelWidth', {
    get: function() {
        return this._width * this._ratio;
    }
});

Object.defineProperty(Canvas.prototype, 'pixelHeight', {
    get: function() {
        return this._height * this._ratio;
    }
});

Object.defineProperty(Canvas.prototype, 'pixelRatio', {
    get: function() {
        return this._ratio;
    }
});

window.ui.Canvas = Canvas;
