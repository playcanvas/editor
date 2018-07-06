editor.once("load", function () {
    'use strict';

    editor.method('users:hasOpenedEditor', function () {
        return (config.self && config.self.flags.openedEditor);
    });

    editor.method('users:isSuperUser', function () {
        return (config.self && config.self.flags.superUser);
    });

    editor.method('users:hasFlag', function (flag) {
        return (config.self && config.self.flags[flag] || config.self.flags.superUser);
    });
});
