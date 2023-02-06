editor.once('load', function () {
    editor.on('assets:add', function (asset) {
        if (asset.history)
            return;

        var id = asset.get('id');

        asset.history = new ObserverHistory({
            item: asset,
            prefix: 'asset.' + id + '.',
            history: editor.call('editor:history')
        });
    });
});
