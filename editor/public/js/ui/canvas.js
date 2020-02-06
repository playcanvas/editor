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

    this._width = 300;
    this._height = 150;
    this._ratio = (args.useDevicePixelRatio !== undefined && args.useDevicePixelRatio) ? window.devicePixelRatio : 1;

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
    this._element.width = this.pixelWidth;
    this._element.height = this.pixelHeight;
    this._element.style.width = width + 'px';
    this._element.style.height = height + 'px';
    this.emit('resize', width, height);
};

Object.defineProperty(Canvas.prototype, 'width', {
    get: function() {
        return this._width;
    },
    set: function(value) {
        if (this._width === value)
            return;

        this._width = value;
        this._element.width = this.pixelWidth;
        this._element.style.width = value * 'px';
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

        this._height = value;
        this._element.height = this.pixelHeight;
        this._element.style.height = value + 'px';
        this.emit('resize', this._width, this._height);
    }
});

Object.defineProperty(Canvas.prototype, 'pixelWidth', {
    get: function() {
        return Math.floor(this._width * this._ratio);
    }
});

Object.defineProperty(Canvas.prototype, 'pixelHeight', {
    get: function() {
        return Math.floor(this._height * this._ratio);
    }
});

Object.defineProperty(Canvas.prototype, 'pixelRatio', {
    get: function() {
        return this._ratio;
    }
});

window.ui.Canvas = Canvas;
