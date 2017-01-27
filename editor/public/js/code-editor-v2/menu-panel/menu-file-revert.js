editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:file');

    // create menu item
    menu.append(menu.createItem('revert', {
        title: 'Revert File',
        filter: function () {
            return editor.call('editor:command:can:revert');
        },
        select: function () {
            return editor.call('editor:command:revert');
        }
    }));


    // True if you can revert
    editor.method('editor:command:can:revert', function () {
        if (editor.call('editor:command:can:save')) {
            var focused = editor.call('documents:getFocused');
            if (editor.call('assets:get', focused) && editor.call('views:get', focused)) {
                return true;
            }
        }

        return false;
    });

    // Load asset file and set document content to be the same
    // as the asset file - then save
    editor.method('editor:command:revert', function () {
        if (! editor.call('editor:command:can:revert')) return;

        var focused = editor.call('documents:getFocused');
        var asset = editor.call('assets:get', focused);
        if (! asset) return;

        editor.call('assets:loadFile', asset, function (err, content) {
            if (err) {
                return editor.call('status:error', 'Could not revert "' + asset.get('name') + '". Try again later.');
            }

            var view = editor.call('views:get', focused);
            if (! view) return;

            // force concatenation of ops so that
            // otherwise the user will have to undo 2 times to get to the previous result
            editor.call('views:setValue', focused, content, true);

            // save result
            editor.call('editor:command:save');
        });
    });

});