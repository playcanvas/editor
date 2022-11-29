editor.once('load', function () {
    const panel = editor.call('layout.top');

    // readonly label on the top right
    const readonly = new pcui.Label({
        class: 'readonly',
        hidden: editor.call('permissions:write'),
        text: 'READ ONLY'
    });
    panel.append(readonly);

    editor.on('editor:readonly:change', function (isReadonly) {
        readonly.hidden = !isReadonly;
    });
});
