import { Menu, Container, Button } from '@playcanvas/pcui';

import { LegacyTooltip } from '@/common/ui/tooltip';

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
        alignItems: 'center'
    });

    panel.header.append(controls);

    const writePermission = editor.call('permissions:write');

    // controls add
    const btnAdd = new Button({
        icon: 'E287',
        hidden: !writePermission
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
        icon: 'E288',
        hidden: !writePermission
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
        icon: 'E289',
        hidden: !writePermission
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

    editor.on('permissions:writeState', (canWrite: boolean) => {
        btnAdd.hidden = !canWrite;
        btnDuplicate.hidden = !canWrite;
        btnDelete.hidden = !canWrite;
    });

    // controls more options
    const btnMore = new Button({
        icon: 'E235'
    });
    controls.append(btnMore);

    LegacyTooltip.attach({
        target: btnMore.element,
        text: 'More Options',
        align: 'top',
        root: root
    });

    const treeView = editor.call('entities:hierarchy');
    const menuMore = new Menu({
        items: [{
            text: 'Expand All',
            icon: 'E386',
            onSelect: () => {
                treeView.expandAll();
            }
        }, {
            text: 'Collapse All',
            icon: 'E385',
            onSelect: () => {
                treeView.collapseAll();
            }
        }, {
            text: 'Show All',
            icon: 'E117',
            onSelect: () => {
                const hidden: string[] = editor.call('entities:visibility:getHidden');
                if (hidden.length) {
                    editor.call('entities:visibility:set', hidden, false);
                }
            },
            onIsEnabled: () => {
                return editor.call('entities:visibility:getHidden').length > 0;
            }
        }]
    });
    root.append(menuMore);

    btnMore.on('click', () => {
        const btnRect = btnMore.dom.getBoundingClientRect();
        menuMore.hidden = false;
        const menuRect = menuMore.dom.querySelector('.pcui-menu-items').getBoundingClientRect();
        menuMore.position(btnRect.right - menuRect.width, btnRect.bottom);
    });

    const onEntitySelected = (enabled) => {
        const op = enabled ? 'remove' : 'add';
        btnDelete.enabled = enabled;
        btnDuplicate.enabled = enabled;
        tooltipDelete.class[op]('inactive');
        tooltipDuplicate.class[op]('inactive');
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
