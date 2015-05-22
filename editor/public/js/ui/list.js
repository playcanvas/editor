"use strict";

function List(args) {
    args = args || { };
    ui.ContainerElement.call(this);

    this.element = document.createElement('ul');
    this.element.classList.add('ui-list');
    this.selectable = args.selectable !== undefined ? args.selectable : true;

    this.on('select', this._onSelect);
}
List.prototype = Object.create(ui.ContainerElement.prototype);


List.prototype._onSelect = function(item) {
    var items = this.element.querySelectorAll('.ui-list-item.selected');

    if (items.length > 1) {
        for(var i = 0; i < items.length; i++) {
            if (items[i].ui === item)
                continue;

            items[i].ui.selected = false;
        }
    }
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
        var items = [ ];
        var elements = this.element.querySelectorAll('.ui-list-item.selected');

        for(var i = 0; i < elements.length; i++) {
            items.push(elements[i].ui);
        }

        return items;
    },
    set: function(value) {
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
    }
});


window.ui.List = List;
