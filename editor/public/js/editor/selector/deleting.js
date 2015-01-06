(function() {
    'use strict';

    msg.hook('selector:delete', function() {
        var type = msg.call('selector:type');
        var items = msg.call('selector:items');

        // nothing to delete
        if (! type || ! items.length)
            return;

        // different types
        switch(type) {
            case 'entity':
                items.forEach(function(entity) {
                    msg.call('entities:remove', entity);
                });
                break;
            case 'asset':
                items.forEach(function(asset) {
                    msg.call('assets:remove', asset);
                });
                break;
            default:
                return;
        }
    });

    // bind to DELETE key
    window.addEventListener('keydown', function(evt) {
        if (evt.keyCode === 46) { // DELETE key
            msg.call('selector:delete');
        }
    });
})();
