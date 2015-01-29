"use strict"

function Overlay(args) {
    ui.ContainerElement.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.element.classList.add('ui-overlay');

    this.elementOverlay = document.createElement('div');
    this.elementOverlay.classList.add('overlay');
    this.element.appendChild(this.elementOverlay);

    this.elementOverlay.addEventListener('mousedown', function() {
        this.hidden = true;
    }.bind(this), false);

    this.innerElement = document.createElement('div');
    this.innerElement.classList.add('content');
    this.element.appendChild(this.innerElement);
}
Overlay.prototype = Object.create(ui.ContainerElement.prototype);


window.ui.Overlay = Overlay;
