"use strict";

function GridItem(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';
    this._selected = args.selected || false;

    this.element = document.createElement('li');
    this.element.tabIndex = 0;
    this.element.classList.add('ui-grid-item');
    this.element.innerHTML = this._text;

    this.element.removeEventListener('click');
    this.element.addEventListener('click', this._onClick.bind(this), false);

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
    this.selected = ! this.selected;
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

        this._selected = value;

        if (this._selected) {
            this.element.classList.add('selected');
        } else {
            this.element.classList.remove('selected');
        }

        this.emit(this.selected ? 'select' : 'deselect');
        this.emit('change', this.selected);

        if (this.parent) {
            this.parent.emit(this.selected ? 'select' : 'deselect', this);
        }
    }
});


window.ui.GridItem = GridItem;
