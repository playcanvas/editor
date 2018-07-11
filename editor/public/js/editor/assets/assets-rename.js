editor.once('load', function() {
    'use strict';

    var changeName = function (assetId, assetName) {
        var form = new FormData();
        form.append('name', assetName);
        form.append('branchId', config.self.branch.id);
        Ajax({
            url: '{{url.api}}/assets/' + assetId,
            auth: true,
            data: form,
            method: 'PUT',
            ignoreContentType: true,
            notJson: true
        }).on('error', function (err, data) {
            console.error(err + data);
            editor.call('status:error', 'Couldn\'t update the name: ' + data);
        });
    }

    editor.method('assets:rename', function (asset, newName) {
        var oldName = asset.get('name');
        
        editor.call('history:add', {
            name: 'asset rename',
            undo: function() {
                changeName(asset.get('id'), oldName);
            },
            redo: function() {
                changeName(asset.get('id'), newName);
            }
        });

        changeName(asset.get('id'), newName);
    });
});
