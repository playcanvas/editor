editor.once('load', () => {
    // method if the module is included in the project
    editor.method('project:module:hasModule', (wasmFilename: string) => {
        const moduleAssets = editor.call('assets:find', (item: import('@playcanvas/observer').Observer) => {
            const name = item.get('name');
            const type = item.get('type');
            return name && name.indexOf(wasmFilename) >= 0 && (type === 'script' || type === 'wasm');
        });
        return moduleAssets.length > 0;
    });

    // add module to the project
    editor.method('project:module:addModule', (moduleStoreName: string, wasmFilename: string) => {
        function addModuleToProject() {
            editor.api.globals.rest.store.storeList({ search: moduleStoreName })
            .on('load', (_status: number, data: { result: { id: string }[] }) => {
                if (data.result && data.result.length === 1) {
                    editor.api.globals.rest.store.storeClone(data.result[0].id, { scope: { type: 'project', id: config.project.id } })
                    .on('load', (_status: number, _data: unknown) => {
                        editor.call('status:text', 'Module successfully imported');
                        editor.emit('onModuleImported', moduleStoreName);
                    }).on('error', (_err: unknown) => {
                        editor.call('status:error', `Failed to import module ${moduleStoreName}`);
                    });
                } else {
                    editor.call('status:error', `Failed to find module ${moduleStoreName}`);
                }
            }).on('error', (_err: unknown) => {
                editor.call('status:error', `Failed to import module ${moduleStoreName}`);
            });
        }

        // show popup if we think there already exists basis in the scene
        if (editor.call('project:module:hasModule', wasmFilename)) {
            editor.call('picker:confirm',
                'It appears your assets panel already contains this module. Continuing may result in duplicates. Do you want to continue?',
                () => {
                    addModuleToProject();
                },
                {
                    yesText: 'Yes',
                    noText: 'Cancel'
                });
        } else {
            addModuleToProject();
        }
    });

});
