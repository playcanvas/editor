"use strict";

function TreeItem(args) {
    ui.Element.call(this);
    args = args || { };

    this.tree = null;

    this.element = document.createElement('div');
    this.element.classList.add('ui-tree-item');

    this.elementTitle = document.createElement('div');
    this.elementTitle.classList.add('title');
    this.elementTitle.draggable = true;
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

    this._dragRelease = null;
    this._dragging = false;
    this.elementTitle.addEventListener('dragstart', this._onDragStart.bind(this), false);
    // this.element.addEventListener('dragenter', this._onDragEnter.bind(this), false);
    this.elementTitle.addEventListener('mouseover', this._onMouseOver.bind(this), false);
    // this.element.addEventListener('dragend', this._onDragEnd.bind(this), false);
    // this.element.addEventListener('mouseup', this._onMouseUp.bind(this), false);

    this.on('destroy', this._onDestroy);
    this.on('append', this._onAppend);
    this.on('remove', this._onRemove);
}
TreeItem.prototype = Object.create(ui.Element.prototype);


TreeItem.prototype.reparent = function(parent) {
    if (this.parent)
        this.parent.remove(this);

    parent.append(this);
};


TreeItem.prototype.append = function(item) {
    item.parent = this;
    this.element.appendChild(item.element);
    this._children++;
    // item.tree = this.tree;

    if (this._children === 1) {
        item.class.add('single');
        this.class.add('container');
    } else if (this._children === 2) {
        this.element.childNodes[1].classList.remove('single');
    }

    var appendChildren = function(treeItem) {
        treeItem.emit('append', treeItem);

        if (treeItem._children) {
            for(var i = 1; i < treeItem.element.childNodes.length; i++) {
                appendChildren(treeItem.element.childNodes[i].ui);
            }
        }
    };
    appendChildren(item);
};


TreeItem.prototype.appendBefore = function(item, referenceItem) {
    item.parent = this;
    this.element.insertBefore(item.element, referenceItem.element);
    this._children++;

    if (this._children === 1) {
        item.class.add('single');
        this.class.add('container');
    } else if (this._children === 2) {
        this.element.childNodes[1].classList.remove('single');
    }

    var appendChildren = function(treeItem) {
        treeItem.emit('append', treeItem);

        if (treeItem._children) {
            for(var i = 1; i < treeItem.element.childNodes.length; i++) {
                appendChildren(treeItem.element.childNodes[i].ui);
            }
        }
    };
    appendChildren(item);
};


TreeItem.prototype.appendAfter = function(item, referenceItem) {
    item.parent = this;
    referenceItem = referenceItem.element.nextSibling;

    // might be last
    if (! referenceItem)
        this.append(item);

    this.element.insertBefore(item.element, referenceItem);
    this._children++;

    if (this._children === 1) {
        item.class.add('single');
        this.class.add('container');
    } else if (this._children === 2) {
        this.element.childNodes[1].classList.remove('single');
    }

    var appendChildren = function(treeItem) {
        treeItem.emit('append', treeItem);

        if (treeItem._children) {
            for(var i = 1; i < treeItem.element.childNodes.length; i++) {
                appendChildren(treeItem.element.childNodes[i].ui);
            }
        }
    };
    appendChildren(item);
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

    var removeChildren = function(treeItem) {
        treeItem.emit('remove', treeItem);

        if (treeItem._children) {
            for(var i = 1; i < treeItem.element.childNodes.length; i++) {
                removeChildren(treeItem.element.childNodes[i].ui);
            }
        }
    };
    removeChildren(item);
};


TreeItem.prototype._onDestroy = function() {
    this.elementTitle.removeEventListener('click', this._onClickEvt);
};


TreeItem.prototype._onAppend = function(item) {
    if (this.parent)
        this.parent.emit('append', item);
};


TreeItem.prototype._onRemove = function(item) {
    if (this.parent)
        this.parent.emit('remove', item);
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


TreeItem.prototype._onDragStart = function(evt) {
    this._dragging = true;

    if (this._dragRelease)
        window.removeEventListener('mouseup', this._dragRelease);

    this._dragRelease = this._onMouseUp.bind(this);
    window.addEventListener('mouseup', this._dragRelease, false);

    evt.stopPropagation();
    evt.preventDefault();

    this.emit('dragstart');
};


TreeItem.prototype._onMouseOver = function(evt) {
    evt.stopPropagation();

    this.emit('mouseover', evt);
};

TreeItem.prototype._onMouseUp = function(evt) {
    window.removeEventListener('mouseup', this._dragRelease);
    this._dragRelease = null;

    evt.preventDefault();
    evt.stopPropagation();

    this._dragging = false;
    this.emit('dragend');
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


// Object.defineProperty(TreeItem.prototype, 'tree', {
//     get: function() {
//         return this._tree;
//     },
//     set: function(value) {
//         if (this._tree)
//             return;

//         this._tree = value;

//         // if (this._children) {
//         //     for(var i = 1; i < this.element.childNodes.length; i++) {
//         //         this.element.childNodes[i].ui.tree = this._tree;
//         //     }
//         // }
//     }
// });


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
