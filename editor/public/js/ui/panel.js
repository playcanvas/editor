"use strict";

function Panel(header) {
    var self = this;

    ui.ContainerElement.call(this);

    this.element = document.createElement('div');
    this.element.classList.add('ui-panel', 'noAnimation');

    // header
    this.headerElement = document.createElement('header');
    this.headerElement.classList.add('ui-header');
    this.headerElement.textContent = header || '';
    if (! this.headerElement.textContent) {
        this.class.add('noHeader');
    }
    this.element.appendChild(this.headerElement);

    // folding
    this.headerElement.addEventListener('click', function() {
        if (! self.foldable) return;
        self.folded = ! self.folded;
    }, false);

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
}
Panel.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(Panel.prototype, 'header', {
    get: function() {
        return this.headerElement.textContent;
    },
    set: function(value) {
        this.headerElement.textContent = value || '';

        if (! this.headerElement.textContent) {
            this.class.add('noHeader');
        } else {
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


window.ui.Panel = Panel;
