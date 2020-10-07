Object.assign(pcui, (function () {
    'use strict';

    const Panel = pcuiExternal.Panel;

    utils.implements(Panel, pcui.ICollapsible);

    pcui.Element.register('panel', Panel);

    return {
        Panel: Panel
    };
})());
