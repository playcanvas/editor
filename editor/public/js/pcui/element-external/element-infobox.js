Object.assign(pcui, (function () {
    'use strict';

    const InfoBox = pcuiExternal.InfoBox;

    pcui.Element.register('infobox', InfoBox);

    return {
        InfoBox: InfoBox
    };
})());
