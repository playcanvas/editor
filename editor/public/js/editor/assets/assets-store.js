editor.once('load', function () {
    'use strict';

    var assetsPanel = editor.call('layout.assets');

    var btnStore = new ui.Button({
        text: "Library"
    });
    btnStore.class.add('store');
    assetsPanel.headerAppend(btnStore);

    btnStore.on('click', function () {
        window.open('https://store.playcanvas.com/', '_blank');
    });


});