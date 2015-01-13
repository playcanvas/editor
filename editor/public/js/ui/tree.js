"use strict";

function Tree() {
    ui.ContainerElement.call(this);

    this.element = document.createElement('div');
    this.element.classList.add('ui-tree');

    this.on('select', this._onSelect);
    this.on('deselect', this._onDeselect);
    this.on('append', this._onAppend);

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


Tree.prototype._onAppend = function(item) {
    item.tree = this;
};


window.ui.Tree = Tree;
