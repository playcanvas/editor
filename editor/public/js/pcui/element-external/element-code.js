Object.assign(pcui, (function () {
    'use strict';

    const Code = pcuiExternal.Code;

    pcui.Element.register('code', Code);

    return {
        Code: Code
    };
})());
