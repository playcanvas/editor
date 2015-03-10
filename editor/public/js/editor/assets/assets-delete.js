editor.once('load', function() {
    'use strict';

    window.addEventListener('keydown', function(e) {
        if ((e.target && e.target.tagName.toLowerCase() === 'input') || ! editor.call('permissions:write') || e.keyCode !== 46)
            return;

        var type = editor.call('selector:type');

        if (type !== 'asset')
            return;

        var items = editor.call('selector:items');

        for(var i = 0; i < items.length; i++)
            editor.call('assets:delete', items[i]);
    }, false);
});
