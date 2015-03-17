"use strict";

function Menu(args) {
    args = args || { };
    ui.ContainerElement.call(this);

    this.element = document.createElement('ul');
    this.element.classList.add('ui-menu');

    this.on('select', this._onSelect);
}
Menu.prototype = Object.create(ui.ContainerElement.prototype);


// Menu.prototype._onSelect = function(item) {
//     var items = this.element.querySelectorAll('.ui-menu-item.selected');

//     if (items.length > 1) {
//         for(var i = 0; i < items.length; i++) {
//             if (items[i].ui === item)
//                 continue;

//             items[i].ui.selected = false;
//         }
//     }
// };


// Object.defineProperty(Menu.prototype, 'selectable', {
//     get: function() {
//         return this._selectable;
//     },
//     set: function(value) {
//         if (this._selectable === !! value)
//             return;

//         this._selectable = value;

//         if (this._selectable) {
//             this.class.add('selectable');
//         } else {
//             this.class.remove('selectable');
//         }
//     }
// })


// Object.defineProperty(Menu.prototype, 'selected', {
//     get: function() {
//         var items = [ ];
//         var elements = this.element.querySelectorAll('.ui-menu-item.selected');

//         for(var i = 0; i < elements.length; i++) {
//             items.push(elements[i].ui);
//         }

//         return items;
//     },
//     set: function(value) {
//         // deselecting
//         var items = this.selected;
//         for(var i = 0; i < items.length; i++) {
//             if (value.indexOf(items[i]) !== -1)
//                 continue;
//             items[i].selected = false;
//         }

//         // selecting
//         for(var i = 0; i < value.length; i++) {
//             value[i].selected = true;
//         }
//     }
// });


window.ui.Menu = Menu;
