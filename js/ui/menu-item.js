"use strict";

function MenuItem(args) {
    var self = this; // eslint-disable-line no-unused-vars

    args = args || { };
    ui.ContainerElement.call(this);

    this._value = args.value || '';
    this._hasChildren = args.hasChildren;
    this._clickableSubmenus = args.clickableSubmenus;

    this.element = document.createElement('div');
    this._element.classList.add('ui-menu-item');

    if (args.className) {
        this._element.classList.add(args.className);
    }

    this.elementTitle = document.createElement('div');
    this.elementTitle.classList.add('title');
    this.elementTitle.ui = this;
    this._element.appendChild(this.elementTitle);

    this.elementIcon = null;

    this.elementText = document.createElement('span');
    this.elementText.classList.add('text');
    this.elementText.textContent = args.text || 'Untitled';
    this.elementTitle.appendChild(this.elementText);

    this.innerElement = document.createElement('div');
    this.innerElement.classList.add('content');
    this._element.appendChild(this.innerElement);

    this._index = { };

    this._container = false;

    this.elementTitle.addEventListener('mouseenter', this._onMouseEnter, false);
    this.elementTitle.addEventListener('touchstart', this._onTouchStart, { passive: true });
    this.elementTitle.addEventListener('touchend', this._onTouchEnd, false);
    this.elementTitle.addEventListener('click', this._onClick, false);

    this.on('over', this._onOver);
    this.on('select-propagate', this._onSelectPropagate);
    this.on('append', this._onAppend);

    if (args.icon)
        this.icon = args.icon;
}
MenuItem.prototype = Object.create(ui.ContainerElement.prototype);


MenuItem.prototype._onMouseEnter = function (evt) {
    evt.stopPropagation();
    evt.preventDefault();

    this.ui.parent.emit('over', [this.ui._value]);
};

MenuItem.prototype._onOver = function (path) {
    if (!this.parent)
        return;

    path.splice(0, 0, this._value);

    this.parent.emit('over', path);
};

MenuItem.prototype._onClick = function (evt) {
    if (!this.ui.parent || this.ui.disabled)
        return;

    this.ui.emit('select', this.ui._value, this.ui._hasChildren, evt);
    this.ui.parent.emit('select-propagate', [this.ui._value], this.ui._hasChildren, evt);

    if (!this.ui._clickableSubmenus || !this.ui._hasChildren) {
        this.ui.class.remove('hover');
    }
};

MenuItem.prototype._onTouchStart = function (evt) {
    if (!this.ui.parent || this.ui.disabled)
        return;

    if (!this.ui._container || this.ui.class.contains('hover')) {
        this.ui.emit('select', this.ui._value, this.ui._hasChildren, evt);
        this.ui.parent.emit('select-propagate', [this.ui._value], this.ui._hasChildren, evt);
        this.ui.class.remove('hover');
    } else {
        this.ui.parent.emit('over', [this.ui._value]);
    }
};

MenuItem.prototype._onTouchEnd = function (evt) {
    if (!this.ui.parent || this.ui.disabled)
        return;

    evt.preventDefault();
    evt.stopPropagation();
};

MenuItem.prototype._onSelectPropagate = function (path, selectedItemHasChildren, mouseEvent) {
    if (!this.parent)
        return;

    path.splice(0, 0, this._value);

    this.parent.emit('select-propagate', path, selectedItemHasChildren, mouseEvent);

    if (!this._clickableSubmenus || !selectedItemHasChildren) {
        this.class.remove('hover');
    }
};

MenuItem.prototype._onAppend = function (item) {
    var self = this;

    this._container = true;
    this.class.add('container');

    this._index[item._value] = item;

    item.on('value', function (value, valueOld) {
        delete self._index[this.valueOld];
        self._index[value] = item;
    });
    item.once('destroy', function () {
        delete self._index[this._value];
    });
};


Object.defineProperty(MenuItem.prototype, 'value', {
    get: function () {
        return this._value;
    },
    set: function (value) {
        if (this._value === value)
            return;

        var valueOld = this._value;
        this._value = value;
        this.emit('value', value, valueOld);
    }
});


Object.defineProperty(MenuItem.prototype, 'text', {
    get: function () {
        return this.elementText.textContent;
    },
    set: function (value) {
        if (this.elementText.textContent === value)
            return;

        this.elementText.textContent = value;
    }
});


Object.defineProperty(MenuItem.prototype, 'icon', {
    get: function () {
        return this.elementIcon.textContent;
    },
    set: function (value) {
        if ((!value && !this.elementIcon) || (this.elementIcon && this.elementIcon.textContent === value))
            return;

        if (!value) {
            this.elementIcon.parentNode.removeChild(this.elementIcon);
            this.elementIcon = null;
        } else {
            if (!this.elementIcon) {
                this.elementIcon = document.createElement('span');
                this.elementIcon.classList.add('icon');
                this.elementTitle.insertBefore(this.elementIcon, this.elementText);
            }

            this.elementIcon.innerHTML = value;
        }
    }
});


window.ui.MenuItem = MenuItem;
