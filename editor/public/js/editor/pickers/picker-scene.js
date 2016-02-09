editor.once('load', function () {
    'use strict';

    var panel = new ui.Panel();
    panel.class.add('picker-scene-panel');

    editor.call('picker:project:registerMenu', 'scenes', 'Scenes', panel);

    // scene should be the default
    editor.call('picker:project:setDefaultMenu', 'scenes');

    if (!editor.call('permissions:write'))
        panel.class.add('disabled');

    // progress bar and loading label
    var loading = new ui.Label({
        text: 'Loading...'
    });
    panel.append(loading);

    var progressBar = new ui.Progress({progress: 1});
    progressBar.hidden = true;
    panel.append(progressBar);

    var container = new ui.List();
    container.class.add('scene-list');
    panel.append(container);
    container.hidden = true;

    var tooltips = [];
    var events = [];
    var scenes = [];

    var toggleProgress = function (toggle) {
        loading.hidden = !toggle;
        progressBar.hidden = !toggle;
        container.hidden = toggle || !scenes.length;
    };

    // dropdown menu for each scene
    var dropdownMenu = ui.Menu.fromData({
        'scene-duplicate': {
            title: 'Duplicate Scene',
            filter: function () {
                return editor.call('permissions:write');
            },
            select: function () {
                var name = dropdownScene.name;
                var regex = /^(.*?) ([0-9]+)$/;
                var numberPart = 2;
                var namePart = dropdownScene.name;
                var matches = dropdownScene.name.match(regex);
                if (matches && matches.length === 3) {
                    namePart = matches[1];
                    numberPart = parseInt(matches[2], 10);
                }

                // create duplicate scene name
                while (true)  {
                    name = namePart + ' ' + numberPart;
                    var found = true;
                    for (var i = 0; i < scenes.length; i++) {
                        if (scenes[i].name === name) {
                            numberPart++;
                            found = false;
                            break;
                        }
                    }

                    if (found)
                        break;
                }

                editor.call('scenes:duplicate', dropdownScene.id, name);
            }
        },
        'scene-delete': {
            title: 'Delete Scene',
            filter: function () {
                return editor.call('permissions:write');
            },
            select: function () {
                editor.call('picker:confirm', 'Are you sure you want to delete this Scene?');
                editor.once('picker:confirm:yes', function () {
                    var id = dropdownScene.id;
                    onSceneDeleted(id);
                    editor.call('scenes:delete', id);
                });
            }
        }
    });

    editor.call('layout.root').append(dropdownMenu);

    var dropdownScene = null;

    // disables / enables field depending on permissions
    var handlePermissions = function (field) {
        field.disabled = ! editor.call('permissions:write');
        return editor.on('permissions:set:' + config.self.id, function (accessLevel) {
            if (accessLevel === 'write' || accessLevel == 'admin') {
                field.disabled = false;
            } else {
                field.disabled = true;
            }
        });
    };

    // on closing menu remove 'clicked' class from respective dropdown
    dropdownMenu.on('open', function (open) {
        if (! open && dropdownScene) {
            var item = document.getElementById('picker-scene-' + dropdownScene.id);
            if (item) {
                var clicked = item.querySelector('.clicked');
                if (clicked) {
                    clicked.classList.remove('clicked');
                }
            }
        }
    });

    // new scene button
    var newScene = new ui.Button({
        text: 'Add new Scene'
    });

    handlePermissions(newScene);
    newScene.class.add('new');

    panel.append(newScene);

    newScene.on('click', function () {
        if (! editor.call('permissions:write'))
            return;

        editor.call('picker:scene:close');

        editor.call('scenes:new', function (scene) {
            editor.call('scene:load', scene.id, true);
        });
    });

    // on show
    panel.on('show', function () {
        toggleProgress(true);

        // load scenes
        editor.call('scenes:list', function (items) {
            toggleProgress(false);
            scenes = items;
            refreshScenes();
        });
    });

    // on hide
    panel.on('hide', function() {
        destroyTooltips();
        destroyEvents();
        scenes = [];

        // destroy scene items because same row ids
        // might be used by download / new build popups
        container.element.innerHTML = '';

        editor.emit('picker:scene:close');
    });

    // create row for scene
    var createSceneEntry = function (scene) {
        var row = new ui.ListItem();
        row.element.id = 'picker-scene-' + scene.id;

        container.append(row);

        if (config.scene.id && parseInt(scene.id, 10) === parseInt(config.scene.id, 10))
            row.class.add('current');

        if (parseInt(scene.id, 10) === parseInt(config.project.primaryScene, 10))
            row.class.add('primary');

        // primary scene icon
        var primary = new ui.Button({
            text: '&#57891'
        });
        events.push(handlePermissions(primary));
        primary.class.add('primary');
        row.element.appendChild(primary.element);

        events.push(primary.on('click', function () {
            if (!editor.call('permissions:write') || config.project.primaryScene === scene.id)
                return;

            var prevPrimary = config.project.primaryScene;
            config.project.primaryScene = scene.id;
            onPrimarySceneChanged(scene.id, prevPrimary);
            editor.call('project:setPrimaryScene', scene.id);
        }));

        // show tooltip for primary scene icon
        var tooltipText = parseInt(scene.id, 10) === parseInt(config.project.primaryScene, 10) ? 'Primary Scene' : 'Set Primary Scene';
        var tooltip = Tooltip.attach({
            target: primary.element,
            text: tooltipText,
            align: 'right',
            root: editor.call('layout.root')
        });
        tooltips.push(tooltip);

        // scene name
        var name = new ui.Label({
            text: scene.name
        });
        name.class.add('name');

        row.element.appendChild(name.element);

        // scene date
        var date = new ui.Label({
            text: editor.call('datetime:convert', scene.modified)
        });
        date.class.add('date');
        row.element.appendChild(date.element);

        // dropdown
        var dropdown = document.createElement('span');
        dropdown.classList.add('dropdown');
        row.element.appendChild(dropdown);

        var dropdownIcon = document.createElement('div');
        dropdownIcon.classList.add('dropdown-icon', 'font-icon');
        dropdown.appendChild(dropdownIcon);

        dropdown.addEventListener('click', function () {
            dropdown.classList.add('clicked');

            dropdownScene = scene;
            dropdownMenu.open = true;
            var rect = dropdown.getBoundingClientRect();
            dropdownMenu.position(rect.right - dropdownMenu.innerElement.clientWidth, rect.bottom);
        });

        if (parseInt(config.scene.id, 10) !== parseInt(scene.id, 10)) {
            events.push(row.on('click', function (e) {
                if (e.target === row.element || e.target === name.element || e.target === date.element) {
                    if (parseInt(config.scene.id, 10) === parseInt(scene.id, 10))
                        return;

                    editor.call('picker:scene:close');
                    editor.call('scene:load', scene.id);
                }
            }));
        }

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

    var refreshScenes = function () {
        dropdownMenu.open = false;
        destroyTooltips();
        destroyEvents();
        container.element.innerHTML = '';
        sortScenes(scenes);
        container.hidden = scenes.length === 0;
        scenes.forEach(createSceneEntry);
    };

    // call picker
    editor.method('picker:scene', function() {
        editor.call('picker:project', 'scenes');
    });

    // close picker
    editor.method('picker:scene:close', function() {
        editor.call('picker:project:close');
    });

    var onSceneDeleted = function (sceneId) {
        // if loaded scene deleted do not allow closing popup
        if (!config.scene.id || parseInt(config.scene.id, 10) === parseInt(sceneId, 10)) {
            editor.call('picker:project:setClosable', false);
        }

        if (panel.hidden) return;

        var row = document.getElementById('picker-scene-' + sceneId);
        if (row) {
            row.parentElement.removeChild(row);
        }

        for (var i = 0; i < scenes.length; i++) {
            if (parseInt(scenes[i].id, 10) === parseInt(sceneId, 10)) {
                // close dropdown menu if current scene deleted
                if (dropdownScene === scenes[i])
                    dropdownMenu.open = false;

                scenes.splice(i, 1);
                break;
            }
        }

        if (! scenes.length) {
            container.hidden = true;
        }

    };

    // subscribe to messenger pack.delete
    editor.on('messenger:pack.delete', function (data) {
        onSceneDeleted(data.pack.id);
    });

    // subscribe to messenger pack.new
    editor.on('messenger:pack.new', function (data) {
        if (panel.hidden) return;

        editor.call('scenes:get', data.pack.id, function (scene) {
            if (panel.hidden) return; // check if hidden when Ajax returns

            scenes.push({
                id: scene.id,
                modified: scene.modified,
                name: scene.name
            });

            refreshScenes();
        });
    });

    editor.on('project:primaryScene', onPrimarySceneChanged);

    var destroyTooltips = function () {
        tooltips.forEach(function (tooltip) {
            tooltip.destroy();
        });
        tooltips = [];
    };

    var destroyEvents = function () {
        events.forEach(function (evt) {
            evt.unbind();
        });
        events = [];
    };

    var onPrimarySceneChanged = function (newValue, oldValue) {
        if (panel.hidden || parseInt(newValue, 10) === parseInt(oldValue, 10)) return;

        refreshScenes();
    };


    // open picker if no scene is loaded
    if (!config.scene.id)
        editor.call('picker:scene');

});