editor.once('load', function () {
    'use strict';

    if (editor.call('users:hasFlag', 'hasPcuiAssetsPanel')) return;

    var assetsPanel = editor.call('layout.assets');

    var btnStore = new ui.Button({
        text: "Library"
    });
    btnStore.class.add('store');
    assetsPanel.header.append(btnStore);

    btnStore.on('click', function () {
        window.open('https://store.playcanvas.com/', '_blank');
    });
});
