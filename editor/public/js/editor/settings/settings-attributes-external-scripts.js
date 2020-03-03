editor.once('load', function () {
    'use strict';

    const hasPcuiSettings = editor.call('users:hasFlag', 'hasPcuiSettings');
    if (hasPcuiSettings) {
        return;
    }

    var projectSettings = editor.call('settings:project');
    if (projectSettings.get('useLegacyScripts')) return;

    var folded = true;

    editor.on('attributes:inspect[editorSettings]', function() {
        var panel = editor.call('attributes:addPanel', {
            name: 'External Scripts'
        });
        panel.foldable = true;
        panel.folded = folded;
        panel.on('fold', function () { folded = true; });
        panel.on('unfold', function () { folded = false; });
        panel.class.add('component', 'external-scripts');

        var fieldExternalScripts = editor.call('attributes:addArrayField', {
            panel: panel,
            name: 'URLs',
            type: 'string',
            link: [projectSettings],
            path: 'externalScripts',
            placeholder: 'URL'
        });
        editor.call('attributes:reference:attach', 'settings:project:externalScripts', fieldExternalScripts.parent.innerElement.firstChild.ui);
    });
});
