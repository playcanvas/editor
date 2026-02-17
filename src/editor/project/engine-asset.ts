editor.once('load', () => {
    // method if the Engine Asset is included in the project
    editor.method('project:engineAsset:getEngineAsset', (assetName: string) => {
        const engineAssets = editor.call('assets:find', (item: import('@playcanvas/observer').Observer) => {
            const name = item.get('name');
            const type = item.get('type');
            return name.indexOf(assetName) >= 0 && type === 'binary';
        });
        return engineAssets;
    });

    // add Engine Asset to the project
    editor.method('project:engineAsset:addEngineAsset', (storeName: string, assetName: string) => {
        function addAssetToProject() {
            editor.api.globals.rest.store.storeList({ search: storeName }).on('load', (_status: number, data: { result: { id: string }[] }) => {
                if (data.result && data.result.length === 1) {
                    editor.api.globals.rest.store.storeClone(data.result[0].id, {
                        scope: {
                            type: 'project', id: config.project.id
                        }
                    }).on('load', (_status: number, _data: unknown) => {
                        editor.call('status:text', 'Engine Asset successfully imported');
                        editor.emit('engineAssetImported', assetName);
                    }).on('error', (_err: unknown) => {
                        editor.call('status:error', `Failed to import Engine Asset ${storeName}`);
                    });
                }
            }).on('error', (_err: unknown) => {
                editor.call('status:error', `Failed to import Engine Asset ${storeName}`);
            });
        }

        // show popup if we think there already exists in the scene
        if (editor.call('project:engineAsset:getEngineAsset', assetName).length > 0) {
            editor.call('picker:confirm',
                'It appears your assets panel already contains this engineAsset. Continuing may result in duplicates. Do you want to continue?',
                () => {
                    addAssetToProject();
                },
                {
                    yesText: 'Yes',
                    noText: 'Cancel'
                });
        } else {
            addAssetToProject();
        }
    });

});
