"use strict";

function Grid() {
    ui.ContainerElement.call(this);

    this.element = document.createElement('ul');
    this.element.classList.add('ui-grid');

    this.on('select', this._onSelect);
}
Grid.prototype = Object.create(ui.ContainerElement.prototype);


Grid.prototype._onSelect = function(item) {
    var items = this.element.querySelectorAll('.ui-grid-item.selected');

    if (items.length > 1) {
        for(var i = 0; i < items.length; i++) {
            if (items[i].ui === item)
                continue;

            items[i].ui.selected = false;
        }
    }
};


Object.defineProperty(Grid.prototype, 'selected', {
    get: function() {
        var items = [ ];
        var elements = this.element.querySelectorAll('.ui-grid-item.selected');

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


window.ui.Grid = Grid;
