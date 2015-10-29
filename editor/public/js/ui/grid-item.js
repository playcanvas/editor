"use strict";

function GridItem(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';
    this._selectPending = false;
    this._selected = args.selected || false;
    this._clicked = false;

    this.element = document.createElement('li');
    this.element.tabIndex = 0;
    this.element.classList.add('ui-grid-item');
    this.element.innerHTML = this._text;

    this.element.removeEventListener('click', this._evtClick);
    this.element.addEventListener('click', this._onClick.bind(this), false);

    // this._dragRelease = null;
    // this._dragging = false;
    // this.element.addEventListener('dragstart', this._onDragStart.bind(this), false);
    // this.element.addEventListener('mouseover', this._onMouseOver.bind(this), false);

    // space > click
    this.element.addEventListener('keydown', function(evt) {
        if (evt.keyCode !== 32 || self.disabled)
            return;

        evt.stopPropagation();
        evt.preventDefault();
        self._onClick();
    }, false);

    this.on('select', function() {
        this.element.focus();
    });

    this.on('deselect', function() {
        this.element.blur();
    });
}
GridItem.prototype = Object.create(ui.Element.prototype);


GridItem.prototype._onClick = function() {
    this.emit('click');
    this._clicked = true;
    this.selected = ! this.selected;
    this._clicked = false;
};


// GridItem.prototype._onDragStart = function(evt) {
//     if (this.parent.disabled) {
//         evt.stopPropagation();
//         evt.preventDefault();
//         return;
//     }

//     this._dragging = true;

//     if (this._dragRelease)
//         window.removeEventListener('mouseup', this._dragRelease);

//     this._dragRelease = this._onMouseUp.bind(this);
//     window.addEventListener('mouseup', this._dragRelease, false);

//     evt.stopPropagation();
//     evt.preventDefault();

//     this.emit('dragstart');
// };


// GridItem.prototype._onMouseOver = function(evt) {
//     evt.stopPropagation();
//     this.emit('mouseover', evt);
// };

// GridItem.prototype._onMouseUp = function(evt) {
//     window.removeEventListener('mouseup', this._dragRelease);
//     this._dragRelease = null;

//     evt.preventDefault();
//     evt.stopPropagation();

//     this._dragging = false;
//     this.emit('dragend');
// };


Object.defineProperty(GridItem.prototype, 'text', {
    get: function() {
        return this._text;
    },
    set: function(value) {
        if (this._text === value) return;
        this._text = value;
        this.element.innerHTML = this._text;
    }
});


Object.defineProperty(GridItem.prototype, 'selected', {
    get: function() {
        return this._selected;
    },
    set: function(value) {
        if (this._selected === value)
            return;

        this._selectPending = value;
        if (this.parent && this._clicked)
            this.parent.emit('before' + (value ? 'Select' : 'Deselect'), this, this._clicked);
        if (this._selected === this._selectPending)
            return;

        this._selected = this._selectPending;

        if (this._selected) {
            this.element.classList.add('selected');
        } else {
            this.element.classList.remove('selected');
        }

        this.emit(this.selected ? 'select' : 'deselect');
        this.emit('change', this.selected);

        if (this.parent)
            this.parent.emit(this.selected ? 'select' : 'deselect', this, this._clicked);
    }
});


window.ui.GridItem = GridItem;
