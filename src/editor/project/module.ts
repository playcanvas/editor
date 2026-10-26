import type { Observer } from '@playcanvas/observer';

import { supports, service } from '@/common/supports';

editor.once('load', () => {
    // method if the module is included in the project
    editor.method('project:module:hasModule', (wasmFilename: string) => {
        // module files are named <module>.js, <module>.wasm.js and <module>.wasm.wasm, so match the
        // prefix rather than any name containing it (e.g. a user's ammoHelper.js)
        const prefix = `${wasmFilename.toLowerCase()}.`;
        const moduleAssets = editor.call('assets:find', (item: Observer) => {
            const name = item.get('name');
            const type = item.get('type');
            return name && name.toLowerCase().startsWith(prefix) && (type === 'script' || type === 'wasm');
        });
        return moduleAssets.length > 0;
    });

    // add module to the project
    editor.method('project:module:addModule', (moduleStoreName: string, wasmFilename: string) => {
        // modules and engine assets are imported from the store
        if (!supports('storeCatalog') || !supports('storeImport')) {
            return;
        }

        function addModuleToProject() {
            service('storeCatalog')
                .storeList({ search: moduleStoreName })
                .on('load', (_status: number, data: { result: { id: string }[] }) => {
                    if (data.result && data.result.length === 1) {
                        service('storeImport')
                            .storeClone(data.result[0].id, {
                                scope: { type: 'project', id: config.project.id }
                            })
                            .on('load', (_status: number, _data: unknown) => {
                                editor.call('status:text', 'Module successfully imported');
                                editor.emit('onModuleImported', moduleStoreName);
                            })
                            .on('error', (_err: unknown) => {
                                editor.call('status:error', `Failed to import module ${moduleStoreName}`);
                            });
                    } else {
                        editor.call('status:error', `Failed to find module ${moduleStoreName}`);
                    }
                })
                .on('error', (_err: unknown) => {
                    editor.call('status:error', `Failed to import module ${moduleStoreName}`);
                });
        }

        // show popup if we think there already exists basis in the scene
        if (editor.call('project:module:hasModule', wasmFilename)) {
            editor.call(
                'picker:confirm',
                'It appears your assets panel already contains this module. Continuing may result in duplicates. Do you want to continue?',
                () => {
                    addModuleToProject();
                },
                {
                    yesText: 'Yes',
                    noText: 'Cancel'
                }
            );
        } else {
            addModuleToProject();
        }
    });
});
