"use strict";

function Bubble(args) {
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this._element.classList.add('ui-bubble');

    var pulseCircle = document.createElement('div');
    pulseCircle.classList.add('pulse');
    this._element.appendChild(pulseCircle);

    var centerCircle = document.createElement('div');
    centerCircle.classList.add('center');
    this._element.appendChild(centerCircle);

    this.on('click', this._onClick);

    if (args.id !== undefined)
        this._element.id = args.id;

    if (args.tabindex !== undefined)
        this._element.setAttribute('tabindex', args.tabindex);
}
Bubble.prototype = Object.create(ui.Element.prototype);

Bubble.prototype._onClick = function () {
    if (this.class.contains('active')) {
        this.deactivate();
    } else {
        this.activate();
    }
};

Bubble.prototype.activate = function () {
    this.class.add('active');
    this.emit('activate');
};

Bubble.prototype.deactivate = function () {
    this.class.remove('active');
    this.emit('deactivate');
};

Bubble.prototype.position = function (x, y) {
    var rect = this._element.getBoundingClientRect();

    var left = (x || 0);
    var top = (y || 0);

    this._element.style.left = (typeof left === 'number') ? left + 'px' : left;
    this._element.style.top = (typeof top === 'number') ? top + 'px' : top;
};

window.ui.Bubble = Bubble;
