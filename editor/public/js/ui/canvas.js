"use strict";

function Canvas(args) {
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('canvas');
    this.class.add('ui-canvas');

    this.element.ui = this;

    if (args.id !== undefined)
        this.element.id = args.id;

    if (args.tabindex !== undefined)
        this.element.setAttribute('tabindex', args.tabindex);

    // Disable I-bar cursor on click+drag
    this.element.onselectstart = function () {
        return false;
    };
}

Canvas.prototype = Object.create(ui.Element.prototype);


Object.defineProperty(Canvas.prototype, 'width', {
    get: function() {
        return this.element.width;
    },
    set: function(value) {
        if (this.element.width === value)
            return;

        this.element.width = value;
        this.emit('resize', this.element.width, this.element.height);
    }
});


Object.defineProperty(Canvas.prototype, 'height', {
    get: function() {
        return this.element.height;
    },
    set: function(value) {
        if (this.element.height === value)
            return;

        this.element.height = value;
        this.emit('resize', this.element.width, this.element.height);
    }
});


Canvas.prototype.resize = function(width, height) {
    if (this.element.width === width && this.element.height === height)
        return;

    this.element.width = width;
    this.element.height = height;
    this.emit('resize', this.element.width, this.element.height);
};


window.ui.Canvas = Canvas;
