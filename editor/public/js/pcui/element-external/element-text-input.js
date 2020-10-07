Object.assign(pcui, (function () {
    'use strict';

    const TextInput = pcuiExternal.TextInput;

    utils.implements(TextInput, pcui.IBindable);
    utils.implements(TextInput, pcui.IFocusable);

    pcui.Element.register('string', TextInput, { renderChanges: true });

    return {
        TextInput: TextInput
    };
})());
