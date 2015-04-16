editor.once('load', function() {
    'use strict'

    var panel = editor.call('layout.left');

    // controls
    var controls = new ui.Panel();
    controls.class.add('hierarchy-controls');
    controls.parent = panel;
    panel.headerAppend(controls);
    // panel.element.appendChild(controls.element);

    // controls delete
    var btnDelete = new ui.Button({
        text: '&#58657;'
    });
    btnDelete.class.add('delete');
    btnDelete.element.title = 'Delete Entity';
    btnDelete.on('click', function() {
        var type = editor.call('selector:type');

        if (type !== 'entity')
            return;

        var items = editor.call('selector:items');
        for(var i = 0; i < items.length; i++)
            editor.call('entities:delete', items[i]);
    });
    controls.append(btnDelete);

    // controls duplicate
    var btnDuplicate = new ui.Button({
        text: '&#57908;'
    });
    btnDuplicate.disabled = true;
    btnDuplicate.class.add('duplicate');
    btnDuplicate.element.title = 'Duplicate Entity';
    btnDuplicate.on('click', function() {
        var type = editor.call('selector:type');
        var items = editor.call('selector:items');

        if (type === 'entity' && items.length)
            editor.call('entities:duplicate', items[0]);
    });
    controls.append(btnDuplicate);

    // controls add
    var btnAdd = new ui.Button({
        text: '&#58468;'
    });
    btnAdd.class.add('add');
    btnAdd.element.title = 'New Entity';
    btnAdd.on('click', function() {
        var parent = editor.call('entities:selectedFirst');
        editor.call('entities:new', {
            parent: parent
        });
    });
    controls.append(btnAdd);

    editor.on('attributes:clear', function() {
        btnDuplicate.disabled = true;
        btnDelete.disabled = true;
    });

    editor.on('attributes:inspect[*]', function(type, items) {
        var root = editor.call('entities:root');

        btnDelete.enabled = type === 'entity' && items[0] !== root;
        btnDuplicate.enabled = btnDelete.enabled;
    });
});
