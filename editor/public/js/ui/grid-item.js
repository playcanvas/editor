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
    this.element.ui = this;
    this.element.tabIndex = 0;
    this.element.classList.add('ui-grid-item');
    this.element.innerHTML = this._text;

    this.element.removeEventListener('click', this._evtClick);
    this.element.addEventListener('click', this._onClick, false);

    this.on('select', this._onSelect);
    this.on('deselect', this._onDeselect);
}
GridItem.prototype = Object.create(ui.Element.prototype);


GridItem.prototype._onClick = function() {
    this.ui.emit('click');
    this.ui._clicked = true;
    this.ui.selected = ! this.ui.selected;
    this.ui._clicked = false;
};

GridItem.prototype._onSelect = function() {
    this.element.focus();
};

GridItem.prototype._onDeselect = function() {
    this.element.blur();
};


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
