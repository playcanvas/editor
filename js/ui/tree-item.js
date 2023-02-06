function TreeItem(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this.tree = null;

    this.element = document.createElement('div');
    this._element.classList.add('ui-tree-item');

    if (args.classList) {
        args.classList.forEach(function (className) {
            this._element.classList.add(className);
        }, this);
    }

    this.elementTitle = document.createElement('div');
    this.elementTitle.classList.add('title');
    this.elementTitle.draggable = true;
    this.elementTitle.tabIndex = 0;
    this.elementTitle.ui = this;
    this._element.appendChild(this.elementTitle);

    this.elementIcon = document.createElement('span');
    this.elementIcon.classList.add('icon');
    this.elementTitle.appendChild(this.elementIcon);

    this.elementText = document.createElement('span');
    this.elementText.textContent = args.text || '';
    this.elementText.classList.add('text');
    this.elementTitle.appendChild(this.elementText);

    this._children = 0;
    this.selectable = true;

    this._onMouseUp = function (evt) {
        window.removeEventListener('mouseup', self._dragRelease);
        self._dragRelease = null;

        evt.preventDefault();
        evt.stopPropagation();

        self._dragging = false;
        self.emit('dragend');
    };

    this.elementTitle.addEventListener('click', this._onClick, false);
    this.elementTitle.addEventListener('dblclick', this._onDblClick, false);

    this._dragRelease = null;
    this._dragging = false;
    this._allowDrop = (args.allowDrop !== undefined ? !!args.allowDrop : true);

    this.elementTitle.addEventListener('mousedown', this._onMouseDown, false);
    this.elementTitle.addEventListener('dragstart', this._onDragStart, false);
    this.elementTitle.addEventListener('mouseover', this._onMouseOver, false);

    this.on('destroy', this._onDestroy);
    this.on('append', this._onAppend);
    this.on('remove', this._onRemove);
    this.on('select', this._onSelect);
    this.on('deselect', this._onDeselect);

    this.elementTitle.addEventListener('keydown', this._onKeyDown, false);
}
TreeItem.prototype = Object.create(ui.Element.prototype);


TreeItem.prototype.append = function (item) {
    if (this._children === 1) {
        this._element.childNodes[1].classList.remove('single');
    }

    item.parent = this;
    this._element.appendChild(item.element);
    this._children++;

    if (this._children === 1) {
        item.class.add('single');
        this.class.add('container');
    } else if (this._children > 1) {
        item.class.remove('single');
    }

    var appendChildren = function (treeItem) {
        treeItem.emit('append', treeItem);

        if (treeItem._children) {
            for (var i = 1; i < treeItem.element.childNodes.length; i++) {
                appendChildren(treeItem.element.childNodes[i].ui);
            }
        }
    };
    appendChildren(item);
};


TreeItem.prototype.appendBefore = function (item, referenceItem) {
    if (this._children === 1) {
        this._element.childNodes[1].classList.remove('single');
    }

    item.parent = this;
    this._element.insertBefore(item.element, referenceItem.element);
    this._children++;

    if (this._children === 1) {
        item.class.add('single');
        this.class.add('container');
    } else if (this._children > 1) {
        item.class.remove('single');
    }

    var appendChildren = function (treeItem) {
        treeItem.emit('append', treeItem);

        if (treeItem._children) {
            for (var i = 1; i < treeItem.element.childNodes.length; i++) {
                appendChildren(treeItem.element.childNodes[i].ui);
            }
        }
    };
    appendChildren(item);
};


TreeItem.prototype.appendAfter = function (item, referenceItem) {
    item.parent = this;
    referenceItem = referenceItem.element.nextSibling;

    // might be last
    if (!referenceItem)
        this.append(item);

    this._element.insertBefore(item.element, referenceItem);
    this._children++;

    if (this._children === 1) {
        item.class.add('single');
        this.class.add('container');
    } else if (this._children === 2) {
        this._element.childNodes[1].classList.remove('single');
    }

    var appendChildren = function (treeItem) {
        treeItem.emit('append', treeItem);

        if (treeItem._children) {
            for (var i = 1; i < treeItem.element.childNodes.length; i++) {
                appendChildren(treeItem.element.childNodes[i].ui);
            }
        }
    };
    appendChildren(item);
};


