editor.once('load', function () {
    var panel = editor.call('layout.top');

    // readonly label on the top right
    var readonly = new ui.Label({
        text: 'READ ONLY'
    });

    readonly.class.add('readonly');

    panel.append(readonly);

    readonly.hidden = ! editor.call('editor:isReadOnly');

    editor.on('permissions:writeState', function () {
        readonly.hidden = ! editor.call('editor:isReadOnly');
    });
});