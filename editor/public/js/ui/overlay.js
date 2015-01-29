"use strict"

function Overlay(args) {
    ui.ContainerElement.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.element.classList.add('ui-overlay', 'center');

    this.elementOverlay = document.createElement('div');
    this.elementOverlay.classList.add('overlay');
    this.element.appendChild(this.elementOverlay);

    this.elementOverlay.addEventListener('mousedown', function() {
        // some field might be in focus
        document.body.blur();

        // wait till blur takes in account
        setTimeout(function() {
            // hide overlay
            this.hidden = true;
        }.bind(this), 0);
    }.bind(this), false);

    this.innerElement = document.createElement('div');
    this.innerElement.classList.add('content');
    this.element.appendChild(this.innerElement);
}
Overlay.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(Overlay.prototype, 'center', {
    get: function() {
        return this._element.classList.contains('center');
    },
    set: function(value) {
        if (value) {
            this._element.classList.add('center');
        } else {
            this._element.classList.remove('center');
        }
    }
});


Object.defineProperty(Overlay.prototype, 'transparent', {
    get: function() {
        return this._element.classList.contains('transparent');
    },
    set: function(value) {
        if (value) {
            this._element.classList.add('transparent');
        } else {
            this._element.classList.remove('transparent');
        }
    }
});


Object.defineProperty(Overlay.prototype, 'rect', {
    get: function() {
        return this.innerElement.getBoundingClientRect();
    }
});


Overlay.prototype.position = function(x, y) {
    this.innerElement.style.left = x + 'px';
    this.innerElement.style.top = y + 'px';
};


window.ui.Overlay = Overlay;
