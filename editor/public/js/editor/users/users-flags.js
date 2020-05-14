editor.once("load", function () {
    'use strict';

    const WHITELISTED_FOR_EVERYONE = {
        'hasPcuiAssetsPanel': true
    };

    editor.method('users:hasOpenedEditor', function () {
        return (config.self && config.self.flags.openedEditor);
    });

    editor.method('users:isSuperUser', function () {
        return (config.self && config.self.flags.superUser);
    });

    editor.method('users:hasFlag', function (flag) {
        if (WHITELISTED_FOR_EVERYONE[flag]) return true;

        return (config.self && config.self.flags[flag] || config.self.flags.superUser);
    });
});
