editor.once('load', function() {
    'use strict';

    // overlay
    var overlay = new ui.Overlay();
    overlay.class.add('picker-scene');
    overlay.hidden = true;

    // picker panel
    var panel = document.createElement('div');
    panel.classList.add('picker-scene-panel');
    overlay.append(panel);

    // header
    var header = document.createElement('div');
    header.classList.add('picker-scene-header');
    panel.appendChild(header);

    // icon
    var icon = document.createElement('span');
    icon.classList.add('picker-scene-icon', 'font-icon');
    header.appendChild(icon);

    // title
    var title = document.createElement('span');
    title.innerHTML = 'Scenes';
    title.classList.add('picker-scene-title');
    header.appendChild(title);

    // close button
    var close = document.createElement('span');
    close.classList.add('picker-scene-close', 'font-icon');
    close.addEventListener('click', function () {
        editor.call('picker:scene:close');
    });
    header.appendChild(close);

    var content = document.createElement('div');
    content.classList.add('picker-scene-content');
    panel.appendChild(content);

    var container = document.createElement('ul');
    content.appendChild(container);

    // dropdown menu for each scene
    var dropdownMenu = ui.Menu.fromData({
        'scene-duplicate': {
            title: 'Duplicate Scene',
            filter: function () {
                return editor.call('permissions:write');
            },
            select: function () {
                editor.call('scenes:duplicate', dropdownScene.id);
            }
        },
        'scene-delete': {
            title: 'Delete Scene',
            filter: function () {
                return editor.call('permissions:write');
            },
            select: function () {
                var ok = confirm('Are you sure you want to delete this Scene?');
                if (!ok) return;

                editor.call('scenes:delete', dropdownScene.id);
            }
        }
    });

    var dropdownScene = null;
    var dropdowns = {};
    var scenes = [];

    // when the menu closes remove the 'clicked' class from dropdowns
    dropdownMenu.on('open', function (open) {
        if (open) return;

        for (var id in dropdowns) {
            dropdowns[id].classList.remove('clicked');
        }
    });

    // footer
    var footer = document.createElement('div');
    footer.classList.add('picker-scene-footer');
    panel.appendChild(footer);

    // new scene button
    var newScene = document.createElement('div');
    newScene.classList.add('picker-scene-new');
    if (!editor.call('permissions:write'))
        newScene.classList.add('disabled');

    var newSceneLeft = document.createElement('span');
    newSceneLeft.innerHTML = 'NEW';
    newSceneLeft.classList.add('left');
    newScene.appendChild(newSceneLeft);

    var newSceneRight = document.createElement('span');
    newSceneRight.classList.add('right');
    newSceneRight.innerHTML = '&#58468;';
    newScene.appendChild(newSceneRight);

    footer.appendChild(newScene);

    newScene.addEventListener('click', function () {
        if (! editor.call('permissions:write'))
            return;

        editor.call('scenes:new', function (scene) {
            editor.call('scene:load', scene.id, true);
            editor.call('picker:scene:close');
        });
    });


    // add to root
    var root = editor.call('layout.root');
    root.append(overlay);
    root.append(dropdownMenu);

    // on overlay show
    overlay.on('show', function () {
        editor.emit('picker:scene:open');
    });

    // on overlay hide
    overlay.on('hide', function() {
        container.innerHTML = '';
        dropdowns = {};
        scenes = [];
        editor.emit('picker:scene:close');
    });

    // create row for scene
    var createSceneEntry = function (scene) {
        var row = document.createElement('li');
        row.id = 'picker-scene-' + scene.id;
        if (config.scene.id && parseInt(scene.id, 10) === parseInt(config.scene.id, 10))
            row.classList.add('current');

        if (parseInt(scene.id, 10) === parseInt(config.project.primaryScene, 10))
            row.classList.add('primary');

        // primary scene icon
        var primary = document.createElement('span');
        primary.classList.add('scene-primary');
        primary.innerHTML = '&#57989;';
        row.appendChild(primary);
        primary.addEventListener('click', function () {
            var prevPrimary = config.project.primaryScene;
            editor.call('project:setPrimaryScene', scene.id);
        });

        // show tooltip for primary scene icon
        Tooltip.attach({
            target: primary,
            text: 'Set primary scene',
            align: 'right',
            root: root
        });

        // scene name
        var name = document.createElement('span');
        name.classList.add('scene-name');
        name.innerHTML = scene.name;
        name.addEventListener('click', function () {
            editor.call('picker:scene:close');
            editor.call('scene:load', scene.id);
        });

        row.appendChild(name);

        // scene date
        var date = document.createElement('div');
        date.classList.add('scene-date');
        date.innerHTML = editor.call('datetime:convert', scene.modified);
        row.appendChild(date);

        // dropdown
        var dropdown = document.createElement('span');
        dropdown.classList.add('scene-dropdown');
        row.appendChild(dropdown);
        dropdowns[scene.id] = dropdown;

        var dropdownIcon = document.createElement('div');
        dropdownIcon.classList.add('scene-dropdown-icon', 'font-icon');
        dropdownIcon.innerHTML = '&#57922;';
        dropdown.appendChild(dropdownIcon);

        dropdown.addEventListener('click', function () {
            dropdown.classList.add('clicked');

            dropdownScene = scene;
            dropdownMenu.open = true;
            var rect = dropdown.getBoundingClientRect();
            dropdownMenu.position(rect.right - dropdownMenu.innerElement.clientWidth, rect.bottom);
        });

        return row;
    };

    var sortScenes = function (scenes) {
        scenes.sort(function (a, b) {
            var primary = parseInt(config.project.primaryScene, 10);
            if (primary === parseInt(a.id, 10)) {
                return -1;
            } else if (primary === parseInt(b.id, 10)) {
                return 1;
            } else {
                if (a.modified < b.modified) {
                    return 1;
                } else if (a.modified > b.modified) {
                    return -1;
                } else {
                    return 0;
                }
            }
        });
    };

    // call picker
    editor.method('picker:scene', function() {
        // load scenes
        editor.call('scenes:list', function (items) {
            scenes = items;
            sortScenes(scenes);
            scenes.forEach(function (scene) {
                var row = createSceneEntry(scene);
                container.appendChild(row);
            });
        });

        // show overlay
        overlay.hidden = false;
    });

    // close picker
    editor.method('picker:scene:close', function() {
        overlay.hidden = true;
    });

    // subscribe to messenger pack.delete
    editor.on('messenger:pack.delete', function (data) {
        if (overlay.hidden) return;

        var row = document.getElementById('picker-scene-' + data.pack.id);
        if (row) {
            row.parentElement.removeChild(row);
        }

        delete dropdowns[data.pack.id];

        for (var i = 0; i < scenes.length; i++) {
            if (parseInt(scenes[i].id, 10) === parseInt(data.pack.id, 10)) {
                scenes.splice(i, 1);
                break;
            }
        }
    });


    // subscribe to messenger pack.new
    editor.on('messenger:pack.new', function (data) {
        if (overlay.hidden) return;

        editor.call('scenes:get', data.pack.id, function (scene) {
            if (overlay.hidden) return; // check if hidden when Ajax returns

            scenes.push({
                id: scene.id,
                modified: scene.modified,
                name: scene.name
            });

            sortScenes(scenes);

            var row = createSceneEntry(scene);

            // put the new row at the right place
            for (var i = 0; i < scenes.length; i++) {
                if (parseInt(scenes[i].id, 10) === parseInt(data.pack.id, 10)) {
                    if (i === 0) {
                        container.insertBefore(row, container.firstChild);
                    } else {
                        var next = i == scenes.length - 1 ? null : document.getElementById('picker-scene-' + scenes[i+1].id);
                        container.insertBefore(row, next);
                    }

                    break;
                }
            }
        });
    });

    var onPrimarySceneChanged = function (newValue, oldValue) {
        if (overlay.hidden) return;

        sortScenes(scenes);

        container.innerHTML = '';

        scenes.forEach(function (scene) {
            container.appendChild(createSceneEntry(scene));
        });
    };

    editor.on('project:primaryScene', onPrimarySceneChanged);

    // open picker if no scene is loaded
    if (!config.scene.id)
        editor.call('picker:scene');

});
