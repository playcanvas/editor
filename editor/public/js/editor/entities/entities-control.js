editor.once('load', function () {
    'use strict';

    const root = editor.call('layout.root');
    const panel = editor.call('layout.hierarchy');

    const menuEntities = new pcui.Menu({ items: editor.call('menu:entities:new') });
    root.append(menuEntities);

    // controls
    const controls = new pcui.Container({
        class: 'hierarchy-controls',
        flex: true,
        flexDirection: 'row',
        alignItems: 'center',
        hidden: !editor.call('permissions:write')
    });

    editor.on('permissions:writeState', function (state) {
        controls.hidden = ! state;
    });

    panel.header.append(controls);

    // controls add
    const btnAdd = new ui.Button({
        text: '&#57632;'
    });
    btnAdd.class.add('add');
    btnAdd.on('click', function () {
        menuEntities.hidden = false;
        const rect = btnAdd.element.getBoundingClientRect();
        menuEntities.position(rect.left, rect.top);
    });
    controls.append(btnAdd);

    Tooltip.attach({
        target: btnAdd.element,
        text: 'Add Entity',
        align: 'top',
        root: root
    });

    // controls duplicate
    const btnDuplicate = new ui.Button({
        text: '&#57638;'
    });
    btnDuplicate.disabled = true;
    btnDuplicate.class.add('duplicate');
    btnDuplicate.on('click', function () {
        const type = editor.call('selector:type');
        const items = editor.call('selector:items');

        if (type === 'entity' && items.length)
            editor.call('entities:duplicate', items);
    });
    controls.append(btnDuplicate);

    const tooltipDuplicate = Tooltip.attach({
        target: btnDuplicate.element,
        text: 'Duplicate Entity',
        align: 'top',
        root: root
    });
    tooltipDuplicate.class.add('innactive');

    // controls delete
    const btnDelete = new ui.Button({
        text: '&#57636;'
    });
    btnDelete.class.add('delete');
    btnDelete.style.fontWeight = 200;
    btnDelete.on('click', function () {
        const type = editor.call('selector:type');

        if (type !== 'entity')
            return;

        editor.call('entities:delete', editor.call('selector:items'));
    });
    controls.append(btnDelete);

    const tooltipDelete = Tooltip.attach({
        target: btnDelete.element,
        text: 'Delete Entity',
        align: 'top',
        root: root
    });
    tooltipDelete.class.add('innactive');


    editor.on('attributes:clear', function () {
        btnDuplicate.disabled = true;
        btnDelete.disabled = true;
        tooltipDelete.class.add('innactive');
        tooltipDuplicate.class.add('innactive');
    });

    editor.on('attributes:inspect[*]', function (type, items) {
        const root = editor.call('entities:root');

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
