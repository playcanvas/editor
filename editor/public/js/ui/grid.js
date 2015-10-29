"use strict";

function Grid() {
    var self = this;
    ui.ContainerElement.call(this);

    this.element = document.createElement('ul');
    this.element.tabIndex = 0;
    this.element.classList.add('ui-grid');

    this.elementDrag = document.createElement('div');
    this.elementDrag.classList.add('drag-handle');
    this.element.appendChild(this.elementDrag);

    // var self = this;
    // this.elementDrag.addEventListener('mousemove', function(evt) {
    //     evt.preventDefault();
    //     evt.stopPropagation();

    //     self._onDragMove(evt);
    // });
    // this.element.addEventListener('mouseleave', function(evt) {
    //     self._onDragOut();
    // });

    this._lastSelect = null;
    this._selecting = false;

    this.on('select', this._onSelect);
    this.on('beforeDeselect', this._onBeforeDeselect);

    this.on('append', this._onAppend);
    this.on('remove', this._onRemove);
}
Grid.prototype = Object.create(ui.ContainerElement.prototype);


Grid.prototype._onSelect = function(item) {
    if (this._selecting)
        return;

    if (Grid._shift && Grid._shift()) {
        // multi select from-to
        var items = this.element.querySelectorAll('.ui-grid-item.selected');
        if (this._lastSelect) {
            var el = this.element.firstChild;
            var start = false;
            var elementStart = null;

            this._selecting = true;

            var c = 100;

            while(el && c--) {
                if (el === this._lastSelect.element || el === item.element) {
                    if (start)
                        break;

                    start = true;
                }

                if (start && ! el.ui.hidden)
                    el.ui.selected = true;

                el = el.nextSibling;
            }

            this._selecting = false;
        } else {
            this._lastSelect = item;
        }
    } else if (Grid._ctrl && Grid._ctrl()) {
        // multi select
        this._lastSelect = item;
    } else {
        // single select
        var items = this.element.querySelectorAll('.ui-grid-item.selected');

        if (items.length > 1) {
            for(var i = 0; i < items.length; i++) {
                if (items[i].ui === item)
                    continue;

                items[i].ui.selected = false;
            }
        }

        this._lastSelect = item;
    }
};


Grid.prototype._onBeforeDeselect = function(item) {
    if (this._selecting)
        return;

    this._selecting = true;

    if (Grid._shift && Grid._shift()) {
        this._lastSelect = null;
    } else if (Grid._ctrl && Grid._ctrl()) {
        this._lastSelect = null;
    } else {
        var items = this.element.querySelectorAll('.ui-grid-item.selected');
        if (items.length > 1) {
            for(var i = 0; i < items.length; i++) {
                if (items[i].ui === item)
                    continue;
                items[i].ui.selected = false;
            }
            item._selectPending = true;
            this._lastSelect = item;
        }
    }

    this._selecting = false;
};


Grid.prototype.filter = function(fn) {
    this.forEach(function(item) {
        item.hidden = ! fn(item);
    });
};


Grid.prototype.forEach = function(fn) {
    var child = this.element.firstChild;
    while(child) {
        if (child.ui)
            fn(child.ui);

        child = child.nextSibling;
    };
};

// Grid.prototype._onDragStart = function(item) {
//     if (this._dragging)
//         return;

//     this.class.add('dragging');

//     this._dragItems = [ item ];
//     item.class.add('dragged');

//     this._dragging = true;
//     this._updateDragHandle();

//     this.emit('dragstart');
// };


// Grid.prototype._onDragOver = function(item, evt) {
//     if (! this._dragging || (item === this._dragItems[0] && ! this._dragOver) || this._dragOver === item)
//         return;

//     var dragOver = null;

//     if (item !== this._dragItems[0])
//         dragOver = item;

//     if (this._dragOver === null && dragOver)
//         this.emit('dragin');

//     if (dragOver)
//         this.emit('dragover', dragOver);

//     if (this._dragOver === -1) {
//         this._dragOver = null;
//     } else {
//         this._dragOver = dragOver;
//     }

//     this._updateDragHandle();
//     this._onDragMove(evt);
// };


// Grid.prototype._hoverCalculate = function(evt) {
//     if (! this._dragOver)
//         return;

//     var oldArea = this._dragArea;
//     var oldDragOver = this._dragOver;

//     this._dragArea = 'inside';

//     if (oldArea !== this._dragArea || oldDragOver !== this._dragOver)
//         this._updateDragHandle();
// };


// Grid.prototype._onDragMove = function(evt) {
//     this._hoverCalculate(evt);
//     this.emit('dragmove', evt);
// };


// Grid.prototype._onDragOut = function() {
//     if (! this._dragging || ! this._dragOver)
//         return;

//     this._dragOver = null;
//     this._updateDragHandle();
//     this.emit('dragout');
// };


// Grid.prototype._onDragEnd = function() {
//     if (! this._dragging)
//         return;

//     this._dragging = false;

//     this.class.remove('dragging');

//     for(var i = 0; i < this._dragItems.length; i++)
//         this._dragItems[i].class.remove('dragged');

//     if (this._dragOver && this._dragOver !== this._dragItems[i])
//         this.emit('drop', this._dragItems, this._dragOver);

//     this._dragItems = [ ];
//     this._dragOver = null;

//     this.emit('dragend');
// };


// Grid.prototype._updateDragHandle = function() {
//     if (! this._dragging)
//         return;

//     if (! this._dragOver) {
//         this.elementDrag.classList.add('hidden');
//     } else {
//         var rect = this._dragOver.element.getBoundingClientRect();

//         this.elementDrag.classList.remove('before', 'inside', 'after', 'hidden')
//         this.elementDrag.classList.add(this._dragArea);

//         this.elementDrag.style.top = rect.top  + 'px';
//         this.elementDrag.style.left = rect.left + 'px';
//         this.elementDrag.style.width = (rect.width - 4) + 'px';
//         this.elementDrag.style.height = (rect.height - 4) + 'px';
//     }
// };


// Grid.prototype._onAppend = function(item) {
//     item.grid = this;
//     var self = this;

//     item.on('dragstart', function() {
//         self._onDragStart(this);
//     });
//     item.on('mouseover', function(evt) {
//         self._onDragOver(this, evt);
//     });
//     item.on('dragend', function() {
//         self._onDragEnd();
//     });
// };

// Grid.prototype._onRemove = function(item) {
//     item.grid = null;
//     item.unbind('dragstart');
//     item.unbind('mouseover');
//     item.unbind('dragend');
// };


Object.defineProperty(Grid.prototype, 'selected', {
    get: function() {
        var items = [ ];
        var elements = this.element.querySelectorAll('.ui-grid-item.selected');

        for(var i = 0; i < elements.length; i++)
            items.push(elements[i].ui);

        return items;
    },
    set: function(value) {
        this._selecting = true;

        // deselecting
        var items = this.selected;
        for(var i = 0; i < items.length; i++) {
            if (value && value.indexOf(items[i]) !== -1)
                continue;
            items[i].selected = false;
        }

        if (! value)
            return;

        // selecting
        for(var i = 0; i < value.length; i++) {
            if (! value[i])
                continue;

            value[i].selected = true;
        }

        this._selecting = false;
    }
});


window.ui.Grid = Grid;
