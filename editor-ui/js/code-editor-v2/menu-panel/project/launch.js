editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:project');

    // Launch primary build
    const item = menu.createItem('launch-build', {
        title: 'Launch Primary Build',
        filter: function () {
            return !!config.project.primaryApp;
        },
        select: function () {
            return editor.call('editor:command:launchBuild');
        }
    });
    menu.append(item);

    editor.method('editor:command:launchBuild', function () {
        window.open(config.project.playUrl);
    });
});
