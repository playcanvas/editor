Object.assign(pcui, (function () {
    'use strict';

    const SliderInput = pcuiExternal.SliderInput;

    utils.proxy(SliderInput, '_numericInput', SliderInput.PROXY_FIELDS);
    utils.implements(SliderInput, pcui.IBindable);
    utils.implements(SliderInput, pcui.IFocusable);

    pcui.Element.register('slider', SliderInput, { renderChanges: true });

    return {
        SliderInput: SliderInput
    };
})());
