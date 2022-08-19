"use strict";

function ContainerElement() {
    var self = this;

    ui.Element.call(this);
    this._innerElement = null;

    this._observerChanged = false;

    var observerTimeout = function () {
        self._observerChanged = false;
        self.emit('nodesChanged');
    };

    this._observer = new MutationObserver(function () {
        if (self._observerChanged)
            return;

        self._observerChanged = true;

        setTimeout(observerTimeout, 0);
    });
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


ContainerElement.prototype.append = function (element) {
    var html = (element instanceof HTMLElement);
    var node = html ? element : element.element;

    this._innerElement.appendChild(node);

    if (!html) {
        element.parent = this;
        this.emit('append', element);
    }
};


ContainerElement.prototype.appendBefore = function (element, reference) {
    var html = (element instanceof HTMLElement);
    var node = html ? element : element.element;

    if (reference instanceof ui.Element)
        reference = reference.element;

    this._innerElement.insertBefore(node, reference);

    if (!html) {
        element.parent = this;
        this.emit('append', element);
    }
};

ContainerElement.prototype.appendAfter = function (element, reference) {
    var html = (element instanceof HTMLElement);
    var node = html ? element : element.element;

    if (reference instanceof ui.Element)
        reference = reference.element;

    reference = reference.nextSibling;

    if (reference) {
        this._innerElement.insertBefore(node, reference);
    } else {
        this._innerElement.appendChild(node);
    }

    if (!html) {
        element.parent = this;
        this.emit('append', element);
    }
};


ContainerElement.prototype.prepend = function (element) {
    var first = this._innerElement.firstChild;
    var html = (element instanceof HTMLElement);
    var node = html ? element : element.element;

    if (first) {
        this._innerElement.insertBefore(node, first);
    } else {
        this._innerElement.appendChild(node);
    }

    if (!html) {
        element.parent = this;
        this.emit('append', element);
    }
};

ContainerElement.prototype.remove = function (element) {
    var html = (element instanceof HTMLElement);
    var node = html ? element : element.element;

    if (!node.parentNode || node.parentNode !== this._innerElement)
        return;

    this._innerElement.removeChild(node);

    if (!html) {
        element.parent = null;
        this.emit('remove', element);
    }
};


Object.defineProperty(ContainerElement.prototype, 'innerElement', {
    get: function () {
        return this._innerElement;
    },
    set: function (value) {
        if (this._innerElement) {
            this._observer.disconnect();
        }

        this._innerElement = value;

        this._observer.observe(this._innerElement, this._observerOptions);
    }
});


ContainerElement.prototype.clear = function () {
    var i, node;

    this._observer.disconnect();

    i = this._innerElement.childNodes.length;
    while (i--) {
        node = this._innerElement.childNodes[i];

        if (!node.ui)
            continue;

        node.ui.destroy();
    }
    this._innerElement.innerHTML = '';

    this._observer.observe(this._innerElement, this._observerOptions);
};


Object.defineProperty(ContainerElement.prototype, 'flexible', {
    get: function () {
        return this._element.classList.contains('flexible');
    },
    set: function (value) {
        if (this._element.classList.contains('flexible') === !!value)
            return;

        if (value) {
            this._element.classList.add('flexible');
        } else {
            this._element.classList.remove('flexible');
        }
    }
});


Object.defineProperty(ContainerElement.prototype, 'flex', {
    get: function () {
        return this._element.classList.contains('flex');
    },
    set: function (value) {
        if (this._element.classList.contains('flex') === !!value)
            return;

        if (value) {
            this._element.classList.add('flex');
        } else {
            this._element.classList.remove('flex');
        }
    }
});


Object.defineProperty(ContainerElement.prototype, 'flexDirection', {
    get: function () {
        return this._innerElement.style.flexDirection;
    },
    set: function (value) {
        this._innerElement.style.flexDirection = value;
        this._innerElement.style.WebkitFlexDirection = value;
    }
});


Object.defineProperty(ContainerElement.prototype, 'flexWrap', {
    get: function () {
        return this._innerElement.style.flexWrap;
    },
    set: function (value) {
        this.flex = true;
        this._innerElement.style.flexWrap = value;
        this._innerElement.style.WebkitFlexWrap = value;
    }
});

Object.defineProperty(ContainerElement.prototype, 'flexGrow', {
    get: function () {
        return this._element.style.flexGrow === 1;
    },
    set: function (value) {
        if (value)
            this.flex = true;

        this._element.style.flexGrow = !!value ? 1 : 0;
        this._element.style.WebkitFlexGrow = !!value ? 1 : 0;
        this._innerElement.style.flexGrow = this._element.style.flexGrow;
        this._innerElement.style.WebkitFlexGrow = this._element.style.flexGrow;
    }
});


Object.defineProperty(ContainerElement.prototype, 'flexShrink', {
    get: function () {
        return this._element.style.flexShrink === 1;
    },
    set: function (value) {
        if (value)
            this.flex = true;

        this._element.style.flexShrink = !!value ? 1 : 0;
        this._element.style.WebkitFlexShrink = !!value ? 1 : 0;
        this._innerElement.style.flexShrink = this._element.style.flexShrink;
        this._innerElement.style.WebkitFlexShrink = this._element.style.flexShrink;
    }
});


Object.defineProperty(ContainerElement.prototype, 'scroll', {
    get: function () {
        return this.class.contains('scrollable');
    },
    set: function () {
        this.class.add('scrollable');
    }
});


window.ui.ContainerElement = ContainerElement;
