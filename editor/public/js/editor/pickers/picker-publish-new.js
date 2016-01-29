editor.once('load', function () {
    'use strict';

    // main panel
    var panel = new ui.Panel();
    panel.class.add('picker-publish-new');

    // register panel with project popup
    editor.call('picker:project:registerPanel', 'publish-download', 'Download New Build', panel);
    editor.call('picker:project:registerPanel', 'publish-new', 'Publish New Build', panel);

    // info panel
    var panelInfo = new ui.Panel();
    panelInfo.class.add('info');
    panel.append(panelInfo);

    // image
    var imageField = document.createElement('div');
    imageField.classList.add('image');
    panelInfo.append(imageField);

    imageField.style.background = 'url("' + config.url.static + '/platform/images/common/blank_project.png' + '")';
    imageField.style.backgroundSize = '180%';

    var group = document.createElement('span');
    panelInfo.append(group);

    // name
    var label = new ui.Label({text: 'Title'});
    label.class.add('field-label');
    group.appendChild(label.element);

    var inputNameError = new ui.Label({
        text: 'Cannot exceed 1000 characters'
    });
    inputNameError.class.add('error');
    inputNameError.hidden = true;
    group.appendChild(inputNameError.element);

    var inputName = new ui.TextField();
    inputName.renderChanges = false;
    inputName.placeholder = 'Required';
    inputName.class.add('name');
    group.appendChild(inputName.element);

    inputName.elementInput.addEventListener('keyup', function (e) {
        inputNameError.hidden = inputName.elementInput.value.length <= 1000;
    });

    label = new ui.Label({text: 'Click on the image to upload artwork. 720 x 720px'});
    group.appendChild(label.element);

    // description
    var panelDescription = new ui.Panel();
    panelDescription.class.add('description');
    panel.append(panelDescription);

    label = new ui.Label({text: 'Description'});
    label.class.add('field-label');
    panelDescription.append(label);

    var inputDescError = new ui.Label({
        text: 'Cannot exceed 10000 characters'
    });
    inputDescError.class.add('error');
    inputDescError.hidden = true;
    panelDescription.append(inputDescError);

    var inputDescription = document.createElement('textarea');
    inputDescription.addEventListener('keyup', function (e) {
        if (e.keyCode === 27) {
            inputDescription.blur();
        }

        inputDescError.hidden = inputDescription.value.length < 10000;
    });
    panelDescription.append(inputDescription);

    // version
    var panelVersion = new ui.Panel();
    panelVersion.class.add('version');
    panel.append(panelVersion);

    label = new ui.Label({text: 'Version'});
    label.class.add('field-label');
    panelVersion.append(label);

    var inputVersionError = new ui.Label({
        text: 'Cannot exceed 20 characters'
    });
    inputVersionError.class.add('error');
    inputVersionError.hidden = true;
    panelVersion.append(inputVersionError);

    var inputVersion = new ui.TextField();
    inputVersion.renderChanges = false;
    inputVersion.placeholder = 'e.g. 1.0.0';
    panelVersion.append(inputVersion);

    inputVersion.elementInput.addEventListener('keyup', function (e) {
        inputVersionError.hidden = inputVersion.value.length <= 20;
    });

    // release notes
    var panelNotes = new ui.Panel();
    panelNotes.class.add('notes');
    panel.append(panelNotes);

    label = new ui.Label({text: 'Release Notes'});
    label.class.add('field-label');
    panelNotes.append(label);

    var inputNotesError = new ui.Label({
        text: 'Cannot exceed 10000 characters'
    });
    inputNotesError.class.add('error');
    inputNotesError.hidden = true;
    panelNotes.append(inputNotesError);

    var inputNotes = document.createElement('textarea');
    panelNotes.append(inputNotes);
    inputNotes.addEventListener('keyup', function (e) {
        if (e.keyCode === 27) {
            inputNotes.blur();
        }

        inputNotesError.hidden = inputNotes.value.length <= 10000;
    });

    // scenes
    var panelScenes = new ui.Panel();
    panelScenes.class.add('scenes');
    panel.append(panelScenes);

    label = new ui.Label({text: 'Choose Scenes'});
    panelScenes.append(label);

    var selectAll = new ui.Checkbox();
    selectAll.class.add('tick');
    panelScenes.append(selectAll);

    // scenes container
    var container = new ui.List();
    container.class.add('scene-list');
    panelScenes.append(container);

    var panelNoScenes = new ui.Panel();
    panelNoScenes.class.add('scenes');
    panel.append(panelNoScenes);

    // no scenes msg
    var labelNoScenes = new ui.Label({text: 'There are no scenes.'});
    labelNoScenes.class.add('error');
    panelNoScenes.append(labelNoScenes);

    // holds all tooltips
    var tooltips = [];

    // holds events that need to be destroyed
    var events = [];

    // holds all scenes
    var scenes = [];

    // holds selected scenes
    var selectedScenes = [];

    // publish button
    var btnPublish = new ui.Button({
        text: 'Publish Now'
    });
    btnPublish.class.add('publish');
    panel.append(btnPublish);

    btnPublish.on('click', function () {
        var data = {
            name: inputName.value,
            project_id: config.project.id,
            source_pack_ids: selectedScenes.map(function (scene) { return scene.id; })
        };

        if (inputDescription.value)
            data.description = inputDescription.value;

        if (inputVersion.value)
            data.version = inputVersion.value;

        if (inputNotes.value)
            data.release_notes = inputNotes.value;

        editor.call('apps:new', data, function () {
            editor.call('picker:publish');
        }, function () {
            console.log(arguments);
        });
    });

    var refreshButtonsState = function () {
        btnPublish.disabled = !inputName.value ||
                              !selectedScenes.length ||
                              inputName.value.length > 1000 ||
                              inputDescription.value.length > 10000 ||
                              inputNotes.value.length > 10000 ||
                              inputVersion.value.length > 20;
    };

    inputName.on('change', refreshButtonsState);
    inputVersion.on('change', refreshButtonsState);
    inputDescription.addEventListener('change', refreshButtonsState);
    inputNotes.addEventListener('change', refreshButtonsState);

    var createSceneItem = function (scene) {
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
        primary.class.add('primary');
        row.element.appendChild(primary.element);

        primary.on('click', function () {
            if (!editor.call('permissions:write'))
                return;

            var prevPrimary = config.project.primaryScene;
            config.project.primaryScene = scene.id;
            onPrimarySceneChanged(scene.id, prevPrimary);
            editor.call('project:setPrimaryScene', scene.id);
        });

        // show tooltip for primary scene icon
        var tooltip = Tooltip.attach({
            target: primary.element,
            text: 'Set primary scene',
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

        // selection
        var select = new ui.Checkbox();
        select.class.add('tick');
        row.element.appendChild(select.element);

        if (selectedScenes.indexOf(scene) !== -1) {
            select.value = true;
        }

        // if selectAll changes then change this too
        events.push(selectAll.on('change', function (value) {
            select.value = value;
        }));

        // handle checkbox tick
        select.on('change', function (value) {
            if (value) {
                // put primary scene in the beginning
                if (config.project.primaryScene === scene.id) {
                    selectedScenes.splice(0, 0, value);
                } else {
                    // if not primary scene just add to the list
                    selectedScenes.push(scene);
                }
            } else {
                // remove scene from selection
                selectedScenes.splice(selectedScenes.indexOf(scene), 1);
            }

            refreshButtonsState();
        });

        return row;
    };

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

    // handle permission changes
    editor.on('permissions:set:' + config.self.id, function (accessLevel) {
        if (accessLevel === 'write' || accessLevel === 'admin') {
            panel.class.remove('disabled');
        } else {
            panel.class.add('disabled');
        }
    });

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
        var content = document.querySelector('.ui-panel.right > .content');
        var scrollTop = content.scrollTop;

        destroyTooltips();
        destroyEvents();
        container.element.innerHTML = '';
        sortScenes(scenes);
        panelScenes.hidden = !scenes.length;
        panelNoScenes.hidden = !panelScenes.hidden;
        refreshButtonsState();
        scenes.forEach(createSceneItem);

        content.scrollTop = scrollTop;
    };

    var onPrimarySceneChanged = function (newValue, oldValue) {
        if (panel.hidden || parseInt(newValue, 10) === parseInt(oldValue, 10)) return;

        refreshScenes();
    };

    // on show
    panel.on('show', function () {
        container.element.innerHTML = '';
        inputName.value = '';
        inputDescription.value = '';
        inputVersion.value = '';
        inputNotes.value = '';
        editor.call('scenes:list', function (items) {
            scenes = items;
            // select primary scene
            for (var i = 0; i < scenes.length; i++) {
                if (scenes[i].id === config.project.primaryScene) {
                    selectedScenes.push(scenes[i]);
                    break;
                }
            }

            refreshScenes();
        });

        inputName.elementInput.focus();
    });

    // on hide
    panel.on('hide', function () {
        scenes = [];
        selectedScenes = [];
        destroyTooltips();
        destroyEvents();
    });

    // subscribe to messenger pack.delete
    editor.on('messenger:pack.delete', function (data) {
        if (panel.hidden) return;

        var sceneId = parseInt(data.pack.id, 10);

        var row = document.getElementById('picker-scene-' + sceneId);
        if (row) {
            row.remove();
        }

        for (var i = 0; i < scenes.length; i++) {
            if (parseInt(scenes[i].id, 10) === sceneId) {
                scenes.splice(i, 1);
                break;
            }
        }

        if (! scenes.length) {
            panelScenes.hidden = true;
            panelNoScenes.hidden = false;
            refreshButtonsState();
        }
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

});