editor.once('load', function () {
    // method if the module is included in the project
    editor.method('project:module:hasModule', function (wasmFilename) {
        var moduleAssets = editor.call('assets:find', function (item) {
            var name = item.get('name');
            var type = item.get('type');
            return name && name.indexOf(wasmFilename) >= 0 && (type === 'script' || type === 'wasm');
        });
        return moduleAssets.length > 0;
    });

    // add module to the project
    editor.method('project:module:addModule', function (moduleStoreName, wasmFilename) {
        function addModuleToProject() {
            Ajax({
                url: '{{url.api}}/store?search=' + moduleStoreName,
                method: 'GET',
                auth: true,
                data: { }
            }).on('load', function (status, data) {
                if (data.result && data.result.length === 1) {
                    Ajax({
                        url: '{{url.api}}/store/' + data.result[0].id.toString() + '/clone',
                        method: 'POST',
                        auth: true,
                        data: { scope: { type: 'project', id: config.project.id } },
                        notJson: true       // server response is empty
                    }).on('load', function (status, data) {
                        editor.call('status:text', 'Module successfully imported');
                        editor.emit('onModuleImported', moduleStoreName);
                    }).on('error', function (err) {
                        editor.call('status:error', 'Failed to import module ' + moduleStoreName);
                    });
                }
            }).on('error', function (err) {
                editor.call('status:error', 'Failed to import module ' + moduleStoreName);
            });
        }

        // show popup if we think there already exists basis in the scene
        if (editor.call('project:module:hasModule', wasmFilename)) {
            editor.call('picker:confirm',
                'It appears your assets panel already contains this module. Continuing may result in duplicates. Do you want to continue?',
                function () { addModuleToProject(); },
                {
                    yesText: 'Yes',
                    noText: 'Cancel'
                });
        } else {
            addModuleToProject();
        }
    });

});
