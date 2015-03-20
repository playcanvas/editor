"use strict";

function Menu(args) {
    var self = this;

    args = args || { };
    ui.ContainerElement.call(this);

    this.element = document.createElement('div');
    this.element.tabIndex = 1;
    this.element.classList.add('ui-menu');

    this.elementOverlay = document.createElement('div');
    this.elementOverlay.classList.add('overlay');
    this.elementOverlay.addEventListener('click', function() {
        self.open = false;
    }, false);
    this.elementOverlay.addEventListener('contextmenu', function() {
        self.open = false;
    }, false);
    this.element.appendChild(this.elementOverlay);

    this.innerElement = document.createElement('div');
    this.innerElement.classList.add('inner');
    this.element.appendChild(this.innerElement);

    this.element.addEventListener('keydown', function(evt) {
        if (self.open && evt.keyCode === 27)
            self.open = false;
    });

    this.on('select-propagate', function(path) {
        this.open = false;
        this.emit(path.join('.') + ':select', path);
        this.emit('select', path);
    });

    this._index = { };
    this.on('append', function(item) {
        this._index[item._value] = item;

        item.on('value', function(value, valueOld) {
           delete self._index[this.valueOld];
           self._index[value] = item;
        });
        item.once('destroy', function() {
            delete self._index[this._value];
        });
    });

    this._hovered = [ ];
    this.on('hover', function(path) {
        this._updatePath(path);
    });
    this.on('open', function(state) {
        if (state) return;
        this._updatePath([ ]);
    });
}
Menu.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(Menu.prototype, 'open', {
    get: function() {
        return this.class.contains('open');
    },
    set: function(value) {
        if (this.class.contains('open') === !! value)
            return;

        if (value) {
            this.class.add('open');
            this.element.focus();
        } else {
            this.class.remove('open');
        }

        this.emit('open', !! value);
    }
});


Menu.prototype.findByPath = function(path) {
    if (! (path instanceof Array))
        path = path.split('.');

    var item = this;

    for(var i = 0; i < path.length; i++) {
        item = item._index[path[i]];
        if (! item)
            return null;
    }

    return item;
};


Menu.prototype._updatePath = function(path) {
    var node = this;

    for(var i = 0; i < this._hovered.length; i++) {
        node = node._index[this._hovered[i]];
        if (! node) break;
        if (path.length <= i || path[i] !== this._hovered[i]) {
            node.class.remove('hover');
            node.innerElement.style.top = '';
            node.innerElement.style.left = '';
            node.innerElement.style.right = '';
        }
    }

    this._hovered = path;
    node = this;

    for(var i = 0; i < this._hovered.length; i++) {
        node = node._index[this._hovered[i]];

        if (! node || node.class.contains('hover'))
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


Menu.prototype.position = function(x, y) {
    this.element.style.display = 'block';

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

    this.element.style.display = '';
};


Menu.fromData = function(data) {
    var menu = new ui.Menu();

    var addItem = function(key, data) {
        var item = new ui.MenuItem({
            text: data.title || key,
            value: key,
            icon: data.icon
        });

        if (data.select)
            item.on('select', data.select);

        if (data.filter)
            menu.on('open', function() {
                item.enabled = data.filter();
            });

        return item;
    };

    var listItems = function(data, parent) {
        for(var key in data) {
            var item = addItem(key, data[key]);
            parent.append(item);

            if (data[key].items)
                listItems(data[key].items, item);
        }
    };

    listItems(data, menu);

    return menu;
};


window.ui.Menu = Menu;
