"use strict";

function Tree() {
    ui.ContainerElement.call(this);

    this.element = document.createElement('div');
    this.element.classList.add('ui-tree');

    this.elementDrag = document.createElement('div');
    this.elementDrag.classList.add('drag-handle');
    this.element.appendChild(this.elementDrag);

    var self = this;
    this.elementDrag.addEventListener('mousemove', function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        self._onDragMove(evt);
    });
    this.element.addEventListener('mouseleave', function(evt) {
        self._onDragOut();
    });

    this.on('select', this._onSelect);
    this.on('deselect', this._onDeselect);
    this.on('append', this._onAppend);
    this.on('remove', this._onRemove);

    this._dragging = false;
    this._dragItems = [ ];
    this._dragOver = null;
    this._dragArea = 'inside';
    this._evtDragMove = null;

    this._selected = [ ];
}
Tree.prototype = Object.create(ui.ContainerElement.prototype);


Tree.prototype._onSelect = function(item) {
    if (this._selected.length) {
        var i = this._selected.length;
        while(i--) {
            this._selected[i].selected = false;
        }
        this._selected = [ ];
    }

    this._selected.push(item);
};


Tree.prototype._onDeselect = function(item) {
    var ind = this._selected.indexOf(item);
    if (ind === -1)
        return;

    this._selected.splice(ind, 1);
};


Tree.prototype._onDragStart = function(item) {
    if (this._dragging)
        return;

    this.class.add('dragging');

    this._dragItems = [ item ];
    item.class.add('dragged');

    this._dragging = true;

    if (this._selected) {
        var i = this._selected.length;
        while(i--) {
            this._selected[i].selected = false;
        }
        this._selected = [ ];
    }

    this._updateDragHandle();
};


Tree.prototype._onDragOver = function(item, evt) {
    if (! this._dragging || (item === this._dragItems[0] && ! this._dragOver) || this._dragOver === item)
        return;

    if (this._dragOver)
        this._dragOver = null;

    if (item !== this._dragItems[0])
        this._dragOver = item;

    this._updateDragHandle();
    this._onDragMove(evt);
};


Tree.prototype._onDragMove = function(evt) {
    if (! this._dragOver)
        return;

    var rect = this.elementDrag.getBoundingClientRect();
    var area = Math.floor((evt.clientY - rect.top) / rect.height * 5);

    var oldArea = this._dragArea;
    var oldDragOver = this._dragOver;

    if (this._dragOver.parent === this) {
        if (this._dragItems[0].parent === this._dragOver) {
            this._dragOver = null;
        } else {
            this._dragArea = 'inside';
        }
    } else if (area <= 1 && this._dragOver.prev !== this._dragItems[0]) {
        this._dragArea = 'before';
    } else if (area >= 4 && this._dragOver.next !== this._dragItems[0] && (this._dragOver._children === 0 || ! this._dragOver.open)) {
        this._dragArea = 'after';
    } else {
        if (this._dragOver === this._dragItems[0].parent && this._dragOver.open) {
            this._dragArea = 'before';
        } else {
            this._dragArea = 'inside';
        }
    }

    if (oldArea !== this._dragArea || oldDragOver !== this._dragOver)
        this._updateDragHandle();
};


Tree.prototype._onDragOut = function() {
    if (! this._dragging || ! this._dragOver)
        return;

    this._dragOver = null;
    this._updateDragHandle();
};


Tree.prototype._onDragEnd = function() {
    if (! this._dragging)
        return;

    this._dragging = false;

    this.class.remove('dragging');

    for(var i = 0; i < this._dragItems.length; i++) {
        this._dragItems[i].class.remove('dragged');

        if (this._dragOver && this._dragOver !== this._dragItems[i]) {

            var oldParent = this._dragItems[i].parent;

            if (oldParent !== this._dragOver || this._dragArea !== 'inside') {
                if (this._dragItems[i].parent)
                    this._dragItems[i].parent.remove(this._dragItems[i]);

                if (this._dragArea === 'before') {
                    this._dragOver.parent.appendBefore(this._dragItems[i], this._dragOver);
                } else if (this._dragArea === 'inside') {
                    this._dragOver.open = true;
                    this._dragOver.append(this._dragItems[i]);
                } else if (this._dragArea === 'after') {
                    this._dragOver.parent.appendAfter(this._dragItems[i], this._dragOver);
                }

                this.emit('reparent', this._dragItems[i], oldParent);
            }
        }
    }

    this._dragItems = [ ];

    if (this._dragOver) {
        this._dragOver = null;
    }
};


Tree.prototype._updateDragHandle = function() {
    if (! this._dragging)
        return;

    if (! this._dragOver) {
        this.elementDrag.classList.add('hidden');
    } else {
        var rect = this._dragOver.elementTitle.getBoundingClientRect();

        this.elementDrag.classList.remove('before', 'inside', 'after', 'hidden')
        this.elementDrag.classList.add(this._dragArea);

        this.elementDrag.style.top = rect.top  + 'px';
        this.elementDrag.style.left = rect.left + 'px';
        this.elementDrag.style.width = (rect.width - 4) + 'px';
    }
};


Tree.prototype._onAppend = function(item) {
    item.tree = this;

    var self = this;

    item.on('dragstart', function() {
        // can't drag root
        if (this.parent === self)
            return;

        this.open = false;
        self._onDragStart(this);
    });

    item.on('mouseover', function(evt) {
        self._onDragOver(this, evt);
    });

    item.on('dragend', function() {
        self._onDragEnd();
    });
};


Tree.prototype._onRemove = function(item) {
    item.tree = null;

    item.unbind('dragstart');
    item.unbind('mouseover');
    item.unbind('dragend');
};

window.ui.Tree = Tree;
