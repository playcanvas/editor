import { MenuItem } from '@playcanvas/pcui';

import { THEMES } from '@/core/constants';

editor.once('load', () => {
    const menu = editor.call('menu:edit');
    const settings = editor.call('editor:settings');

    const themeGroup = new MenuItem({
        text: 'Theme',
        hasChildren: true
    });
    menu.append(themeGroup);

    for (const key of Object.keys(THEMES)) {
        const themeItem = new MenuItem({
            text: THEMES[key],
            onSelect: () => {
                settings.set('ide.theme', key);
            }
        });
        themeGroup.append(themeItem);
    }
});
