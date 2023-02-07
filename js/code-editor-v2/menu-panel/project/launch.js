editor.once('load', function () {
    const menu = editor.call('menu:project');

    // Launch primary build
    const item = new pcui.MenuItem({
        text: 'Launch Primary Build',
        onIsEnabled: () => {
            return !!config.project.primaryApp;
        },
        onSelect: () => {
            return editor.call('editor:command:launchBuild');
        }
    });
    menu.append(item);

    editor.method('editor:command:launchBuild', function () {
        window.open(config.project.playUrl);
    });
});
