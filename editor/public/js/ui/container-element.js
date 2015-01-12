"use strict";

function ContainerElement() {
    ui.Element.call(this);
    this._innerElement = null;

    this._observerChanged = false;
    this._observer = new MutationObserver(this._onMutations.bind(this));
}
ContainerElement.prototype = Object.create(ui.Element.prototype);


ContainerElement.prototype._observerOptions = {
    childList: true,
    attributes: true,
    characterData: false,
    subtree: true,
    attributeOldValue: false,
    characterDataOldValue: false
};


ContainerElement.prototype.append = function(element) {
    var html = (element instanceof HTMLElement);
    var node = html ? element : element.element;

    this._innerElement.appendChild(node);

    if (! html)
        element.parent = this;
};


ContainerElement.prototype.prepend = function(element) {
    var first = this._innerElement.firstChild;
    var html = (element instanceof HTMLElement);
    var node = html ? element : element.element;

    if (first) {
        this._innerElement.insertBefore(node, first);
    } else {
        this._innerElement.appendChild(node);
    }

    if (! html)
        element.parent = this;
};


Object.defineProperty(ContainerElement.prototype, 'innerElement', {
    get: function() {
        return this._innerElement;
    },
    set: function(value) {
        if (this._innerElement) {
            this._observer.disconnect();
        }

        this._innerElement = value;

        this._observer.observe(this._innerElement, this._observerOptions);
    }
});


ContainerElement.prototype.clear = function() {
    var i, node;

    this._observer.disconnect();

    i = this._innerElement.childNodes.length;
    while(i--) {
        node = this._innerElement.childNodes[i];

        if (! node.ui)
            continue;

        node.ui.destroy();
    }
    this._innerElement.innerHTML = '';

    this._observer.observe(this._innerElement, this._observerOptions);
};


Object.defineProperty(ContainerElement.prototype, 'flex', {
    get: function() {
        return this._element.style.display === 'flex';
    },
    set: function(value) {
        if (this._element.style.display === 'flex')
            return;

        this._element.style.display = value ? 'flex' : 'block';
        this._innerElement.style.display = this._element.style.display;
    }
});


Object.defineProperty(ContainerElement.prototype, 'flexDirection', {
    get: function() {
        return this._innerElement.style.flexDirection;
    },
    set: function(value) {
        this._innerElement.style.flexDirection = value;
    }
});


Object.defineProperty(ContainerElement.prototype, 'flexWrap', {
    get: function() {
        return this.innerElement.style.flexWrap;
    },
    set: function(value) {
        this.flex = true;
        this.innerElement.style.flexWrap = value;
    }
});

Object.defineProperty(ContainerElement.prototype, 'flexGrow', {
    get: function() {
        return this._element.style.flexGrow === 1;
    },
    set: function(value) {
        if (value)
            this.flex = true;

        this._element.style.flexGrow = !! value ? 1 : 0;
        this._innerElement.style.flexGrow = this._element.style.flexGrow;
    }
});


Object.defineProperty(ContainerElement.prototype, 'flexShrink', {
    get: function() {
        return this._element.style.flexShrink === 1;
    },
    set: function(value) {
        if (value)
            this.flex = true;

        this._element.style.flexShrink = !! value ? 1 : 0;
        this._innerElement.style.flexShrink = this._element.style.flexShrink;
    }
});


Object.defineProperty(ContainerElement.prototype, 'scroll', {
    get: function() {
        return this.class.contains('scrollable');
    },
    set: function() {
        this.class.add('scrollable');
    }
});


ContainerElement.prototype._onMutations = function(mutations) {
    if (this._observerChanged)
        return;

    this._observerChanged = true;

    setTimeout(function() {
        this._observerChanged = false;
        this.emit('nodesChanged');
    }.bind(this), 0);
};


window.ui.ContainerElement = ContainerElement;
