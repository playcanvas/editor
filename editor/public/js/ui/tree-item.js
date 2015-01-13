"use strict";

function TreeItem(args) {
    ui.Element.call(this);
    args = args || { };

    this._tree = null;

    this.element = document.createElement('div');
    this.element.classList.add('ui-tree-item');

    this.elementTitle = document.createElement('div');
    this.elementTitle.classList.add('title');
    this.element.appendChild(this.elementTitle);

    this.elementIcon = document.createElement('span');
    this.elementIcon.classList.add('icon');
    this.elementTitle.appendChild(this.elementIcon);

    this.elementText = document.createElement('span');
    this.elementText.textContent = args.text || '';
    this.elementText.classList.add('text');
    this.elementTitle.appendChild(this.elementText);

    this._children = 0;

    this._onClickEvt = this._onClick.bind(this);
    this.elementTitle.addEventListener('click', this._onClickEvt, false);

    this.on('destroy', this._onDestroy);
    this.on('append', this._onAppend);
}
TreeItem.prototype = Object.create(ui.Element.prototype);


TreeItem.prototype.append = function(item) {
    this.element.appendChild(item.element);
    this._children++;
    item.tree = this.tree;

    if (this._children === 1) {
        item.class.add('single');
        this.class.add('container');
    } else if (this._children === 2) {
        this.element.childNodes[1].classList.remove('single');
    }

    this.emit('append', item);
};


TreeItem.prototype.appendBefore = function(item, reference) {
    this.element.insertBefore(item.element, reference);
    this._children++;

    if (this._children === 1) {
        item.class.add('single');
        this.class.add('container');
    } else if (this._children === 2) {
        this.element.childNodes[1].classList.remove('single');
    }
};


TreeItem.prototype.remove = function(item) {
    if (! this._children || ! this.element.contains(item.element))
        return;

    this.element.removeChild(item.element);
    this._children--;

    if (this._children === 0) {
        this.class.remove('container');
    } else if (this._children === 1) {
        this.element.childNodes[1].classList.add('single');
    }
};


TreeItem.prototype._onDestroy = function() {
    this.elementTitle.removeEventListener('click', this._onClickEvt);
};


TreeItem.prototype._onAppend = function(item) {
    if (this.parent)
        this.parent.emit('append', item);
};


TreeItem.prototype._onClick = function(evt) {
    var rect = this.elementTitle.getBoundingClientRect();

    if (this._children && (evt.clientX - rect.left) < 0) {
        this.open = ! this.open;
    } else {
        if (! this.selected)
            this.open = true;

        this.selected = ! this.selected;
        evt.stopPropagation();
    }
};


Object.defineProperty(TreeItem.prototype, 'selected', {
    get: function() {
        return this.class.contains('selected');
    },
    set: function(value) {
        if (this.class.contains('selected') === !! value)
            return;

        if (value) {
            this.class.add('selected');

            this.emit('select');
            if (this.tree)
                this.tree.emit('select', this);

        } else {
            this.class.remove('selected');

            this.emit('deselect');
            if (this.tree)
                this.tree.emit('deselect', this);
        }
    }
});


Object.defineProperty(TreeItem.prototype, 'tree', {
    get: function() {
        return this._tree;
    },
    set: function(value) {
        if (this._tree === value)
            return;

        this._tree = value;

        if (this._children) {
            for(var i = 1; i < this.element.childNodes.length; i++) {
                this.element.childNodes[i].ui.tree = this._tree;
            }
        }
    }
});


Object.defineProperty(TreeItem.prototype, 'text', {
    get: function() {
        return this.elementText.textContent;
    },
    set: function(value) {
        if (this.elementText.textContent === value)
            return;

        this.elementText.textContent = value;
    }
});


Object.defineProperty(TreeItem.prototype, 'open', {
    get: function() {
        return this.class.contains('open');
    },
    set: function(value) {
        if (this.class.contains('open') === !! value)
            return;

        if (value) {
            this.class.add('open');
            this.emit('open');
        } else {
            this.class.remove('open');
            this.emit('close');
        }
    }
})


window.ui.TreeItem = TreeItem;
