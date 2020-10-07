Object.assign(pcui, (function () {
    'use strict';

    const Divider = pcuiExternal.Divider;

    pcui.Element.register('divider', Divider);

    return {
        Divider: Divider
    };
})());
