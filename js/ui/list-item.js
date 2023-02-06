function ListItem(args) {
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';
    this._selected = args.selected || false;
    // if true then clicking on a selected item will deselect it (defaults to true)
    this._allowDeselect = args.allowDeselect !== undefined ? args.allowDeselect : true;

    this.element = document.createElement('li');
    this._element.classList.add('ui-list-item');

    this.elementText = document.createElement('span');
    this.elementText.textContent = this._text;
    this._element.appendChild(this.elementText);

    this.on('click', this._onClick);
}
ListItem.prototype = Object.create(ui.Element.prototype);


ListItem.prototype._onClick = function () {
    if (!this.selected) {
        this.selected = true;
    } else if (this._allowDeselect) {
        this.selected = false;
    }
};


Object.defineProperty(ListItem.prototype, 'text', {
    get: function () {
        return this._text;
    },
    set: function (value) {
        if (this._text === value) return;
        this._text = value;
        this.elementText.textContent = this._text;
    }
});


Object.defineProperty(ListItem.prototype, 'selected', {
    get: function () {
        return this._selected;
    },
    set: function (value) {
        if (this._selected === value)
            return;

        this._selected = value;

        if (this._selected) {
            this._element.classList.add('selected');
        } else {
            this._element.classList.remove('selected');
        }

        this.emit(this.selected ? 'select' : 'deselect');

        if (this.parent)
            this.parent.emit(this.selected ? 'select' : 'deselect', this);

        this.emit('change', this.selected);
    }
});


window.ui.ListItem = ListItem;
