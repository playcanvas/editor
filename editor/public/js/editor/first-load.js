(function() {
    // first load
    document.addEventListener('DOMContentLoaded', function() {
        editor.call('status:text', 'loading');
        editor.emit('load');
        editor.call('status:text', 'starting');
        editor.emit('start');

        editor.call('status:text', 'ready');
    }, false);
})();
