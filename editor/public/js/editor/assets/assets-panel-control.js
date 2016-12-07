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
                if (editor.call('project:settings').get('use_legacy_scripts')) {
                    editor.call('sourcefiles:new');
                } else {
                    editor.call('picker:script-create', function(filename) {
                        editor.call('assets:create:script', {
                            filename: filename,
                            boilerplate: true
                        });
                    });
                }
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
    btnNew.hidden = ! editor.call('permissions:write');
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
    btnDelete.hidden = ! editor.call('permissions:write');
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


    editor.on('permissions:writeState', function(state) {
        btnNew.hidden = ! state;
        btnDelete.hidden = ! state;
    });


    // fodler up
    var btnUp = new ui.Button({
        text: '&#58117;'
    });
    btnUp.style.fontWeight = 200;
    btnUp.disabled = true;
    btnUp.class.add('up');
    btnUp.on('click', function() {
        var folder = editor.call('assets:panel:currentFolder');
        if (! folder) return;

        if (folder === 'scripts') {
            editor.call('assets:panel:currentFolder', null);
        } else {
            var path = folder.get('path');
            if (path.length) {
                var parent = editor.call('assets:get', path[path.length - 1]);
                if (parent) {
                    editor.call('assets:panel:currentFolder', parent);
                } else {
                    editor.call('assets:panel:currentFolder', null);
                }
            } else {
                editor.call('assets:panel:currentFolder', null);
            }
        }
    });
    controls.append(btnUp);

    editor.on('assets:panel:currentFolder', function(folder) {
        if (folder) {
            btnUp.disabled = false;
            tooltipUp.class.remove('innactive');
        } else {
            btnUp.disabled = true;
            tooltipUp.class.add('innactive');
        }
    });

    var tooltipUp = Tooltip.attach({
        target: btnUp.element,
        text: 'Folder Up',
        align: 'bottom',
        root: root
    });
    tooltipUp.class.add('innactive');


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
