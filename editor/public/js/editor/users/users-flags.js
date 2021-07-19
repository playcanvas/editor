editor.once("load", function () {
    'use strict';

    const WHITELISTED_FOR_EVERYONE = {
        hasRecompressFlippedTextures: true
    };

    const NO_EXCEPTION_FOR_SUPERUSERS = {
        hasRecompressFlippedTextures: true
    };

    editor.method('users:hasOpenedEditor', function () {
        return (config.self && config.self.flags.openedEditor);
    });

    editor.method('users:isSuperUser', function () {
        return (config.self && config.self.flags.superUser);
    });

    editor.method('users:hasFlag', function (flag) {
        if (WHITELISTED_FOR_EVERYONE[flag]) {
            return true;
        }

        if (config.self) {
            if (config.self.flags[flag]) {
                return true;
            }

            if (config.self.flags.superUser && !NO_EXCEPTION_FOR_SUPERUSERS[flag]) {
                return true;
            }
        }

        return false;
    });
});
