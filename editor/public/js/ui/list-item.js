"use strict";

function ListItem(args) {
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';
    this._selected = args.selected || false;

    this.element = document.createElement('li');
    this.element.classList.add('ui-list-item');
    this.element.innerHTML = this._text;

    this.on('click', function() {
        this.selected = ! this.selected;
    });
}
ListItem.prototype = Object.create(ui.Element.prototype);


Object.defineProperty(ListItem.prototype, 'text', {
    get: function() {
        return this._text;
    },
    set: function(value) {
        if (this._text === value) return;
        this._text = value;
        this.element.innerHTML = this._text;
    }
});


Object.defineProperty(ListItem.prototype, 'selected', {
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


window.ui.ListItem = ListItem;
