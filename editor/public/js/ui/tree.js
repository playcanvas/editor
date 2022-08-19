"use strict";

function Tree() {
    ui.ContainerElement.call(this);

    this.element = document.createElement('div');
    this._element.classList.add('ui-tree');

    this.elementDrag = document.createElement('div');
    this.elementDrag.classList.add('drag-handle');
    this._element.appendChild(this.elementDrag);

    var self = this;
    this.elementDrag.addEventListener('mousemove', function (evt) {
        evt.preventDefault();
        evt.stopPropagation();

        self._onDragMove(evt);
    });
    this._element.addEventListener('mouseleave', function (evt) {
        self._onDragOut();
    });

    this.on('select', this._onSelect);
    this.on('deselect', this._onDeselect);
    this.on('append', this._onAppend);
    this.on('remove', this._onRemove);

    this.draggable = true;
    this._dragging = false;
    this._dragItems = [];
    this._dragOver = null;
    this._dragArea = 'inside';
    this._evtDragMove = null;
    this.reordering = true;
    this.dragInstant = true;

    this._selected = [];
}
Tree.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(Tree.prototype, 'selected', {
    get: function () {
        return this._selected.slice(0);
    },
    set: function (value) {

    }
});


Tree.prototype._onItemClick = function (item) {
    if (Tree._ctrl && Tree._ctrl()) {
        item.selected = !item.selected;
    } else if (Tree._shift && Tree._shift() && this._selected.length) {
        var from = this._selected[this._selected.length - 1];
        var to = item;

        var up = [];
        var down = [];

        var prev = function (refItem) {
            var result = null;
            var item = refItem.element.previousSibling;
            if (item)
                item = item.ui;

            if (item) {
                if (refItem.parent && refItem.parent === item && refItem.parent instanceof TreeItem) {
                    result = refItem.parent;
                } else if (item.open && item._children) {
                    // element above is open, find last available element
                    var last = item.element.lastChild;
                    if (last.ui)
                        last = last.ui;

                    if (last) {
                        var findLast = function (inside) {
                            if (inside.open && inside._children) {
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

                        result = last;
                    } else {
                        result = item;
                    }
                } else {
                    result = item;
                }
            }

            return result;
        };

        var next = function (refItem) {
            var result = null;
            var item = refItem.element.nextSibling;
            if (item)
                item = item.ui;

            if (refItem.open && refItem._children) {
                // select a child
                var first = refItem.element.firstChild.nextSibling;
                if (first && first.ui) {
                    result = first.ui;
                } else if (item) {
                    result = item;
                }
            } else if (item) {
                // select next item
                result = item;
            } else if (refItem.parent && refItem.parent instanceof TreeItem) {
                // no next element, go to parent
                var parent = refItem.parent;

                var findNext = function (from) {
                    var next = from.next;
                    if (next) {
                        result = next;
                    } else if (from.parent instanceof TreeItem) {
                        return from.parent;
                    }
                    return false;
                };

                while (parent = findNext(parent)) { }
            }

            return result;
        };

        var done = false;
        var path = null;
        var lookUp = true;
        var lookDown = true;
        var lookingUp = true;
        while (!done && !path) {
            lookingUp = !lookingUp;

            var item = null;
            var lookFrom = from;
            if ((!lookDown || lookingUp) && lookUp) {
                // up
                if (up.length)
                    lookFrom = up[up.length - 1];

                item = prev(lookFrom);
                if (item) {
                    up.push(item);

                    if (item === to) {
                        done = true;
                        path = up;
                        break;
                    }
                } else {
                    lookUp = false;
                }
            } else if (lookDown) {
                // down
                if (down.length)
                    lookFrom = down[down.length - 1];

                item = next(lookFrom);
                if (item) {
                    down.push(item);

                    if (item === to) {
                        done = true;
                        path = down;
                        break;
                    }
                } else {
                    lookDown = false;
                }
            } else {
                done = true;
            }
        }

        if (path) {
            for (var i = 0; i < path.length; i++) {
                path[i].selected = true;
            }
        }


    } else {
        var selected = item.selected && ((this._selected.indexOf(item) === -1) || (this._selected.length === 1 && this._selected[0] === item));
        this.clear();

        if (!selected)
            item.selected = true;
    }
};


Tree.prototype._onSelect = function (item) {
    this._selected.push(item);
};


Tree.prototype._onDeselect = function (item) {
    var ind = this._selected.indexOf(item);
    if (ind === -1)
        return;

    this._selected.splice(ind, 1);
};


Tree.prototype.clear = function () {
    if (!this._selected.length)
        return;

    var i = this._selected.length;
    while (i--) {
        this._selected[i].selected = false;
    }
    this._selected = [];
};


Tree.prototype._onDragStart = function (item) {
    if (!this.draggable || this._dragging)
        return;

    this._dragItems =  [];

    if (this._selected && this._selected.length > 1 && this._selected.indexOf(item) !== -1) {
        var items = [];
        var index = { };
        var defaultLevel = -1;

        // build index
        for (var i = 0; i < this._selected.length; i++) {
            // cant drag parent
            if (this._selected[i].parent === this)
                return;

            this._selected[i]._dragId = i + 1;
            index[this._selected[i]._dragId] = this._selected[i];
        }

        for (var i = 0; i < this._selected.length; i++) {
            var s = this._selected[i];
            var level = 0;
            var child = false;
            var parent = this._selected[i].parent;
            if (!(parent instanceof ui.TreeItem))
                parent = null;

            while (parent) {
                if (parent._dragId && index[parent._dragId]) {
                    // child, to be ignored
                    child = true;
                    break;
                }

                parent = parent.parent;
                if (!(parent instanceof ui.TreeItem)) {
                    parent = null;
                    break;
                }

                level++;
            }

            if (!child) {
                if (defaultLevel === -1) {
                    defaultLevel = level;
                } else if (defaultLevel !== level) {
                    // multi-level drag no allowed
                    return;
                }

                items.push(this._selected[i]);
            }
        }

        // clean ids
        for (var i = 0; i < this._selected.length; i++)
            this._selected[i]._dragId = null;

        this._dragItems = items;

        // sort items by their number of apperance in hierarchy
        if (items.length > 1) {
            var commonParent = null;

            // find common parent
            var findCommonParent = function (items) {
                var parents = [];
                for (var i = 0; i < items.length; i++) {
                    if (parents.indexOf(items[i].parent) === -1)
                        parents.push(items[i].parent);
                }
                if (parents.length === 1) {
                    commonParent = parents[0];
                } else {
                    return parents;
                }
            };
            var parents = items;
            while (!commonParent && parents)
                parents = findCommonParent(parents);

            // calculate ind number
            for (var i = 0; i < items.length; i++) {
                var ind = 0;

                var countChildren = function (item) {
                    if (!item._children) {
                        return 0;
                    }
                    var count = 0;
                    var children = item.innerElement.childNodes;
                    for (var i = 0; i < children.length; i++) {
                        if (children[i].ui)
                            count += countChildren(children[i]) + 1;
                    }
                    return count;

                };

                var scanUpForIndex = function (item) {
                    ind++;

                    var sibling = item.element.previousSibling;
                    sibling = (sibling && sibling.ui) || null;

                    if (sibling) {
                        ind += countChildren(sibling);
                        return sibling;
                    } else if (item.parent === commonParent) {
                        return null;
                    }
                    return item.parent;

                };

                var prev = scanUpForIndex(items[i]);
                while (prev)
                    prev = scanUpForIndex(prev);

                items[i]._dragInd = ind;
            }

            items.sort(function (a, b) {
                return a._dragInd - b._dragInd;
            });
        }
    } else {
        // single drag
        this._dragItems = [item];
    }

    if (this._dragItems.length) {
        this._dragging = true;

        this.class.add('dragging');
        for (var i = 0; i < this._dragItems.length; i++) {
            this._dragItems[i].class.add('dragged');
        }

        this._updateDragHandle();
        this.emit('dragstart');
    }
};


Tree.prototype._onDragOver = function (item, evt) {
    if (!this.draggable || !this._dragging || (this._dragItems.indexOf(item) !== -1 && !this._dragOver) || this._dragOver === item)
        return;

    var dragOver = null;

    if (item.allowDrop) {
        if (this._dragItems.indexOf(item) === -1)
            dragOver = item;

        if (this._dragOver === null && dragOver)
            this.emit('dragin');
    }


    this._dragOver = dragOver;

    this._updateDragHandle();
    this._onDragMove(evt);
};


Tree.prototype._hoverCalculate = function (evt) {
    if (!this.draggable || !this._dragOver)
        return;

    var rect = this.elementDrag.getBoundingClientRect();
    var area = Math.floor((evt.clientY - rect.top) / rect.height * 5);

    var oldArea = this._dragArea;
    var oldDragOver = this._dragOver;

    if (this._dragOver.parent === this) {
        var parent = false;
        for (var i = 0; i < this._dragItems.length; i++) {
            if (this._dragItems[i].parent === this._dragOver) {
                parent = true;
                this._dragOver = null;
                break;
            }
        }
        if (!parent)
            this._dragArea = 'inside';
    } else {
        // check if we are trying to drag item inside any of its children
        var invalid = false;
        for (var i = 0; i < this._dragItems.length; i++) {
            var parent = this._dragOver.parent;
            while (parent) {
                if (parent === this._dragItems[i]) {
                    invalid = true;
                    break;
                }

                parent = parent.parent;
            }
        }

        if (invalid) {
            this._dragOver = null;
        } else if (this.reordering && area <= 1 && this._dragItems.indexOf(this._dragOver.prev) === -1) {
            this._dragArea = 'before';
        } else if (this.reordering && area >= 4 && this._dragItems.indexOf(this._dragOver.next) === -1 && (this._dragOver._children === 0 || !this._dragOver.open)) {
            this._dragArea = 'after';
        } else {
            var parent = false;
            if (this.reordering && this._dragOver.open) {
                for (var i = 0; i < this._dragItems.length; i++) {
                    if (this._dragItems[i].parent === this._dragOver) {
                        parent = true;
                        this._dragArea = 'before';
                        break;
                    }
                }
            }
            if (!parent)
                this._dragArea = 'inside';
        }
    }

    if (oldArea !== this._dragArea || oldDragOver !== this._dragOver)
        this._updateDragHandle();
};


Tree.prototype._onDragMove = function (evt) {
    if (!this.draggable)
        return;

    this._hoverCalculate(evt);
    this.emit('dragmove', evt);
};


Tree.prototype._onDragOut = function () {
    if (!this.draggable || !this._dragging || !this._dragOver)
        return;

    this._dragOver = null;
    this._updateDragHandle();
    this.emit('dragout');
};


Tree.prototype._onDragEnd = function () {
    if (!this.draggable || !this._dragging)
        return;

    var reparentedItems = [];
    this._dragging = false;
    this.class.remove('dragging');

    var lastDraggedItem = this._dragOver;

    for (var i = 0; i < this._dragItems.length; i++) {
        this._dragItems[i].class.remove('dragged');

        if (this._dragOver && this._dragOver !== this._dragItems[i]) {

            var oldParent = this._dragItems[i].parent;

            if (oldParent !== this._dragOver || this._dragArea !== 'inside') {
                var newParent = null;

                if (this.dragInstant) {
                    if (this._dragItems[i].parent)
                        this._dragItems[i].parent.remove(this._dragItems[i]);
                }

                if (this._dragArea === 'before') {
                    newParent = this._dragOver.parent;
                    if (this.dragInstant)
                        this._dragOver.parent.appendBefore(this._dragItems[i], this._dragOver);
                } else if (this._dragArea === 'inside') {
                    newParent = this._dragOver;
                    if (this.dragInstant) {
                        this._dragOver.open = true;
                        this._dragOver.append(this._dragItems[i]);
                    }
                } else if (this._dragArea === 'after') {
                    newParent = this._dragOver.parent;
                    if (this.dragInstant) {
                        this._dragOver.parent.appendAfter(this._dragItems[i], lastDraggedItem);
                        lastDraggedItem = this._dragItems[i];
                    }
                }

                reparentedItems.push({
                    item: this._dragItems[i],
                    old: oldParent,
                    new: newParent
                });
            }
        }
    }

    if (reparentedItems.length) {
        this.emit('reparent', reparentedItems);
    }

    this._dragItems = [];

    if (this._dragOver)
        this._dragOver = null;

    this.emit('dragend');
};


Tree.prototype._updateDragHandle = function () {
    if (!this.draggable || !this._dragging)
        return;

    if (!this._dragOver) {
        this.elementDrag.classList.add('hidden');
    } else {
        var rect = this._dragOver.elementTitle.getBoundingClientRect();

        this.elementDrag.classList.remove('before', 'inside', 'after', 'hidden');
        this.elementDrag.classList.add(this._dragArea);

        this.elementDrag.style.top = rect.top  + 'px';
        this.elementDrag.style.left = rect.left + 'px';
        this.elementDrag.style.width = (rect.width - 4) + 'px';
    }
};


Tree.prototype._onAppend = function (item) {
    item.tree = this;

    var self = this;

    item.on('dragstart', function () {
        // can't drag root
        if (this.parent === self)
            return;

        self._onDragStart(this);
    });

    item.on('mouseover', function (evt) {
        self._onDragOver(this, evt);
    });

    item.on('dragend', function () {
        self._onDragEnd();
    });
};


Tree.prototype._onRemove = function (item) {
    item.tree = null;

    item.unbind('dragstart');
    item.unbind('mouseover');
    item.unbind('dragend');
};

window.ui.Tree = Tree;
