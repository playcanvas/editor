editor.once('load', function() {
    'use strict';

    var assetsPanel = editor.call('layout.assets');

    // context menu
    var menu = new ui.Menu();
    editor.call('layout.root').append(menu);

    // material
    var menuMaterial = new ui.MenuItem({
        text: 'New Material',
        value: 'material'
    });
    menuMaterial.on('select', function() {
        editor.call('assets:createMaterial');
    });
    menu.append(menuMaterial);

    // cubemap
    var menuCubemap = new ui.MenuItem({
        text: 'New CubeMap',
        value: 'cubemap'
    });
    menuCubemap.on('select', function() {
        editor.call('assets:createCubemap');
    });
    menu.append(menuCubemap);


    // add button
    var btnNew = new ui.Button();
    btnNew.class.add('create-asset');
    btnNew.text = '&#58468;';
    btnNew.on('click', function(evt) {
        var rect = btnNew.element.getBoundingClientRect();
        menu.position(rect.right, rect.top);
        menu.open = true;
    });
    assetsPanel.headerAppend(btnNew);
});
