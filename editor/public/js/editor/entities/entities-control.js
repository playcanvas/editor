editor.once('load', function() {
    'use strict'

    var root = editor.call('layout.root');
    var panel = editor.call('layout.left');

    // controls
    var controls = new ui.Panel();
    controls.class.add('hierarchy-controls');
    controls.parent = panel;
    panel.headerAppend(controls);
    // panel.element.appendChild(controls.element);


    // controls delete
    var btnDelete = new ui.Button({
        text: '&#57636;'
    });
    btnDelete.class.add('delete');
    btnDelete.style.fontWeight = 200;
    btnDelete.on('click', function() {
        var type = editor.call('selector:type');

        if (type !== 'entity')
            return;

        editor.call('entities:delete', editor.call('selector:items'));
    });
    controls.append(btnDelete);

    var tooltipDelete = Tooltip.attach({
        target: btnDelete.element,
        text: 'Delete Entity',
        align: 'top',
        root: root
    });
    tooltipDelete.class.add('innactive');


    // controls duplicate
    var btnDuplicate = new ui.Button({
        text: '&#57638;'
    });
    btnDuplicate.disabled = true;
    btnDuplicate.class.add('duplicate');
    btnDuplicate.on('click', function() {
        var type = editor.call('selector:type');
        var items = editor.call('selector:items');

        if (type === 'entity' && items.length)
            editor.call('entities:duplicate', items[0]);
    });
    controls.append(btnDuplicate);

    var tooltipDuplicate = Tooltip.attach({
        target: btnDuplicate.element,
        text: 'Duplicate Entity',
        align: 'top',
        root: root
    });
    tooltipDuplicate.class.add('innactive');

    var menuEntities = ui.Menu.fromData(editor.call('menu:entities:new'));
    root.append(menuEntities);

    // controls add
    var btnAdd = new ui.Button({
        text: '&#57632;'
    });
    btnAdd.class.add('add');
    btnAdd.on('click', function() {
        menuEntities.open = true;
        var rect = btnAdd.element.getBoundingClientRect();
        menuEntities.position(rect.left, rect.top);
    });
    controls.append(btnAdd);

    Tooltip.attach({
        target: btnAdd.element,
        text: 'Add Entity',
        align: 'top',
        root: root
    });


    editor.on('attributes:clear', function() {
        btnDuplicate.disabled = true;
        btnDelete.disabled = true;
        tooltipDelete.class.add('innactive');
        tooltipDuplicate.class.add('innactive');
    });

    editor.on('attributes:inspect[*]', function(type, items) {
        var root = editor.call('entities:root');

        if (type === 'entity' && items[0] !== root) {
            btnDelete.enabled = true;
            btnDuplicate.enabled = true;
            tooltipDelete.class.remove('innactive');
            tooltipDuplicate.class.remove('innactive');
        } else {
            btnDelete.enabled = false;
            btnDuplicate.enabled = false;
            tooltipDelete.class.add('innactive');
            tooltipDuplicate.class.add('innactive');
        }
    });
});
