import { MenuItem } from '@playcanvas/pcui';

editor.once('load', () => {
    const menu = editor.call('menu:project');

    // Launch primary build
    const item = new MenuItem({
        text: 'Launch Primary Build',
        onIsEnabled: () => {
            return !!config.project.primaryApp;
        },
        onSelect: () => {
            return editor.call('editor:command:launchBuild');
        }
    });
    menu.append(item);

    editor.method('editor:command:launchBuild', () => {
        window.open(config.project.playUrl);
    });
});
