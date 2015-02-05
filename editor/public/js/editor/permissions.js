editor.once('load', function() {
    'use strict';

    var write = false;


    editor.method('permissions:set', function(state) {
        if (write === !! state)
            return;

        write = !! state;

        editor.emit('permissions:write', write);
    });


    editor.method('permissions:write', function() {
        return write;
    });
});
