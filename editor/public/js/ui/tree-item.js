"use strict";

function TreeItem(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this.tree = null;

    this.element = document.createElement('div');
    this.element.classList.add('ui-tree-item');

    this.elementTitle = document.createElement('div');
    this.elementTitle.classList.add('title');
    this.elementTitle.draggable = true;
    this.elementTitle.tabIndex = 0;
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
    this._onDblClickEvt = this._onDblClick.bind(this);
    this.elementTitle.addEventListener('click', this._onClickEvt, false);
    this.elementTitle.addEventListener('dblclick', this._onDblClickEvt, false);

    // this.elementTitle.addEventListener('dblclick', function() {
    //     if (self.open) {
    //         self.open = false;
    //         self.selected = true;
    //     }
    // }, false);

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

    this.on('select', function() {
        this.elementTitle.focus();
    });

    this.on('deselect', function() {
        this.elementTitle.blur();
    });

    this.elementTitle.addEventListener('keydown', function(evt) {
        if ([ 9, 38, 40, 37, 39 ].indexOf(evt.keyCode) === -1)
            return;

        evt.preventDefault();
        evt.stopPropagation();

        var selectedItem = null;

        switch(evt.keyCode) {
            case 9: // tab
                break;
            case 40: // down
                var item = self.element.nextSibling;
                if (item)
                    item = item.ui;

                if (self._children && self.open) {
                    var first = self.element.firstChild.nextSibling;
                    if (first && first.ui) {
                        selectedItem = first.ui;
                        // first.ui.selected = true;
                    } else if (item) {
                        selectedItem = item;
                        // item.selected = true;
                    }
                } else if (item) {
                    selectedItem = item;
                    // item.selected = true;
                } else if (self.parent && self.parent instanceof TreeItem) {
                    var parent = self.parent;

                    var findNext = function(from) {
                        var next = from.next;
                        if (next) {
                            selectedItem = next;
                            // next.selected = true;
                        } else if (from.parent instanceof TreeItem) {
                            return from.parent;
                        }
                        return false;
                    };

                    while(parent = findNext(parent)) { }
                }
                break;
            case 38: // up
                var item = self.element.previousSibling;
                if (item)
                    item = item.ui;

                if (item) {
                    if (item._children && item.open) {
                        var last = item.element.lastChild;
                        if (last.ui)
                            last = last.ui;

                        if (last) {
                            var findLast = function(inside) {
                                if (inside._children && inside.open) {
                                    return inside.element.lastChild.ui || null;
                                } else {
                                    return null;
                                }
                            }

                            var found = false;
                            while(! found) {
                                var deeper = findLast(last);
                                if (deeper) {
                                    last = deeper
                                } else {
                                    found = true;
                                }
                            }

                            selectedItem = last;
                            // last.selected = true;
                        } else {
                            selectedItem = item;
                            // item.selected = true;
                        }
                    } else {
                        selectedItem = item;
                        // item.selected = true;
                    }
                } else if (self.parent && self.parent instanceof TreeItem) {
                    selectedItem = self.parent;
                    // self.parent.selected = true;
                }

                break;
            case 37: // left (close)
                if (self.parent !== self.tree && self.open)
                    self.open = false;
                break;
            case 39: // right (open)
                if (self._children && ! self.open)
                    self.open = true;
                break;
        }

        if (selectedItem) {
            if (! (Tree._ctrl && Tree._ctrl()) && ! (Tree._shift && Tree._shift()))
                self.tree.clear();
            selectedItem.selected = true;
        }
    }, false);
}
TreeItem.prototype = Object.create(ui.Element.prototype);


TreeItem.prototype.append = function(item) {
    if (this._children === 1) {
        this.element.childNodes[1].classList.remove('single');
    }

    item.parent = this;
    this.element.appendChild(item.element);
    this._children++;

    if (this._children === 1) {
        item.class.add('single');
        this.class.add('container');
    } else if (this._children > 1) {
        item.class.remove('single');
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
    if (this._children === 1) {
        this.element.childNodes[1].classList.remove('single');
    }

    item.parent = this;
    this.element.insertBefore(item.element, referenceItem.element);
    this._children++;

    if (this._children === 1) {
        item.class.add('single');
        this.class.add('container');
    } else if (this._children > 1) {
        item.class.remove('single');
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
    } else if (this._children === 1 && this.element.childNodes.length > 2) {
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
    if (evt.button !== 0)
        return;

    var rect = this.elementTitle.getBoundingClientRect();

    if (this._children && (evt.clientX - rect.left) < 0) {
        this.open = ! this.open;
    } else {
        this.tree._onItemClick(this);
        evt.stopPropagation();
    }
};


TreeItem.prototype._onDblClick = function(evt) {
    if (! this.tree.allowRenaming || evt.button !== 0)
        return;

    evt.stopPropagation();
    var rect = this.elementTitle.getBoundingClientRect();

    if (this._children && (evt.clientX - rect.left) < 0) {
        return;
    } else {
        this.tree.clear();
        this.tree._onItemClick(this);

        var self = this;
        this.class.add('rename');

        // add remaning field
        var field = new ui.TextField();
        field.renderChanges = false;
        field.value = this.text;
        field.elementInput.addEventListener('blur', function() {
            field.destroy();
            self.class.remove('rename');
        }, false);
        field.on('click', function(evt) {
            evt.stopPropagation();
        });
        field.element.addEventListener('dblclick', function(evt) {
            evt.stopPropagation();
        });
        field.on('change', function(value) {
            if (value)
                self.entity.set('name', value);

            field.destroy();
            self.class.remove('rename');
        });
        this.elementTitle.appendChild(field.element);
        field.elementInput.focus();
        field.elementInput.select();
    }
};

TreeItem.prototype._onDragStart = function(evt) {
    if (this.tree.disabled) {
        evt.stopPropagation();
        evt.preventDefault();
        return;
    }

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
});


Object.defineProperty(TreeItem.prototype, 'prev', {
    get: function() {
        return this.element.previousSibling && this.element.previousSibling.ui || null;
    }
});


Object.defineProperty(TreeItem.prototype, 'next', {
    get: function() {
        return this.element.nextSibling && this.element.nextSibling.ui || null;
    }
});


TreeItem.prototype.child = function(ind) {
    return this.element.childNodes[ind + 1];
};



window.ui.TreeItem = TreeItem;
