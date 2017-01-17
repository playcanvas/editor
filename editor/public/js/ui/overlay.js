"use strict"

function Overlay(args) {
    ui.ContainerElement.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this._element.classList.add('ui-overlay', 'center');

    this.elementOverlay = document.createElement('div');
    this.elementOverlay.ui = this;
    this.elementOverlay.classList.add('overlay', 'clickable');
    this._element.appendChild(this.elementOverlay);

    this.elementOverlay.addEventListener('mousedown', this._onMouseDown, false);

    this.innerElement = document.createElement('div');
    this.innerElement.classList.add('content');
    this._element.appendChild(this.innerElement);
}
Overlay.prototype = Object.create(ui.ContainerElement.prototype);

Overlay.prototype._onMouseDown = function(evt) {
    if (! this.ui.clickable)
        return false;

    var self = this;

    // some field might be in focus
    document.body.blur();

    // wait till blur takes in account
    requestAnimationFrame(function() {
        // hide overlay
        self.ui.hidden = true;
    }, 0);

    evt.preventDefault();
};


Object.defineProperty(Overlay.prototype, 'center', {
    get: function() {
        return this._element.classList.contains('center');
    },
    set: function(value) {
        if (value) {
            this._element.classList.add('center');
            this.innerElement.style.left = '';
            this.innerElement.style.top = '';
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

Object.defineProperty(Overlay.prototype, 'clickable', {
    get: function() {
        return this.elementOverlay.classList.contains('clickable');
    },
    set: function(value) {
        if (value) {
            this.elementOverlay.classList.add('clickable');
        } else {
            this.elementOverlay.classList.remove('clickable');
        }
    }
});


Object.defineProperty(Overlay.prototype, 'rect', {
    get: function() {
        return this.innerElement.getBoundingClientRect();
    }
});


Overlay.prototype.position = function(x, y) {

    var area = this.elementOverlay.getBoundingClientRect();
    var rect = this.innerElement.getBoundingClientRect();

    x = Math.max(0, Math.min(area.width - rect.width, x));
    y = Math.max(0, Math.min(area.height - rect.height, y));

    this.innerElement.style.left = x + 'px';
    this.innerElement.style.top = y + 'px';
};


window.ui.Overlay = Overlay;
