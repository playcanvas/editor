editor.once('load', function () {
    'use strict';

    // main panel
    var panel = new ui.Panel();
    panel.class.add('picker-publish-new');

    // register panel with project popup
    editor.call('picker:project:registerPanel', 'publish-download', 'Download New Build', panel);
    editor.call('picker:project:registerPanel', 'publish-new', 'Publish New Build', panel);

    editor.method('picker:publish:new', function () {
        editor.call('picker:project', 'publish-new');
        panel.class.remove('download-mode');
    });

    editor.method('picker:publish:download', function () {
        editor.call('picker:project', 'publish-download');
        panel.class.add('download-mode');
    });

    // info panel
    var panelInfo = new ui.Panel();
    panelInfo.class.add('info');
    panel.append(panelInfo);

    // image
    var imageField = document.createElement('div');
    imageField.classList.add('image');
    panelInfo.append(imageField);

    var clearAppImage = function () {
        imageField.classList.remove('progress');
        imageField.classList.add('blank');
        imageField.style.backgroundImage = 'url("' + config.url.static + '/platform/images/common/blank_project.png' + '")';
    };

    var setAppImage = function (url) {
        imageField.classList.remove('progress');
        imageField.classList.remove('blank');
        imageField.style.backgroundImage = 'url("' + url + '")';
    };

    clearAppImage();

    // hidden file picker used to upload image
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    imageField.addEventListener('click', function () {
        if (! editor.call('permissions:write'))
            return;

        fileInput.click();
    });

    var imageS3Key = null;
    var isUploadingImage = false;

    fileInput.addEventListener('change', function () {
        if (isUploadingImage)
            return;

        isUploadingImage = true;
        refreshButtonsState();

        imageField.classList.remove('blank');
        imageField.classList.add('progress');
        imageField.style.backgroundImage = 'url("/images/common/ajax-loader.gif")';

        var file = fileInput.files[0];
        fileInput.value = null;

        editor.call('images:upload', file, function (data) {
            imageS3Key = data.s3Key;
            console.log(imageS3Key)
            isUploadingImage = false;
            refreshButtonsState();

            setAppImage(data.url);
        }, function (status, data) {
            // error
            isUploadingImage = false;
            refreshButtonsState();

            clearAppImage();
        });
    });

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
        refreshButtonsState();
    });

    label = new ui.Label({text: 'Click on the image to upload artwork. 720 x 720px'});
    label.class.add('image-click');
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
        refreshButtonsState();
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
        refreshButtonsState();
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
        refreshButtonsState();
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

        if (imageS3Key)
            data.image_s3_key = imageS3Key;

        editor.call('apps:new', data, function () {
            editor.call('picker:publish');
        }, function () {
            console.log(arguments);
        });
    });

    // web download button
    var btnWebDownload = new ui.Button({
        text: 'Web Download'
    });
    btnWebDownload.class.add('web-download');
    panel.append(btnWebDownload);

    var urlToDownload = null;

    // download app for specified target (web or ios)
    var download = function (target) {
        // post data
        var data = {
            name: inputName.value,
            project_id: config.project.id,
            source_pack_ids: selectedScenes.map(function (scene) { return scene.id; }),
            target: target
        };

        // ajax call
        editor.call('apps:download', data, function (job) {
            // show download progress
            panelDownloadProgress.hidden = false;
            btnDownloadReady.hidden = true;
            downloadProgressIconWrapper.classList.remove('success');
            downloadProgressIconWrapper.classList.remove('error');

            downloadProgressTitle.class.remove('error');
            downloadProgressTitle.text = 'Preparing build...';

            // when job is updated get the job and
            // proceed depending on job status
            var evt = editor.on('messenger:job.update', function (msg) {
                if (msg.job.id === job.id) {
                    evt.unbind();

                    // get job
                    Ajax.get('{{url.api}}/jobs/' + job.id + '?access_token={{accessToken}}')
                    .on('load', function (status, data) {
                        var job = data.response[0];
                        // success ?
                        if (job.status === 'complete') {
                            downloadProgressIconWrapper.classList.add('success');
                            downloadProgressTitle.text = 'Your build is ready';
                            urlToDownload = job.data.download_url;
                            btnDownloadReady.hidden = false;
                        }
                        // handle error
                        else if (job.status === 'error') {
                            downloadProgressIconWrapper.classList.add('error');
                            downloadProgressTitle.class.add('error');
                            downloadProgressTitle.text = job.messages[0];
                        }
                    }).on('error', function () {
                        // error
                        downloadProgressIconWrapper.classList.add('error');
                        downloadProgressTitle.class.add('error');
                        downloadProgressTitle.text = 'Error: Could not start download';
                    });
                }
            });
            events.push(evt);
        }, function () {
            // error
            console.error(arguments);
        });
    };

    btnWebDownload.on('click', function () {
        download('web');
    });

    // ios download button
    var btnIosDownload = new ui.Button({
        text: 'iOS Download'
    });
    btnIosDownload.class.add('ios-download');
    panel.append(btnIosDownload);

    btnIosDownload.on('click', function () {
        if (config.self.plan.type === 'free') {
            editor.call('picker:confirm', 'You need a PRO account to be able to download for iOS. Would you like to upgrade?', function () {
                window.open('/upgrade');
            });

            return;
        }
        download('ios');
    });

    // download progress
    var panelDownloadProgress = document.createElement('div');
    panelDownloadProgress.classList.add('progress');
    panel.append(panelDownloadProgress);

    // icon
    var downloadProgressIconWrapper = document.createElement('span');
    downloadProgressIconWrapper.classList.add('icon');
    panelDownloadProgress.appendChild(downloadProgressIconWrapper);

    var downloadProgressImg = new Image();
    downloadProgressIconWrapper.appendChild(downloadProgressImg);
    downloadProgressImg.src = "/images/common/ajax-loader.gif";

    // progress info
    var downloadProgressInfo = document.createElement('span');
    downloadProgressInfo.classList.add('progress-info');
    panelDownloadProgress.appendChild(downloadProgressInfo);

    var downloadProgressTitle = new ui.Label({text: 'Preparing build'});
    downloadProgressTitle.renderChanges = false;
    downloadProgressTitle.class.add('progress-title');
    downloadProgressInfo.appendChild(downloadProgressTitle.element);

    var btnDownloadReady = new ui.Button({text: 'Download'});
    btnDownloadReady.class.add('download-ready');
    downloadProgressInfo.appendChild(btnDownloadReady.element);

    btnDownloadReady.on('click', function () {
        if (urlToDownload) {
            window.open(urlToDownload);
        }

        editor.call('picker:publish');
    });

    var refreshButtonsState = function () {
        var disabled = !inputName.value ||
                       !selectedScenes.length ||
                       inputName.value.length > 1000 ||
                       inputDescription.value.length > 10000 ||
                       inputNotes.value.length > 10000 ||
                       inputVersion.value.length > 20 ||
                       isUploadingImage;

        btnPublish.disabled = disabled;
        btnWebDownload.disabled = disabled;
        btnIosDownload.disabled = disabled;
    };

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
                    selectedScenes.splice(0, 0, scene);
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
        panelDownloadProgress.hidden = true;
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
        imageS3Key = null;
        isUploadingImage = false;
        selectedScenes = [];
        urlToDownload = null;
        clearAppImage();
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