TreeItem.prototype.remove = function (item) {
    if (!this._children || !this._element.contains(item.element))
        return;

    this._element.removeChild(item.element);
    this._children--;

    if (this._children === 0) {
        this.class.remove('container');
    } else if (this._children === 1 && this._element.childNodes.length > 2) {
        this._element.childNodes[1].classList.add('single');
    }

    var removeChildren = function (treeItem) {
        treeItem.emit('remove', treeItem);

        if (treeItem._children) {
            for (var i = 1; i < treeItem.element.childNodes.length; i++) {
                removeChildren(treeItem.element.childNodes[i].ui);
            }
        }
    };
    removeChildren(item);
};


TreeItem.prototype._onDestroy = function () {
    this.elementTitle.removeEventListener('click', this._onClick);
    this.elementTitle.removeEventListener('dblclick', this._onDblClick);
    this.elementTitle.removeEventListener('mousedown', this._onMouseDown);
    this.elementTitle.removeEventListener('dragstart', this._onDragStart);
    this.elementTitle.removeEventListener('mouseover', this._onMouseOver);
    this.elementTitle.removeEventListener('keydown', this._onKeyDown);
};


TreeItem.prototype._onAppend = function (item) {
    if (this.parent)
        this.parent.emit('append', item);
};


TreeItem.prototype._onRemove = function (item) {
    if (this.parent)
        this.parent.emit('remove', item);
};


TreeItem.prototype.focus = function () {
    this.elementTitle.focus();
};

TreeItem.prototype._onRename = function (select) {
    if (select) {
        this.tree.clear();
        this.tree._onItemClick(this);
    }

    var self = this;
    this.class.add('rename');

    // add remaning field
    var field = new ui.TextField();
    field.parent = this;
    field.renderChanges = false;
    field.value = this.text;
    field.elementInput.readOnly = !this.tree.allowRenaming;
    field.elementInput.addEventListener('blur', function () {
        field.destroy();
        self.class.remove('rename');
    }, false);
    field.on('click', function (evt) {
        evt.stopPropagation();
    });
    field.element.addEventListener('dblclick', function (evt) {
        evt.stopPropagation();
    });
    field.on('change', function (value) {
        value = value.trim();
        if (value) {
            if (self.entity) {
                self.entity.set('name', value);
            }

            self.emit('rename', value);
        }

        field.destroy();
        self.class.remove('rename');
    });
    this.elementTitle.appendChild(field.element);
    field.elementInput.focus();
    field.elementInput.select();
};


TreeItem.prototype._onClick = function (evt) {
    if (evt.button !== 0 || !this.ui.selectable)
        return;

    var rect = this.getBoundingClientRect();

    if (this.ui._children && (evt.clientX - rect.left) < 0) {
        this.ui.open = !this.ui.open;
    } else {
        this.ui.tree._onItemClick(this.ui);
        evt.stopPropagation();
    }
};

TreeItem.prototype._onDblClick = function (evt) {
    if (!this.ui.tree.allowRenaming || evt.button !== 0)
        return;

    evt.stopPropagation();
    var rect = this.getBoundingClientRect();

    if (this.ui._children && (evt.clientX - rect.left) < 0) { // eslint-disable-line no-empty
    } else {
        this.ui._onRename(true);
    }
};

TreeItem.prototype._onMouseDown = function (evt) {
    if (!this.ui.tree.draggable)
        return;

    evt.stopPropagation();
};

TreeItem.prototype._onDragStart = function (evt) {
    if (!this.ui.tree.draggable) {
        evt.stopPropagation();
        evt.preventDefault();
        return;
    }

    this.ui._dragging = true;

    if (this.ui._dragRelease)
        window.removeEventListener('mouseup', this.ui._dragRelease);

    this.ui._dragRelease = this.ui._onMouseUp;
    window.addEventListener('mouseup', this.ui._dragRelease, false);

    evt.stopPropagation();
    evt.preventDefault();

    this.ui.emit('dragstart');
};

TreeItem.prototype._onMouseOver = function (evt) {
    evt.stopPropagation();
    this.ui.emit('mouseover', evt);
};

