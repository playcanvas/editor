"use strict";

function List(args) {
    args = args || { };
    ui.ContainerElement.call(this);

    this.element = document.createElement('ul');
    this._element.classList.add('ui-list');
    this.selectable = args.selectable !== undefined ? args.selectable : true;

    this._changing = false;
    this._selected = [ ];

    this.on('select', this._onSelect);
    this.on('deselect', this._onDeselect);
    this.on('append', this._onAppend);
}
List.prototype = Object.create(ui.ContainerElement.prototype);


List.prototype._onSelect = function(item) {
    var ind = this._selected.indexOf(item);
    if (ind === -1)
        this._selected.push(item);

    if (this._changing)
        return;

    if (List._ctrl && List._ctrl()) {

    } else if (List._shift && List._shift() && this.selected.length) {

    } else {
        this._changing = true;

        var items = this.selected;

        if (items.length > 1) {
            for(var i = 0; i < items.length; i++) {
                if (items[i] === item)
                    continue;

                items[i].selected = false;
            }
        }

        this._changing = false;
    }

    this.emit('change');
};

List.prototype._onDeselect = function(item) {
    var ind = this._selected.indexOf(item);
    if (ind !== -1) this._selected.splice(ind, 1);

    if (this._changing)
        return;

    if (List._ctrl && List._ctrl()) {

    } else {
        this._changing = true;

        var items = this.selected;

        if (items.length) {
            for(var i = 0; i < items.length; i++)
                items[i].selected = false;

            item.selected = true;
        }

        this._changing = false;
    }

    this.emit('change');
};

List.prototype._onAppend = function(item) {
    if (! item.selected)
        return;

    var ind = this._selected.indexOf(item);
    if (ind === -1) this._selected.push(item);
};

List.prototype.clear = function() {
    this._selected = [ ];
    ui.ContainerElement.prototype.clear.call(this);
};


Object.defineProperty(List.prototype, 'selectable', {
    get: function() {
        return this._selectable;
    },
    set: function(value) {
        if (this._selectable === !! value)
            return;

        this._selectable = value;

        if (this._selectable) {
            this.class.add('selectable');
        } else {
            this.class.remove('selectable');
        }
    }
});


Object.defineProperty(List.prototype, 'selected', {
    get: function() {
        return this._selected.slice(0);
    },
    set: function(value) {
        this._changing = true;

        // deselecting
        var items = this.selected;
        for(var i = 0; i < items.length; i++) {
            if (value.indexOf(items[i]) !== -1)
                continue;

            items[i].selected = false;
        }

        // selecting
        for(var i = 0; i < value.length; i++) {
            value[i].selected = true;
        }

        this._changing = false;
    }
});


window.ui.List = List;
