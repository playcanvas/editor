editor.once('load', function () {
    'use strict';

    // method if the Engine Asset is included in the project
    editor.method('project:engineAsset:getEngineAsset', function (assetName) {
        var engineAssets = editor.call('assets:find', function (item) {
            var name = item.get('name');
            var type = item.get('type');
            return name.indexOf(assetName) >= 0 && type === 'binary';
        });
        return engineAssets;
    });

    // add Engine Asset to the project
    editor.method('project:engineAsset:addEngineAsset', function (storeName, assetName) {
        function addAssetToProject() {
            Ajax({
                url: '{{url.api}}/store/items?name=' + storeName,
                method: 'GET',
                auth: true,
                data: { }
            }).on('load', function (status, data) {
                if (data.length === 1) {
                    Ajax({
                        url: '{{url.api}}/store/' + data[0].id.toString() + '/clone',
                        method: 'POST',
                        auth: true,
                        data: { scope: { type: 'project', id: config.project.id } },
                        notJson: true       // server response is empty
                    }).on('load', function (status, data) {
                        editor.call('status:text', 'Engine Asset successfully imported');
                        editor.emit('engineAssetImported', assetName);
                    }).on('error', function (err) {
                        editor.call('status:error', 'Failed to import Engine Asset ' + storeName);
                    });
                }
            }).on('error', function (err) {
                editor.call('status:error', 'Failed to import Engine Asset ' + storeName);
            });
        }

        // show popup if we think there already exists in the scene
        if (editor.call('project:engineAsset:getEngineAsset', assetName).length > 0) {
            editor.call('picker:confirm',
                'It appears your assets panel already contains this engineAsset. Continuing may result in duplicates. Do you want to continue?',
                function () { addAssetToProject(); },
                {
                    yesText: 'Yes',
                    noText: 'Cancel'
                });
        } else {
            addAssetToProject();
        }
    });

});
