editor.once('load', function () {
    'use strict';

    editor.method('scripts:parse', function (asset, fn) {
        editor.call('scripts:handleParse', asset, false, fn);
    });
});
