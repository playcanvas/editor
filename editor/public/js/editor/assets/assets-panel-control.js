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

    // controls
    var controls = new ui.Panel();
    controls.class.add('assets-controls');
    controls.parent = assetsPanel;
    assetsPanel.headerElement.insertBefore(controls.element, assetsPanel.headerElementTitle.nextSibling);


    // add
    var btnNew = new ui.Button();
    btnNew.class.add('create-asset');
    btnNew.text = '&#58468;';
    btnNew.on('click', function(evt) {
        var rect = btnNew.element.getBoundingClientRect();
        menu.position(rect.right, rect.top);
        menu.open = true;
    });
    controls.append(btnNew);

    // // duplicate
    // var btnDuplicate = new ui.Button({
    //     text: '&#57908;'
    // });
    // btnDuplicate.disabled = true;
    // btnDuplicate.class.add('duplicate');
    // btnDuplicate.element.title = 'Duplicate Asset';
    // btnDuplicate.on('click', function() {
    //     // var type = editor.call('selector:type');
    //     // var items = editor.call('selector:items');

    //     // if (type === 'entity' && items.length)
    //     //     editor.call('entities:duplicate', items[0]);
    // });
    // controls.append(btnDuplicate);

    // delete
    var btnDelete = new ui.Button({
        text: '&#58657;'
    });
    btnDelete.disabled = true;
    btnDelete.class.add('delete');
    btnDelete.element.title = 'Delete Asset';
    btnDelete.on('click', function() {
        if (! editor.call('permissions:write'))
            return;

        var type = editor.call('selector:type');
        if (type !== 'asset')
            return;

        var items = editor.call('selector:items');

        editor.call('picker:confirm', 'Delete Asset?', function() {
            for(var i = 0; i < items.length; i++)
                editor.call('assets:delete', items[i]);
        });
    });
    controls.append(btnDelete);


    editor.on('attributes:clear', function() {
        btnDuplicate.disabled = true;
        // btnDelete.disabled = true;
    });

    editor.on('attributes:inspect[*]', function(type) {
        btnDelete.enabled = type.startsWith('asset');
        // btnDuplicate.enabled = type === 'asset.material';
    });
});
