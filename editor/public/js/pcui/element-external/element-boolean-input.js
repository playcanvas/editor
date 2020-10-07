Object.assign(pcui, (function () {
    'use strict';

    var BooleanInput = pcuiExternal.BooleanInput;

    utils.implements(BooleanInput, pcui.IBindable);
    utils.implements(BooleanInput, pcui.IFocusable);

    pcui.Element.register('boolean', BooleanInput, { renderChanges: true });

    return {
        BooleanInput: BooleanInput
    };
})());
