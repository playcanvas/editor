Object.assign(pcui, (function () {
    'use strict';

    const ContextMenu = pcuiExternal.ContextMenu;

    pcui.Element.register('contextmenu', ContextMenu);

    return {
        ContextMenu: ContextMenu
    };
})());
