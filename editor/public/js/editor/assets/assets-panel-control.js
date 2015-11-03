editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var assetsPanel = editor.call('layout.assets');

    // context menu
    var menu = new ui.Menu();
    root.append(menu);

    var assets = {
        'upload': {
            title: 'Upload',
            icon: '&#57909;'
        },
        'folder': {
            title: 'Folder',
            icon: '&#57657;'
        },
        'css': {
            title: 'CSS',
            icon: '&#57864;'
        },
        'cubemap': {
            title: 'CubeMap',
            icon: '&#57879;'
        },
        'html': {
            title: 'HTML',
            icon: '&#57864;'
        },
        'json': {
            title: 'JSON',
            icon: '&#57864;'
        },
        'material': {
            title: 'Material',
            icon: '&#57749;'
        },
        'script': {
            title: 'Script',
            icon: '&#57864;'
        },
        'shader': {
            title: 'Shader',
            icon: '&#57864;'
        },
        'text': {
            title: 'Text',
            icon: '&#57864;'
        }
    };

    var addNewMenuItem = function(key, data) {
        // new folder
        var item = new ui.MenuItem({
            text: data.title,
            icon: data.icon || '',
            value: key
        });
        item.on('select', function() {
            var args = {
                parent: editor.call('assets:panel:currentFolder')
            };

            if (key === 'upload') {
                editor.call('assets:upload:picker', args);
            } else if (key === 'script') {
                editor.call('sourcefiles:new');
            } else {
                editor.call('assets:create:' + key, args)
            }
        });
        menu.append(item);

        if (key === 'script') {
            editor.on('repositories:load', function (repositories) {
                if (repositories.get('current') !== 'directory')
                    item.disabled = true;
            });
        }
    };

    var keys = Object.keys(assets);
    for(var i = 0; i < keys.length; i++) {
        if (! assets.hasOwnProperty(keys[i]))
            continue;

        addNewMenuItem(keys[i], assets[keys[i]]);
    }

    // // upload
    // var menuUpload = new ui.MenuItem({
    //     text: 'Upload',
    //     value: 'upload'
    // });
    // menuUpload.on('select', function() {
    //     editor.call('assets:upload:picker');
    // });
    // menu.append(menuUpload);

    // // folder
    // var menuFolder = new ui.MenuItem({
    //     text: 'New Folder',
    //     value: 'folder'
    // });
    // menuFolder.on('select', function() {
    //     editor.call('assets:create:folder');
    // });
    // menu.append(menuFolder);

    // // css
    // var menuCss = new ui.MenuItem({
    //     text: 'New Css',
    //     value: 'css'
    // });
    // menuCss.on('select', function () {
    //     editor.call('assets:create:css');
    // });
    // menu.append(menuCss);

    // // cubemap
    // var menuCubemap = new ui.MenuItem({
    //     text: 'New CubeMap',
    //     value: 'cubemap'
    // });
    // menuCubemap.on('select', function() {
    //     editor.call('assets:create:cubemap');
    // });
    // menu.append(menuCubemap);

    // // html
    // var menuHtml = new ui.MenuItem({
    //     text: 'New Html',
    //     value: 'html'
    // });
    // menuHtml.on('select', function () {
    //     editor.call('assets:create:html');
    // });
    // menu.append(menuHtml);

    // // json
    // var menuJson = new ui.MenuItem({
    //     text: 'New Json',
    //     value: 'json'
    // });
    // menuJson.on('select', function () {
    //     editor.call('assets:create:json');
    // });
    // menu.append(menuJson);

    // // material
    // var menuMaterial = new ui.MenuItem({
    //     text: 'New Material',
    //     value: 'material'
    // });
    // menuMaterial.on('select', function() {
    //     editor.call('assets:create:material');
    // });
    // menu.append(menuMaterial);

    // // script
    // var menuScript = new ui.MenuItem({
    //     text: 'New Script',
    //     value: 'script'
    // });
    // menuScript.on('select', function () {
    //     editor.call('sourcefiles:new');
    // });
    // menu.append(menuScript);

    // editor.on('repositories:load', function (repositories) {
    //     if (repositories.get('current') !== 'directory')
    //         menuScript.disabled = true;
    // });

    // // shader
    // var menuShader = new ui.MenuItem({
    //     text: 'New Shader',
    //     value: 'shader'
    // });
    // menuShader.on('select', function () {
    //     editor.call('assets:create:shader');
    // });
    // menu.append(menuShader);

    // // text
    // var menuText = new ui.MenuItem({
    //     text: 'New Text',
    //     value: 'text'
    // });
    // menuText.on('select', function () {
    //     editor.call('assets:create:text');
    // });
    // menu.append(menuText);

    // controls
    var controls = new ui.Panel();
    controls.enabled = false;
    controls.class.add('assets-controls');
    controls.parent = assetsPanel;
    assetsPanel.headerElement.insertBefore(controls.element, assetsPanel.headerElementTitle.nextSibling);
    editor.on('permissions:writeState', function(state) {
        controls.enabled = state;
    });


    // add
    var btnNew = new ui.Button();
    btnNew.class.add('create-asset');
    btnNew.text = '&#57632;';
    btnNew.on('click', function(evt) {
        var rect = btnNew.element.getBoundingClientRect();
        menu.position(rect.right, rect.top);
        menu.open = true;
    });
    controls.append(btnNew);

    var tooltipAdd = Tooltip.attach({
        target: btnNew.element,
        text: 'Add Asset',
        align: 'bottom',
        root: root
    });
    menu.on('open', function(state) {
        tooltipAdd.disabled = state;
    });

    // delete
    var btnDelete = new ui.Button({
        text: '&#57636;'
    });
    btnDelete.style.fontWeight = 200;
    btnDelete.disabled = true;
    btnDelete.class.add('delete');
    btnDelete.on('click', function() {
        if (! editor.call('permissions:write'))
            return;

        var type = editor.call('selector:type');
        if (type !== 'asset')
            return;

        editor.call('assets:delete:picker', editor.call('selector:items'));
    });
    controls.append(btnDelete);

    var tooltipDelete = Tooltip.attach({
        target: btnDelete.element,
        text: 'Delete Asset',
        align: 'bottom',
        root: root
    });
    tooltipDelete.class.add('innactive');


    editor.on('attributes:clear', function() {
        // btnDuplicate.disabled = true;
        btnDelete.disabled = true;
        tooltipDelete.class.add('innactive');
    });

    editor.on('attributes:inspect[*]', function(type) {
        if (type.startsWith('asset')) {
            btnDelete.enabled = true;
            tooltipDelete.class.remove('innactive');
        } else {
            btnDelete.enabled = false;
            tooltipDelete.class.add('innactive');
        }
        // btnDuplicate.enabled = type === 'asset.material';
    });
});
