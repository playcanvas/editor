editor.once('load', function () {
    var projectSettings = editor.call('settings:project');

    var folded = true;

    editor.on('attributes:inspect[editorSettings]', function () {
        if (projectSettings.has('useLegacyAudio')) {

            var panelAudio = editor.call('attributes:addPanel', {
                name: 'Audio'
            });
            panelAudio.foldable = true;
            panelAudio.folded = folded;
            panelAudio.on('fold', function () { folded = true; });
            panelAudio.on('unfold', function () { folded = false; });
            panelAudio.class.add('component', 'audio');

            var fieldLegacyAudio = editor.call('attributes:addField', {
                parent: panelAudio,
                name: 'Use Legacy Audio',
                type: 'checkbox',
                link: projectSettings,
                path: 'useLegacyAudio'
            });
            fieldLegacyAudio.parent.innerElement.firstChild.style.width = 'auto';
            editor.call('attributes:reference:attach', 'settings:project:useLegacyAudio', fieldLegacyAudio.parent.innerElement.firstChild.ui);
        }
    });
});
