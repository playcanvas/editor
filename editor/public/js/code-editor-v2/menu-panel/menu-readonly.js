editor.once('load', function () {
    var panel = editor.call('layout.top');

    // readonly label on the top right
    var readonly = new ui.Label({
        text: 'READ ONLY'
    });

    readonly.class.add('readonly');

    panel.append(readonly);

    readonly.hidden = editor.call('permissions:write');

    editor.on('editor:readonly:change', function (isReadonly) {
        readonly.hidden = ! isReadonly;
    });
});
