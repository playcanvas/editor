editor.once('load', function () {
    'use strict';

    // append the basis module controls to the provided panel
    editor.method('attributes:appendImportModule', function (panel, moduleStoreName, wasmFilename) {
        // button
        var button = new pcui.Button({
            text: 'IMPORT BASIS',
            icon: 'E228'
        });
        button.on('click', function () {
            editor.call('project:module:addModule', moduleStoreName, wasmFilename);
        });

        // group
        var group = new pcui.LabelGroup({
            field: button,
            text: 'Basis Library'
        });
        group.style.margin = '3px';
        group.label.style.width = '27%';
        group.label.style.fontSize = '12px';
        panel.append(group);

        // reference
        editor.call('attributes:reference:attach', 'settings:basis', group.label);

        // enable state is based on write permissions and state of legacy physics
        function updateEnableState() {
            group.enabled = editor.call('permissions:write');
        }

        const events = [];

        events.push(editor.on('permissions:writeState', function (write) {
            updateEnableState();
        }));
        events.push(editor.on('onModuleImported', function (name) {
            if (name === 'basis.js') {
                group.enabled = false;
            }
        }));
        updateEnableState();

        group.once('destroy', () => {
            events.forEach(evt => evt.unbind());
            events.length = 0;
        });

        return group;
    });
});
