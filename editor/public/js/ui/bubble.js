"use strict";

function Bubble(args) {
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.class.add('ui-bubble');

    var pulseCircle = document.createElement('div');
    pulseCircle.classList.add('pulse');
    this.element.appendChild(pulseCircle);

    var centerCircle = document.createElement('div');
    centerCircle.classList.add('center');
    this.element.appendChild(centerCircle);

    var self = this;
    this.on('click', function () {
        if (self.class.contains('active')) {
            self.deactivate();
        } else {
            self.activate();
        }
    });

    if (args.id !== undefined)
        this.element.id = args.id;

    if (args.tabindex !== undefined)
        this.element.setAttribute('tabindex', args.tabindex);

}

Bubble.prototype = Object.create(ui.Element.prototype);

Bubble.prototype.activate = function () {
    this.class.add('active');
    this.emit('activate');
};

Bubble.prototype.deactivate = function () {
    this.class.remove('active');
    this.emit('deactivate');
};

Bubble.prototype.position = function (x, y) {
    var rect = this.element.getBoundingClientRect();

    var left = (x || 0);
    var top = (y || 0);

    this.element.style.left = left + 'px';
    this.element.style.top = top + 'px';
};

window.ui.Bubble = Bubble;
