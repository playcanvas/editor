editor.once('load', function() {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

    // var newEntity = function () {
    //     var parent = editor.call('entities:selectedFirst');
    //     editor.call('entities:new', parent);
    // };

    // var duplicateEntity = function () {
    //     var entity = editor.call('entities:selectedFirst');
    //     if (entity)
    //         editor.call('entities:duplicate', entity);
    // };

    // var deleteEntity = function () {
    //     var entity = editor.call('entities:selectedFirst');
    //     if (entity)
    //         editor.call('entities:delete', entity);
    // };


    // new
    var btnNew = new ui.Button({
        text: '&#57873;'
    });
    btnNew.class.add('icon');
    btnNew.element.title = 'New Entity';
    btnNew.on('click', function() {
        var parent = editor.call('entities:selectedFirst');
        editor.call('entities:new', parent);
    });
    toolbar.append(btnNew);


    // duplicate
    var btnDuplicate = new ui.Button({
        text: '&#57908;'
    });
    btnDuplicate.disabled = true;
    btnDuplicate.class.add('icon');
    btnDuplicate.element.title = 'Duplicate';
    btnDuplicate.on('click', function() {
        var type = editor.call('selector:type');
        var items = editor.call('selector:items');

        if (type === 'entity' && items.length)
            editor.call('entities:duplicate', items[0]);
    });
    toolbar.append(btnDuplicate);


    // delete
    var btnDelete = new ui.Button({
        text: '&#58657;'
    });
    btnDelete.disabled = true;
    btnDelete.class.add('icon');
    btnDelete.element.title = 'Delete';
    btnDelete.on('click', function() {
        var type = editor.call('selector:type');
        var items = editor.call('selector:items');

        if (type === 'entity') {
            for(var i = 0; i < items.length; i++)
                editor.call('entities:delete', items[i]);
        } else if (type === 'asset') {
            editor.call('picker:confirm', 'Delete Asset?', function() {
                for(var i = 0; i < items.length; i++)
                    editor.call('assets:delete', items[i]);
            });
        }
    });
    toolbar.append(btnDelete);


    editor.on('attributes:clear', function() {
        btnDuplicate.disabled = true;
        btnDelete.disabled = true;
    });

    editor.on('attributes:inspect[*]', function(type) {
        var canDelete = [ 'entity', 'asset' ].indexOf(type) !== -1;
        var canDuplicate = type == 'entity';

        btnDelete.disabled = ! canDelete;
        btnDuplicate.disabled = ! canDuplicate;
    });


    // [{
    //     icon: '&#57873;',
    //     tooltip: 'New Entity',
    //     handler: newEntity
    // }, {
    //     icon: '&#57908;',
    //     tooltip: 'Duplicate',
    //     handler: duplicateEntity
    // }, {
    //     icon: '&#58657;',
    //     tooltip: 'Delete',
    //     handler: deleteEntity
    // }].forEach(function (item) {
    //     // Duplicate Entity button
    //     var button = new ui.Button({
    //         text: item.icon
    //     });
    //     button.class.add('icon');
    //     button.element.title = item.tooltip;
    //     toolbar.append(button);

    //     button.on('click', item.handler);
    // });


    // duplicate
    editor.call('hotkey:register', 'entity:duplicate', {
        key: 'd',
        ctrl: true,
        callback: function() {
            if (! editor.call('permissions:write'))
                return;

            btnDuplicate.emit('click');
        }
    });
});
