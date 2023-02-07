editor.once('load', function () {
    const root = editor.call('layout.root');
    const panel = editor.call('layout.hierarchy');

    const menuEntities = new pcui.Menu({
        items: editor.call('menu:entities:new')
    });
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
        controls.hidden = !state;
    });

    panel.header.append(controls);

    // controls add
    const btnAdd = new pcui.Button({
        icon: 'E287'
    });
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
    const btnDuplicate = new pcui.Button({
        icon: 'E288'
    });
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

    // controls delete
    const btnDelete = new pcui.Button({
        icon: 'E289'
    });
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

    const onEntitySelected = (enabled) => {
        const op = enabled ? 'remove' : 'add';
        btnDelete.enabled = enabled;
        btnDuplicate.enabled = enabled;
        tooltipDelete.class[op]('innactive');
        tooltipDuplicate.class[op]('innactive');
    };

    editor.on('attributes:clear', function () {
        onEntitySelected(false);
    });

    editor.on('attributes:inspect[*]', function (type, items) {
        const root = editor.call('entities:root');
        const entitySelected = type === 'entity' && items[0] !== root;
        onEntitySelected(entitySelected);
    });
});
