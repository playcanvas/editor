"use strict";

function Menu(args) {
    var self = this; // eslint-disable-line no-unused-vars

    args = args || { };
    ui.ContainerElement.call(this);

    this.element = document.createElement('div');
    this._element.tabIndex = 1;
    this._element.classList.add('ui-menu');
    this._element.addEventListener('keydown', this._onKeyDown, false);

    this.elementOverlay = document.createElement('div');
    this.elementOverlay.ui = this;
    this.elementOverlay.classList.add('overlay');
    this.elementOverlay.addEventListener('click', this._onClick, false);
    this.elementOverlay.addEventListener('contextmenu', this._onContextMenu, false);
    this._element.appendChild(this.elementOverlay);

    this.innerElement = document.createElement('div');
    this.innerElement.classList.add('inner');
    this._element.appendChild(this.innerElement);

    this._index = { };
    this._hovered = [];
    this._clickableSubmenus = args.clickableSubmenus;

    this.on('select-propagate', this._onSelectPropagate);
    this.on('append', this._onAppend);
    this.on('over', this._onOver);
    this.on('open', this._onOpen);
}
Menu.prototype = Object.create(ui.ContainerElement.prototype);

Menu.prototype._onClick = function () {
    this.ui.open = false;
};

Menu.prototype._onContextMenu = function () {
    this.ui.open = false;
};

Menu.prototype._onKeyDown = function (evt) {
    if (this.ui.open && evt.keyCode === 27)
        this.ui.open = false;
};

Menu.prototype._onSelectPropagate = function (path, selectedItemHasChildren, mouseEvent) {
    if (this._clickableSubmenus && selectedItemHasChildren) {
        this._updatePath(path);
    } else {
        this.open = false;
        this.emit(path.join('.') + ':select', path, mouseEvent);
        this.emit('select', path, mouseEvent);
    }
};

Menu.prototype._onAppend = function (item) {
    var self = this;
    this._index[item._value] = item;

    item.on('value', function (value, valueOld) {
        delete self._index[this.valueOld];
        self._index[value] = item;
    });
    item.once('destroy', function () {
        delete self._index[this._value];
    });
};

Menu.prototype._onOver = function (path) {
    this._updatePath(path);
};

Menu.prototype._onOpen = function (state) {
    if (state) return;
    this._updatePath([]);
};


Object.defineProperty(Menu.prototype, 'open', {
    get: function () {
        return this.class.contains('open');
    },
    set: function (value) {
        if (this.class.contains('open') === !!value)
            return;

        if (value) {
            this.class.add('open');
            this._element.focus();
        } else {
            this.class.remove('open');
        }

        this.emit('open', !!value);
    }
});


Menu.prototype.findByPath = function (path) {
    if (!(path instanceof Array))
        path = path.split('.');

    var item = this;

    for (var i = 0; i < path.length; i++) {
        item = item._index[path[i]];
        if (!item)
            return null;
    }

    return item;
};


Menu.prototype._updatePath = function (path) {
    var node = this;

    for (let i = 0; i < this._hovered.length; i++) {
        node = node._index[this._hovered[i]];
        if (!node) break;
        if (path.length <= i || path[i] !== this._hovered[i]) {
            node.class.remove('hover');
            node.innerElement.style.top = '';
            node.innerElement.style.left = '';
            node.innerElement.style.right = '';
        }
    }

    this._hovered = path;
    node = this;

    for (var i = 0; i < this._hovered.length; i++) {
        node = node._index[this._hovered[i]];

        if (!node)
            break;

        node.class.add('hover');
        node.innerElement.style.top = '';
        node.innerElement.style.left = '';
        node.innerElement.style.right = '';

        var rect = node.innerElement.getBoundingClientRect();

        // limit to bottom / top of screen
        if (rect.bottom > window.innerHeight) {
            node.innerElement.style.top = -(rect.bottom - window.innerHeight) + 'px';
        }
        if (rect.right > window.innerWidth) {
            node.innerElement.style.left = 'auto';
            node.innerElement.style.right = (node.parent.innerElement.clientWidth) + 'px';
        }
    }
};


Menu.prototype.position = function (x, y) {
    this._element.style.display = 'block';

    var rect = this.innerElement.getBoundingClientRect();

    var left = (x || 0);
    var top = (y || 0);

    // limit to bottom / top of screen
    if (top + rect.height > window.innerHeight) {
        top = window.innerHeight - rect.height;
    } else if (top < 0) {
        top = 0;
    }
    if (left + rect.width > window.innerWidth) {
        left = window.innerWidth - rect.width;
    } else if (left < 0) {
        left = 0;
    }

    this.innerElement.style.left = left + 'px';
    this.innerElement.style.top = top + 'px';

    this._element.style.display = '';
};

Menu.prototype.createItem = function (key, data) {
    var item = new ui.MenuItem({
        text: data.title || key,
        className: data.className || null,
        value: key,
        icon: data.icon,
        hasChildren: !!(data.items && Object.keys(data.items).length > 0),
        clickableSubmenus: this._clickableSubmenus
    });

    if (data.select) {
        item.on('select', data.select);
    }

    if (data.filter) {
        this.on('open', function () {
            item.enabled = data.filter();
        });
    }

    if (data.hide) {
        this.on('open', function () {
            item.hidden = data.hide();
        });
    }

    return item;
};


Menu.fromData = function (data, args) {
    var menu = new ui.Menu(args);

    var listItems = function (data, parent) {
        for (var key in data) {
            var item = menu.createItem(key, data[key]);
            parent.append(item);

            if (data[key].items)
                listItems(data[key].items, item);
        }
    };

    listItems(data, menu);

    return menu;
};


window.ui.Menu = Menu;
