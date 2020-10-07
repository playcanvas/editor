Object.assign(pcui, (function () {
    'use strict';

    const Button = pcuiExternal.Button;

    utils.implements(Button, pcui.IFocusable);

    pcui.Element.register('button', Button);

    return {
        Button: Button
    };
})());
