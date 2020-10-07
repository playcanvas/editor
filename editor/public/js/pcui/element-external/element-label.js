Object.assign(pcui, (function () {
    'use strict';

    const Label = pcuiExternal.Label;

    utils.implements(Label, pcui.IBindable);

    pcui.Element.register('label', Label);

    return {
        Label: Label
    };
})());
