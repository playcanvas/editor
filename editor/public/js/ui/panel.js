"use strict";

function Panel(header) {
    var self = this;

    ui.ContainerElement.call(this);

    this.element = document.createElement('div');
    this._element.classList.add('ui-panel', 'noHeader', 'noAnimation');

    this.headerElement = null;
    this.headerElementTitle = null;

    if (header)
        this.header = header;

    this.on('nodesChanged', this._onNodesChanged);

    // content
    this.innerElement = document.createElement('div');
    this.innerElement.ui = this;
    this.innerElement.classList.add('content');
    this._element.appendChild(this.innerElement);

    this.innerElement.addEventListener('scroll', this._onScroll, false);

    this._resizeEvtMove = function(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        self._resizeMove(evt.clientX, evt.clientY);
    };

    this._resizeEvtEnd = function(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        self._resizeEnd();
    };

    this._resizeEvtTouchMove = function(evt) {
        for(var i = 0; i < evt.changedTouches.length; i++) {
            var touch = evt.changedTouches[i];

            if (touch.identifier !== self._resizeTouchId)
                continue;

            evt.preventDefault();
            evt.stopPropagation();
            self._resizeMove(touch.clientX, touch.clientY);

            return;
        }
    };

    this._resizeEvtTouchEnd = function(evt) {
        for(var i = 0; i < evt.changedTouches.length; i++) {
            var touch = evt.changedTouches[i];

            if (touch.identifier !== self._resizeTouchId)
                continue;

            self._resouzeTouchId = null;

            evt.preventDefault();
            evt.stopPropagation();
            self._resizeEnd();

            return;
        }
    };

    // HACK
    // skip 2 frames before enabling transitions
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            self.class.remove('noAnimation');
        });
    });

    // on parent change
    this.on('parent', this._onParent);

    this._handleElement = null;
    this._handle = null;
    this._resizeTouchId = null;
    this._resizeData = null;
    this._resizeLimits = {
        min: 0,
        max: Infinity
    };

    this.headerSize = 0;
}
Panel.prototype = Object.create(ui.ContainerElement.prototype);

Panel.prototype._onNodesChanged = function() {
    if (! this.foldable || this.folded || this.horizontal || this.hidden)
        return;

    this.style.height = (Math.max(0, (this.headerSize || 32)) + this.innerElement.clientHeight) + 'px';
};

Panel.prototype._onParent = function() {
    // HACK
    // wait till DOM parses, then reflow
    requestAnimationFrame(this._reflow.bind(this));
};

Object.defineProperty(Panel.prototype, 'header', {
    get: function() {
        return (this.headerElement && this.headerElementTitle.textContent) || '';
    },
    set: function(value) {
        if (! this.headerElement && value) {
            this.headerElement = document.createElement('header');
            this.headerElement.classList.add('ui-header');

            this.headerElementTitle = document.createElement('span');
            this.headerElementTitle.classList.add('title');
            this.headerElementTitle.textContent = value;
            this.headerElement.appendChild(this.headerElementTitle);

            var first = this._element.firstChild;
            if (first) {
                this._element.insertBefore(this.headerElement, first);
            } else {
                this._element.appendChild(this.headerElement);
            }

            this.class.remove('noHeader');

            var self = this;

            // folding
            this.headerElement.addEventListener('click', function(evt) {
                if (! self.foldable || (evt.target !== self.headerElement && evt.target !== self.headerElementTitle))
                    return;

                self.folded = ! self.folded;
            }, false);
        } else if (! value && this.headerElement) {
            this.headerElement.parentNode.removeChild(this.headerElement);
            this.headerElement = null;
            this.headerElementTitle = null;
            this.class.add('noHeader');
        } else {
            this.headerElementTitle.textContent = value || '';
            this.class.remove('noHeader');
        }
    }
});


Panel.prototype.headerAppend = function(element) {
    if (! this.headerElement)
        return;

    var html = (element instanceof HTMLElement);
    var node = html ? element : element.element;

    this.headerElement.insertBefore(node, this.headerElementTitle);

    if (! html)
        element.parent = this;
};


Panel.prototype._reflow = function() {
    if (this.hidden)
        return;

    if (this.folded) {
        if (this.horizontal) {
            this.style.height = '';
            this.style.width = (this.headerSize || 32) + 'px';
        } else {
            this.style.height = (this.headerSize || 32) + 'px';
        }
    } else if (this.foldable) {
        if (this.horizontal) {
            this.style.height = '';
            this.style.width = this._innerElement.clientWidth + 'px';
        } else {
            this.style.height = ((this.headerSize || 32) + this._innerElement.clientHeight) + 'px';
        }
    }
};


Panel.prototype._onScroll = function(evt) {
    this.ui.emit('scroll', evt);
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
        if (this.hidden)
            return;

        if (this.class.contains('folded') === !! value)
            return;

        if (this.headerElement && this.headerSize === 0)
            this.headerSize = this.headerElement.clientHeight;

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
                this._handleElement.ui = this;
                this._handleElement.classList.add('handle');
                this._handleElement.addEventListener('mousedown', this._resizeStart, false);
                this._handleElement.addEventListener('touchstart', this._resizeStart, false);
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
    if (! this.ui._handle)
        return;

    if (evt.changedTouches) {
        for(var i = 0; i < evt.changedTouches.length; i++) {
            var touch = evt.changedTouches[i];
            if (touch.target !== this)
                continue;

            this.ui._resizeTouchId = touch.identifier;
        }
    }

    this.ui.class.add('noAnimation', 'resizing');
    this.ui._resizeData = null;

    window.addEventListener('mousemove', this.ui._resizeEvtMove, false);
    window.addEventListener('mouseup', this.ui._resizeEvtEnd, false);

    window.addEventListener('touchmove', this.ui._resizeEvtTouchMove, false);
    window.addEventListener('touchend', this.ui._resizeEvtTouchEnd, false);

    evt.preventDefault();
    evt.stopPropagation();
};


Panel.prototype._resizeMove = function(x, y) {
    if (! this._resizeData) {
        this._resizeData = {
            x: x,
            y: y,
            width: this._innerElement.clientWidth,
            height: this._innerElement.clientHeight
        };
    } else {
        if (this._handle === 'left' || this._handle === 'right') {
            // horizontal
            var offsetX = this._resizeData.x - x;

            if (this._handle === 'right')
                offsetX = -offsetX;

            var width = Math.max(this._resizeLimits.min, Math.min(this._resizeLimits.max, (this._resizeData.width + offsetX)));

            this.style.width = (width + 4) + 'px';
            this._innerElement.style.width = (width + 4) + 'px';
        } else {
            // vertical
            var offsetY = this._resizeData.y - y;

            if (this._handle === 'bottom')
                offsetY = -offsetY;

            var height = Math.max(this._resizeLimits.min, Math.min(this._resizeLimits.max, (this._resizeData.height + offsetY)));

            this.style.height = (height + (this.headerSize === -1 ? 0 : this.headerSize || 32)) + 'px';
            this._innerElement.style.height = height + 'px';
        }
    }

    this.emit('resize');
};

Panel.prototype._resizeEnd = function(evt) {
    window.removeEventListener('mousemove', this._resizeEvtMove, false);
    window.removeEventListener('mouseup', this._resizeEvtEnd, false);

    window.removeEventListener('touchmove', this._resizeEvtTouchMove, false);
    window.removeEventListener('touchend', this._resizeEvtTouchEnd, false);

    this.class.remove('noAnimation', 'resizing');
    this._resizeData = null;
};


window.ui.Panel = Panel;
