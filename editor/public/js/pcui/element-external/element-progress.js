Object.assign(pcui, (function () {
    'use strict';

    const Progress = pcuiExternal.Progress;

    pcui.Element.register('progress', Progress);

    return {
        Progress: Progress
    };
})());
