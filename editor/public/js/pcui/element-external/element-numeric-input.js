Object.assign(pcui, (function () {
    'use strict';

    const NumericInput = pcuiExternal.NumericInput;

    pcui.Element.register('number', NumericInput, { renderChanges: true });

    return {
        NumericInput: NumericInput
    };
})());
