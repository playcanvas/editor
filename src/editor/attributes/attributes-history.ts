import { Button, Container } from '@playcanvas/pcui';

import { LegacyTooltip } from '../../common/ui/tooltip.ts';

editor.once('load', () => {
    let list = [];
    let selecting = false;

    const getLast = () => {
        if (!list.length) {
            return;
        }

        const ignoreType = editor.call('selector:type');
        const ignore = editor.call('selector:items');

        let i = list.length - 1;
        let candidate = list[i];

        if (ignoreType) {
            while (candidate && candidate.type === ignoreType && candidate.items.equals(ignore)) {
                candidate = list[--i];
            }
        }

        return candidate || null;
    };

    const selectorReturn = () => {
        const item = getLast();
        if (!item) {
            return;
        }

        // remove last one
        list = list.slice(0, list.length - 1);

        selecting = true;
        editor.call('selector:set', item.type, item.items);
        editor.once('selector:change', () => {
            selecting = false;

            updateTooltipContent();
        });
    };
    editor.method('selector:return', selectorReturn);

    const root = editor.call('layout.root');
    const panel = editor.call('layout.attributes');

    const controls = new Container({
        class: 'inspector-controls'
    });
    panel.header.append(controls);

    const btnBack = new Button({
        class: 'back',
        hidden: true,
        icon: 'E131' // play icon rotated 180 in CSS
    });
    btnBack.on('click', selectorReturn);
    controls.append(btnBack);

    editor.on('selector:change', (type, items) => {
        if (selecting) {
            return;
        }

        updateTooltipContent();

        if (!type || !items) {
            return;
        }

        const last = getLast();

        if (last && last.items.length === 1 && items.length === 1 && last.items[0] === items[0]) {
            return;
        }

        list.push({
            type: type,
            items: items
        });
    });

    editor.method('selector:previous', getLast);

    const setTooltipText = (str) => {
        tooltip.html = `<span>Previous Selection</span><br>${str}`;
    };

    const updateTooltipContent = () => {
        const item = getLast();

        if (!item && !btnBack.hidden) {
            btnBack.hidden = true;
        } else if (item && btnBack.hidden) {
            btnBack.hidden = false;
        }

        if (item && !tooltip.hidden) {
            if (item.type === 'entity') {
                if (item.items.length === 1) {
                    const name = item.items[0].get('name');
                    setTooltipText(`${name} [entity]`);
                } else {
                    setTooltipText(`[${item.items.length} entities]`);
                }
            } else if (item.type === 'asset') {
                if (item.items.length === 1) {
                    const name = item.items[0].get('name');
                    const type = item.items[0].get('type');
                    setTooltipText(`${name} [${type}]`);
                } else {
                    setTooltipText(`[${item.items.length} assets]`);
                }
            } else if (item.type === 'editorSettings') {
                setTooltipText('Settings');
            }
        }
    };

    const tooltip = LegacyTooltip.attach({
        target: btnBack.element,
        text: '-',
        align: 'top',
        root: root
    });
    tooltip.on('show', updateTooltipContent);
    tooltip.class.add('previous-selection');

    btnBack.on('hide', () => {
        tooltip.hidden = true;
    });

    editor.call('hotkey:register', 'selector:return', {
        key: 'KeyZ',
        shift: true,
        callback: () => {
            if (editor.call('picker:isOpen:otherThan', 'curve')) {
                return;
            }
            selectorReturn();
        }
    });
});
