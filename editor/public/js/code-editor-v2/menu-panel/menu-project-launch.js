editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:project');

    // Launch
    var item = menu.createItem('launch-primary', {
        title: 'Launch Primary Scene',
        filter: function () {
            return !!config.project.primaryScene;
        },
        select: function () {
            return editor.call('editor:command:launchPrimary');
        }
    });
    item.class.add('noBorder');
    menu.append(item);

    editor.method('editor:command:launchPrimary', function () {
        window.open('/editor/scene/' + config.project.primaryScene + '/launch');
    });

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