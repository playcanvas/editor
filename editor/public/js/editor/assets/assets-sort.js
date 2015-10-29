editor.once('load', function() {
    'use strict';

    // var grid = editor.call('assets:grid');

    // var sortQueued = false;
    // var sort = function() {
    //     sortQueued = false;

    //     var start = performance.now();
    //     var items = [ ];
    //     var ind = 0;
    //     for(var i = 0; i < grid.element.children.length; i++) {
    //         var item = grid.element.children[i];
    //         if (item.ui.hidden)
    //             continue;

    //         var name = item.ui.labelElement.textContent.toLowerCase();
    //         items.push({
    //             ind: ind++,
    //             name: name,
    //             folder: item.ui.asset.get('type') === 'folder',
    //             element: item
    //         });
    //     }

    //     if (items.length <= 1)
    //         return;

    //     console.log(items.map(function(i) { return i.name; }).join(', '));

    //     items.sort(function(a, b) {
    //         if (a.folder !== b.folder)
    //             return b.folder - a.folder;

    //         if (a.name < b.name) {
    //             return -1;
    //         } else if (a.name > b.name) {
    //             return 1;
    //         } else {
    //             return 0;
    //         }
    //     });

    //     console.log(items.map(function(i) { return i.name; }).join(', '));

    //     for(var i = 0; i < items.length; i++) {
    //         // if (items[i].ind === i || items[i].ind > i)
    //         //     continue;

    //         // var a = items[i];
    //         // var b = items[a.ind];

    //         // var next = a.element.nextSibling;
    //         // grid.element.removeChild(a.element);
    //         // grid.element.insertBefore(a.element, b.element);

    //         // grid.element.removeChild(b.element);
    //         // if (next && next.parentNode === grid.element) {
    //         //     grid.element.insertBefore(b.element, next);
    //         // } else {
    //         //     grid.element.appendChild(b.element);
    //         // }

    //         // items[i] = b;
    //         // items[a.ind] = a;
    //         // b.ind = a.ind;
    //         // a.ind = i;

    //         // console.log(a.name, '<>', b.name)

    //         items[i].element.parentNode.removeChild(items[i].element);
    //         grid.element.appendChild(items[i].element);
    //     }

    //     if (grid.selected.length)
    //         grid.selected[0].element.scrollIntoView();

    //     console.log(performance.now() - start);
    // };

    // var queueSort = function() {
    //     if (sortQueued) return;
    //     sortQueued = true;

    //     requestAnimationFrame(sort);
    // };

    // grid.on('append', function(item) {
    //     var evtName;

    //     if (item.asset) {
    //         evtName = item.asset.on('name:set', queueSort)
    //     } else if (item.script) {
    //         evtName = item.script.on('filename:set', queueSort)
    //     }

    //     if (item.hidden)
    //         return;

    //     if (evtName) {
    //         item.once('destroy', function() {
    //             evtName.unbind();
    //         });
    //     }

    //     queueSort();
    // });

    // editor.on('assets:panel:currentFolder', function() {
    //     queueSort();
    // });
});
