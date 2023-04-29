import { Ajax } from '../../common/ajax.js';

editor.once('load', function () {
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
            log.error(err + data);
            editor.call('status:error', 'Couldn\'t update the name: ' + data);
        });
    };

    editor.method('assets:rename', function (asset, newName) {
        var oldName = asset.get('name');
        var id = asset.get('id');
        editor.call('history:add', {
            name: 'asset rename',
            undo: function () {
                if (editor.call('assets:get', id)) {
                    changeName(id, oldName);
                }
            },
            redo: function () {
                if (editor.call('assets:get', id)) {
                    changeName(id, newName);
                }
            }
        });

        changeName(id, newName);
    });
});
