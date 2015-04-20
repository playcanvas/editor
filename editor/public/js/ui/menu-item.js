"use strict";

function MenuItem(args) {
    var self = this;

    args = args || { };
    ui.ContainerElement.call(this);

    this._value = args.value || '';

    this.element = document.createElement('div');
    this.element.classList.add('ui-menu-item');

    this.elementTitle = document.createElement('div');
    this.elementTitle.classList.add('title');
    this.element.appendChild(this.elementTitle);

    this.elementIcon = null;

    this.elementText = document.createElement('span');
    this.elementText.classList.add('text');
    this.elementText.textContent = args.text || 'Untitled';
    this.elementTitle.appendChild(this.elementText);

    this.innerElement = document.createElement('div');
    this.innerElement.classList.add('content');
    this.element.appendChild(this.innerElement);

    this._index = { };

    this._container = false;

    this.elementTitle.addEventListener('mouseenter', function(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        self.parent.emit('over', [ self._value ]);
    });

    this.on('over', function(path) {
        if (! this.parent)
            return;

        path.splice(0, 0, this._value);

        this.parent.emit('over', path);
    });

    this.elementTitle.addEventListener('click', function(evt) {
        if (! self.parent || self.disabled)
            return;

        self.emit('select', self._value);
        self.parent.emit('select-propagate', [ self._value ]);
        self.class.remove('hover');
    }, false);

    this.on('select-propagate', function(path) {
        if (! this.parent)
            return;

        path.splice(0, 0, this._value);

        this.parent.emit('select-propagate', path);
        this.class.remove('hover');
    });

    this.on('append', function(item) {
        this._container = true;
        this.class.add('container');

        this._index[item._value] = item;

        item.on('value', function(value, valueOld) {
           delete self._index[this.valueOld];
           self._index[value] = item;
        });
        item.once('destroy', function() {
            delete self._index[this._value];
        });
    });

    if (args.icon)
        this.icon = args.icon;
}
MenuItem.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(MenuItem.prototype, 'value', {
    get: function() {
        return this._value;
    },
    set: function(value) {
        if (this._value === value)
            return;

        var valueOld = this._value;
        this._value = value;
        this.emit('value', value, valueOld);
    }
});


Object.defineProperty(MenuItem.prototype, 'text', {
    get: function() {
        return this.elementText.textContent;
    },
    set: function(value) {
        if (this.elementText.textContent === value)
            return;

        this.elementText.textContent = value;
    }
});


Object.defineProperty(MenuItem.prototype, 'icon', {
    get: function() {
        return this.elementIcon.textContent;
    },
    set: function(value) {
        if ((! value && ! this.elementIcon) || (this.elementIcon && this.elementIcon.textContent === value))
            return;

        if (! value) {
            this.elementIcon.parentNode.removeChild(this.elementIcon);
            this.elementIcon = null;
        } else {
            if (! this.elementIcon) {
                this.elementIcon = document.createElement('span');
                this.elementIcon.classList.add('icon');
                this.elementTitle.insertBefore(this.elementIcon, this.elementText);
            }

            this.elementIcon.innerHTML = value;
        }
    }
});


window.ui.MenuItem = MenuItem;
