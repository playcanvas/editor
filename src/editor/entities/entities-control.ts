import { Menu, Container, Button } from '@playcanvas/pcui';

import { LegacyTooltip } from '../../common/ui/tooltip.ts';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const panel = editor.call('layout.hierarchy');

    const menuEntities = new Menu({
        items: editor.call('menu:entities:new')
    });
    root.append(menuEntities);

    // controls
    const controls = new Container({
        class: 'hierarchy-controls',
        flex: true,
        flexDirection: 'row',
        alignItems: 'center',
        hidden: !editor.call('permissions:write')
    });

    editor.on('permissions:writeState', (state) => {
        controls.hidden = !state;
    });

    panel.header.append(controls);

    // controls add
    const btnAdd = new Button({
        icon: 'E287'
    });
    btnAdd.on('click', () => {
        menuEntities.hidden = false;
        const rect = btnAdd.element.getBoundingClientRect();
        menuEntities.position(rect.left, rect.top);
    });
    controls.append(btnAdd);

    LegacyTooltip.attach({
        target: btnAdd.element,
        text: 'Add Entity',
        align: 'top',
        root: root
    });

    // controls duplicate
    const btnDuplicate = new Button({
        icon: 'E288'
    });
    btnDuplicate.on('click', () => {
        const type = editor.call('selector:type');
        const items = editor.call('selector:items');

        if (type === 'entity' && items.length) {
            editor.call('entities:duplicate', items);
        }
    });
    controls.append(btnDuplicate);

    const tooltipDuplicate = LegacyTooltip.attach({
        target: btnDuplicate.element,
        text: 'Duplicate Entity',
        align: 'top',
        root: root
    });

    // controls delete
    const btnDelete = new Button({
        icon: 'E289'
    });
    btnDelete.on('click', () => {
        const type = editor.call('selector:type');

        if (type !== 'entity') {
            return;
        }

        editor.call('entities:delete', editor.call('selector:items'));
    });
    controls.append(btnDelete);

    const tooltipDelete = LegacyTooltip.attach({
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

    editor.on('attributes:clear', () => {
        onEntitySelected(false);
    });

    editor.on('attributes:inspect[*]', (type, items) => {
        const root = editor.call('entities:root');
        const entitySelected = type === 'entity' && items[0] !== root;
        onEntitySelected(entitySelected);
    });
});
