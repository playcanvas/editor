editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:project');

    // Launch primary build
    var item = menu.createItem('launch-build', {
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
