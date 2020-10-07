Object.assign(pcui, (function () {
    'use strict';

    const TextAreaInput = pcuiExternal.TextAreaInput;

    pcui.Element.register('text', TextAreaInput, { renderChanges: true });

    return {
        TextAreaInput: TextAreaInput
    };
})());
