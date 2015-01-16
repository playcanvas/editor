"use strict";

function Panel(header) {
    var self = this;

    ui.ContainerElement.call(this);

    this.element = document.createElement('div');
    this.element.classList.add('ui-panel', 'noHeader', 'noAnimation');

    // header
    // this.headerElement = document.createElement('header');
    // this.headerElement.classList.add('ui-header');
    // this.headerElement.textContent = header || '';
    // if (! this.headerElement.textContent) {
    //     this.class.add('noHeader');
    // }
    // this.element.appendChild(this.headerElement);

    this.headerElement = null;

    if (header)
        this.header = header;

    // // folding
    // this.headerElement.addEventListener('click', function() {
    //     if (! self.foldable) return;
    //     self.folded = ! self.folded;
    // }, false);

    this.on('nodesChanged', function() {
        if (! this.foldable || this.folded || this.horizontal)
            return;

        this.style.height = (32 + this.innerElement.clientHeight) + 'px';
    });

    // content
    this.innerElement = document.createElement('div');
    this.innerElement.classList.add('content');
    this.element.appendChild(this.innerElement);

    // HACK
    // skip 2 frames before enabling transitions
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            this.class.remove('noAnimation');
        }.bind(this));
    }.bind(this));

    // on parent change
    this.on('parent', function() {
        // HACK
        // wait till DOM parses, then reflow
        requestAnimationFrame(this._reflow.bind(this));
    });

    this._handleElement = null;
    this._handle = null;
    this._resizeData = null;
    this._resizeLimits = {
        min: 0,
        max: Infinity
    };
}
Panel.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(Panel.prototype, 'header', {
    get: function() {
        return (this.headerElement && this.headerElement.textContent) || '';
    },
    set: function(value) {
        if (! this.headerElement && value) {
            this.headerElement = document.createElement('header');
            this.headerElement.classList.add('ui-header');
            this.headerElement.textContent = value;

            var first = this.element.firstChild;
            if (first) {
                this.element.insertBefore(this.headerElement, first);
            } else {
                this.element.appendChild(this.headerElement);
            }

            this.class.remove('noHeader');

            var self = this;

            // folding
            this.headerElement.addEventListener('click', function() {
                if (! self.foldable) return;
                self.folded = ! self.folded;
            }, false);
        } else if (! value && this.headerElement) {
            this.headerElement.parentNode.removeChild(this.headerElement);
            this.headerElement = null;
            this.class.add('noHeader');
        } else {
            this.headerElement.textContent = value || '';
            this.class.remove('noHeader');
        }
    }
});


Panel.prototype._reflow = function() {
    if (this.folded) {
        if (this.horizontal) {
            this.style.height = '';
            this.style.width = '32px';
        } else {
            this.style.height = '32px';
        }
    } else if (this.foldable) {
        if (this.horizontal) {
            this.style.height = '';
            this.style.width = this._innerElement.clientWidth + 'px';
        } else {
            this.style.height = (32 + this._innerElement.clientHeight) + 'px';
        }
    }
};


Object.defineProperty(Panel.prototype, 'foldable', {
    get: function() {
        return this.class.contains('foldable');
    },
    set: function(value) {
        if (value) {
            this.class.add('foldable');

            if(this.class.contains('folded'))
                this.emit('fold');
        } else {
            this.class.remove('foldable');

            if (this.class.contains('folded'))
                this.emit('unfold');
        }

        this._reflow();
    }
});


Object.defineProperty(Panel.prototype, 'folded', {
    get: function() {
        return this.class.contains('foldable') && this.class.contains('folded');
    },
    set: function(value) {
        if (value) {
            this.class.add('folded');

            if (this.class.contains('foldable'))
                this.emit('fold');
        } else {
            this.class.remove('folded');

            if (this.class.contains('foldable'))
                this.emit('unfold');
        }

        this._reflow();
    }
});


Object.defineProperty(Panel.prototype, 'horizontal', {
    get: function() {
        return this.class.contains('horizontal');
    },
    set: function(value) {
        if (value) {
            this.class.add('horizontal');
        } else {
            this.class.remove('horizontal');
        }
        this._reflow();
    }
});


Object.defineProperty(Panel.prototype, 'resizable', {
    get: function() {
        return this._handle;
    },
    set: function(value) {
        if (this._handle === value)
            return;

        var oldHandle = this._handle;
        this._handle = value;

        if (this._handle) {
            if (! this._handleElement) {
                this._handleElement = document.createElement('div');
                this._handleElement.classList.add('handle');
                this._handleElement.addEventListener('mousedown', this._resizeStart.bind(this), false);
                // this._handleElement.on('mouseup', this._resizeStart.bind(this));
            }

            if (this._handleElement.parentNode)
                this._element.removeChild(this._handleElement);
            // TODO
            // append in right place
            this._element.appendChild(this._handleElement);
            this.class.add('resizable', 'resizable-' + this._handle);
        } else {
            this._element.removeChild(this._handleElement);
            this.class.remove('resizable', 'resizable-' + oldHandle);
        }

        this._reflow();
    }
});


Object.defineProperty(Panel.prototype, 'resizeMin', {
    get: function() {
        return this._resizeLimits.min;
    },
    set: function(value) {
        this._resizeLimits.min = Math.max(0, Math.min(this._resizeLimits.max, value));
    }
});


Object.defineProperty(Panel.prototype, 'resizeMax', {
    get: function() {
        return this._resizeLimits.max;
    },
    set: function(value) {
        this._resizeLimits.max = Math.max(this._resizeLimits.min, value);
    }
});


Panel.prototype._resizeStart = function(evt) {
    if (! this._handle)
        return;

    this.class.add('noAnimation', 'resizing');
    this._resizeData = null;

    this._resizeEvtMove = this._resizeMove.bind(this);
    this._resizeEvtEnd = this._resizeEnd.bind(this);

    window.addEventListener('mousemove', this._resizeEvtMove, false);
    window.addEventListener('mouseup', this._resizeEvtEnd, false);

    evt.preventDefault();
    evt.stopPropagation();
};


Panel.prototype._resizeMove = function(evt) {
    if (! this._resizeData) {
        this._resizeData = {
            x: evt.clientX,
            y: evt.clientY,
            width: this._innerElement.clientWidth,
            height: this._innerElement.clientHeight
        };
    } else {
        if (this._handle === 'left' || this._handle === 'right') {
            // horizontal
            var offsetX = this._resizeData.x - evt.clientX;

            if (this._handle === 'right')
                offsetX = -offsetX;

            var width = Math.max(this._resizeLimits.min, Math.min(this._resizeLimits.max, (this._resizeData.width + offsetX)));

            this.style.width = (width + 4) + 'px';
            this._innerElement.style.width = (width + 4) + 'px';
        } else {
            // vertical
            var offsetY = this._resizeData.y - evt.clientY;

            if (this._handle === 'bottom')
                offsetY = -offsetY;

            var height = Math.max(this._resizeLimits.min, Math.min(this._resizeLimits.max, (this._resizeData.height + offsetY)));

            this.style.height = (height + 32) + 'px';
            this._innerElement.style.height = height + 'px';
        }
    }

    evt.preventDefault();
    evt.stopPropagation();

    this.emit('resize');
};

Panel.prototype._resizeEnd = function(evt) {
    window.removeEventListener('mousemove', this._resizeEvtMove, false);
    window.removeEventListener('mouseup', this._resizeEvtEnd, false);

    this.class.remove('noAnimation', 'resizing');
    this._resizeData = null;

    evt.preventDefault();
    evt.stopPropagation();
};


window.ui.Panel = Panel;
