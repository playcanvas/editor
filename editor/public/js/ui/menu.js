"use strict";

function Menu(args) {
    var self = this;

    args = args || { };
    ui.ContainerElement.call(this);

    this.element = document.createElement('div');
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
        } else {
            this.class.remove('open');
        }

        this.emit('open', !! value);
    }
});


Menu.prototype.findByPath = function(path) {
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
        if (path.length <= i || path[i] !== this._hovered[i])
            node.class.remove('hover');
    }

    this._hovered = path;
    node = this;

    for(var i = 0; i < this._hovered.length; i++) {
        node = node._index[this._hovered[i]];
        if (! node) break;
        node.class.add('hover');

        // limit to bottom / top of screen
        var top = node.parent.innerElement.offsetTop + node.element.offsetTop;
        if (top + node.innerElement.clientHeight > window.innerHeight) {
            node.innerElement.style.top = window.innerHeight - (top + node.innerElement.clientHeight) + 'px';
        } else {
            node.innerElement.style.top = 0;
        }
    }
};


Menu.prototype.position = function(x, y) {
    var left = (x || 0);
    var top = (y || 0);

    // limit to bottom / top of screen
    if (top + this.innerElement.clientHeight > window.innerHeight) {
        top = window.innerHeight - this.innerElement.clientHeight;
    } else if (top < 0) {
        top = 0;
    }

    this.innerElement.style.left = left + 'px';
    this.innerElement.style.top = top + 'px';
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