TreeItem.prototype._onKeyDown = function (evt) {
    if ((evt.target && evt.target.tagName.toLowerCase() === 'input'))
        return;

    if ([9, 38, 40, 37, 39].indexOf(evt.keyCode) === -1)
        return;

    evt.preventDefault();
    evt.stopPropagation();

    var selectedItem = null;

    switch (evt.keyCode) {
        case 9: // tab
            break;
        case 40: // down
            var item = this.ui.element.nextSibling;
            if (item)
                item = item.ui;

            if (this.ui._children && this.ui.open) {
                var first = this.ui.element.firstChild.nextSibling;
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
            } else if (this.ui.parent && this.ui.parent instanceof TreeItem) {
                var parent = this.ui.parent;

                var findNext = function (from) {
                    var next = from.next;
                    if (next) {
                        selectedItem = next;
                        // next.selected = true;
                    } else if (from.parent instanceof TreeItem) {
                        return from.parent;
                    }
                    return false;
                };

                while ((parent = findNext(parent))) { } // eslint-disable-line no-empty
            }
            break;
        case 38: // up
            {
                let item = this.ui.element.previousSibling;
                if (item)
                    item = item.ui;

                if (item) {
                    if (item._children && item.open && item !== this.ui.parent) {
                        var last = item.element.lastChild;
                        if (last.ui)
                            last = last.ui;

                        if (last) {
                            var findLast = function (inside) {
                                if (inside._children && inside.open) {
                                    return inside.element.lastChild.ui || null;
                                }
                                return null;

                            };

                            var found = false;
                            while (!found) {
                                var deeper = findLast(last);
                                if (deeper) {
                                    last = deeper;
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
                } else if (this.ui.parent && this.ui.parent instanceof TreeItem) {
                    selectedItem = this.ui.parent;
                    // this.ui.parent.selected = true;
                }
            }
            break;
        case 37: // left (close)
            if (this.ui.parent !== this.ui.tree && this.ui.open)
                this.ui.open = false;
            break;
        case 39: // right (open)
            if (this.ui._children && !this.ui.open)
                this.ui.open = true;
            break;
    }

    if (selectedItem) {
        if (!(Tree._ctrl && Tree._ctrl()) && !(Tree._shift && Tree._shift()))
            this.ui.tree.clear();
        selectedItem.selected = true;
    }
};

TreeItem.prototype._onSelect = function () {
    this.elementTitle.focus();
};

TreeItem.prototype._onDeselect = function () {
    this.elementTitle.blur();
};


Object.defineProperty(TreeItem.prototype, 'selected', {
    get: function () {
        return this.class.contains('selected');
    },
    set: function (value) {
        if (this.class.contains('selected') === !!value)
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


Object.defineProperty(TreeItem.prototype, 'text', {
    get: function () {
        return this.elementText.textContent;
    },
    set: function (value) {
        if (this.elementText.textContent === value)
            return;

        this.elementText.textContent = value;
    }
});


Object.defineProperty(TreeItem.prototype, 'open', {
    get: function () {
        return this.class.contains('open');
    },
    set: function (value) {
        if (this.class.contains('open') === !!value)
            return;

        if (value) {
            this.class.add('open');
            this.emit('open');
            this.tree.emit('open', this);
        } else {
            this.class.remove('open');
            this.emit('close');
            this.tree.emit('close', this);
        }
    }
});


Object.defineProperty(TreeItem.prototype, 'prev', {
    get: function () {
        return this._element.previousSibling && this._element.previousSibling.ui || null;
    }
});


Object.defineProperty(TreeItem.prototype, 'next', {
    get: function () {
        return this._element.nextSibling && this._element.nextSibling.ui || null;
    }
});

// Default is true. If false then it's not allowed to drop
// other tree items on this item
Object.defineProperty(TreeItem.prototype, 'allowDrop', {
    get: function () {
        return this._allowDrop;
    },
    set: function (value) {
        this._allowDrop = !!value;
    }
});

TreeItem.prototype.child = function (ind) {
    return this._element.childNodes[ind + 1];
};


window.ui.TreeItem = TreeItem;
