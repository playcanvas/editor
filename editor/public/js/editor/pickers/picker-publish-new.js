editor.once('load', function () {
    'use strict';

    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    // holds all tooltips
    var tooltips = [];

    // holds events that need to be destroyed
    var events = [];

    // main panel
    var panel = new ui.Panel();
    panel.class.add('picker-publish-new');

    // register panel with project popup
    editor.call('picker:project:registerPanel', 'publish-download', 'Download New Build', panel);
    editor.call('picker:project:registerPanel', 'publish-new', 'Publish New Build', panel);

    var mode = 'publish';

    var primaryScene = null;

    editor.method('picker:publish:new', function () {
        mode = 'publish';
        editor.call('picker:project', 'publish-new');
        panel.class.remove('download-mode');
    });

    editor.method('picker:publish:download', function () {
        mode = 'download';
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

    var blankImage = config.url.static + '/platform/images/common/blank_project.png';

    var clearAppImage = function () {
        imageField.classList.remove('progress');
        if (config.project.thumbnails.m) {
            imageField.classList.remove('blank');
            imageField.style.backgroundImage = 'url("' + config.project.thumbnails.m + '")';
        } else {
            imageField.classList.add('blank');
            imageField.style.backgroundImage = 'url("' + blankImage + '")';
        }
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
        imageField.style.backgroundImage = 'url("' + config.url.static + '/platform/images/common/ajax-loader.gif")';

        var file = fileInput.files[0];
        fileInput.value = null;

        editor.call('images:upload', file, function (data) {
            imageS3Key = data.s3Key;
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
    var label = new ui.Label({ text: 'Title' });
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
    inputName.class.add('input-field');
    group.appendChild(inputName.element);

    inputName.elementInput.addEventListener('keyup', function (e) {
        inputNameError.hidden = inputName.elementInput.value.length <= 1000;
        refreshButtonsState();
    });

    label = new ui.Label({ text: 'Click on the image to upload artwork. 720 x 720px' });
    label.class.add('image-click');
    group.appendChild(label.element);

    // description
    var panelDescription = new ui.Panel();
    panelDescription.class.add('description');
    panel.append(panelDescription);

    label = new ui.Label({ text: 'Description' });
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

    label = new ui.Label({ text: 'Version' });
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
    inputVersion.class.add('input-field');
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

    label = new ui.Label({ text: 'Release Notes' });
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

    // engine version
    const panelEngineVersion = new ui.Panel();
    label = new ui.Label({ text: 'Engine Version' });
    label.class.add('field-label');
    panelEngineVersion.append(label);

    const engineVersionDropdown = new pcui.SelectInput({
        value: editor.call('settings:session').get('engineVersion'),
        options: config.engineVersions.map(data => {
            const keys = Object.keys(data);
            return {
                t: keys[0],
                v: data[keys[0]]
            };
        })
    });
    engineVersionDropdown.style.margin = '0';
    panelEngineVersion.append(engineVersionDropdown);
    panel.append(panelEngineVersion);

    var fieldOptionsConcat;
    var fieldOptionsMinify;
    var fieldOptionsPreload;
    var fieldOptionsSourcemaps;
    var fieldOptionsOptimizeSceneFormat;

    if (! legacyScripts) {
        // options
        var panelOptions = new ui.Panel();
        panelOptions.class.add('options');
        panel.append(panelOptions);

        label = new ui.Label({ text: 'Options' });
        label.class.add('field-label');
        panelOptions.append(label);

        // concatenate scripts
        var panelOptionsConcat = new ui.Panel();
        panelOptionsConcat.class.add('field');
        panelOptions.append(panelOptionsConcat);
        fieldOptionsConcat = new ui.Checkbox();
        fieldOptionsConcat.value = true;
        fieldOptionsConcat.class.add('tick');
        panelOptionsConcat.append(fieldOptionsConcat);
        label = new ui.Label({ text: 'Concatenate Scripts' });
        panelOptionsConcat.append(label);

        // minify scripts
        var panelOptionsMinify = new ui.Panel();
        panelOptionsMinify.class.add('field');
        panelOptions.append(panelOptionsMinify);
        fieldOptionsMinify = new ui.Checkbox();
        fieldOptionsMinify.value = true;
        fieldOptionsMinify.class.add('tick');
        panelOptionsMinify.append(fieldOptionsMinify);
        label = new ui.Label({ text: 'Minify Scripts' });
        panelOptionsMinify.append(label);

        // generate sourcemaps
        var panelOptionsSourcemaps = new ui.Panel();
        panelOptionsSourcemaps.class.add('field');
        panelOptions.append(panelOptionsSourcemaps);
        fieldOptionsSourcemaps = new ui.Checkbox();
        fieldOptionsSourcemaps.value = false;
        fieldOptionsSourcemaps.class.add('tick');
        panelOptionsSourcemaps.append(fieldOptionsSourcemaps);
        label = new ui.Label({ text: 'Generate Source Maps' });
        panelOptionsSourcemaps.append(label);

        fieldOptionsConcat.on('change', value => {
            panelOptionsMinify.hidden = !value;
            panelOptionsSourcemaps.hidden = (!fieldOptionsMinify.value || !value);
        });

        fieldOptionsMinify.on('change', value => {
            panelOptionsSourcemaps.hidden = !value;
        });

        // create preload bundle
        if (editor.call('users:hasFlag', 'hasPreloadBundling')) {
            const panelOptionsPreload = new ui.Panel();
            panelOptionsPreload.class.add('field');
            panelOptions.append(panelOptionsPreload);
            fieldOptionsPreload = new ui.Checkbox();
            fieldOptionsPreload.value = true;
            fieldOptionsPreload.class.add('tick');
            panelOptionsPreload.append(fieldOptionsPreload);
            const labelPreload = new ui.Label({ text: 'Create Preload Bundles' });
            panelOptionsPreload.append(labelPreload);
        }

        // optimize scene format
        const panelOptionsOptimizeFormat = new ui.Panel();
        panelOptionsOptimizeFormat.class.add('field');
        panelOptions.append(panelOptionsOptimizeFormat);
        fieldOptionsOptimizeSceneFormat = new ui.Checkbox();
        fieldOptionsOptimizeSceneFormat.value = false;
        fieldOptionsOptimizeSceneFormat.class.add('tick');
        panelOptionsOptimizeFormat.append(fieldOptionsOptimizeSceneFormat);
        const labelPreload = new ui.Label({ text: 'Optimize Scene Format' });
        panelOptionsOptimizeFormat.append(labelPreload);
    }

    // scenes
    var panelScenes = new ui.Panel();
    panelScenes.class.add('scenes');
    panel.append(panelScenes);

    label = new ui.Label({ text: 'Choose Scenes' });
    panelScenes.append(label);

    var selectAll = new ui.Checkbox();
    selectAll.class.add('tick');
    panelScenes.append(selectAll);

    label = new ui.Label({ text: 'Select all' });
    panelScenes.append(label);
    label.class.add('select-all');

    // scenes container
    var container = new ui.List();
    container.class.add('scene-list');
    panelScenes.append(container);

    var panelNoScenes = new ui.Panel();
    panelNoScenes.class.add('scenes');
    panel.append(panelNoScenes);

    // no scenes msg
    var labelNoScenes = new ui.Label({ text: 'There are no scenes.' });
    labelNoScenes.class.add('error');
    labelNoScenes.hidden = true;
    panelNoScenes.append(labelNoScenes);

    // loading scenes
    var loadingScenes = new ui.Label({
        text: 'Loading scenes...'
    });
    panelNoScenes.append(loadingScenes);

    var progressBar = new ui.Progress({ progress: 1 });
    progressBar.hidden = false;
    panelNoScenes.append(progressBar);

    // holds all scenes
    var scenes = [];

    // returns a list of the selected scenes
    // with the primary scene first
    var getSelectedScenes = function () {
        var result = [];

        var listItems = container.innerElement.childNodes;
        for (let i = 0; i < listItems.length; i++) {
            if (listItems[i].ui.isSelected()) {
                result.push(listItems[i].ui.sceneId);
            }
        }

        // put primary scene first
        result.sort(function (a, b) {
            if (a === primaryScene) return -1;
            if (b === primaryScene) return 1;
            return 0;
        });

        return result;
    };

    var jobInProgress = false;

    // publish button
    var btnPublish = new ui.Button({
        text: 'Publish Now'
    });
    btnPublish.class.add('publish');
    panel.append(btnPublish);

    btnPublish.on('click', function () {
        if (jobInProgress)
            return;

        jobInProgress = true;

        refreshButtonsState();

        var data = {
            name: inputName.value,
            project_id: config.project.id,
            branch_id: config.self.branch.id,
            scenes: getSelectedScenes()
        };

        if (inputDescription.value)
            data.description = inputDescription.value;

        if (inputVersion.value)
            data.version = inputVersion.value;

        if (inputNotes.value)
            data.release_notes = inputNotes.value;

        if (imageS3Key)
            data.image_s3_key = imageS3Key;

        if (fieldOptionsConcat) {
            data.scripts_concatenate = fieldOptionsConcat.value;
        }

        if (fieldOptionsMinify) {
            data.scripts_minify = fieldOptionsMinify.value;

            if (fieldOptionsConcat.value && fieldOptionsMinify.value && fieldOptionsSourcemaps.value) {
                data.scripts_sourcemaps = true;
            }
        }

        if (fieldOptionsPreload)
            data.preload_bundle = fieldOptionsPreload.value;

        if (fieldOptionsOptimizeSceneFormat)
            data.optimize_scene_format = fieldOptionsOptimizeSceneFormat.value;

        if (engineVersionDropdown.value !== 'current') {
            data.engine_version = engineVersionDropdown.value;
        }

        editor.call('apps:new', data, function () {
            jobInProgress = false;
            editor.call('picker:builds');
        }, function (status) {
            jobInProgress = false;
            editor.call('status:error', 'Error while publishing: ' + status);
            editor.call('picker:builds');
        });
    });

    // web download button
    var btnWebDownload = new ui.Button({
        text: 'Download'
    });
    btnWebDownload.class.add('web-download');
    panel.append(btnWebDownload);

    var urlToDownload = null;

    // download app
    var download = function () {
        jobInProgress = true;

        refreshButtonsState();

        // post data
        var data = {
            name: inputName.value,
            project_id: config.project.id,
            branch_id: config.self.branch.id,
            scenes: getSelectedScenes(),
            scripts_concatenate: fieldOptionsConcat ? fieldOptionsConcat.value : false,
            scripts_minify: fieldOptionsMinify ? fieldOptionsMinify.value : false,
            scripts_sourcemaps: fieldOptionsMinify && fieldOptionsMinify.value && fieldOptionsSourcemaps.value,
            preload_bundle: fieldOptionsPreload ? fieldOptionsPreload.value : false,
            optimize_scene_format: fieldOptionsOptimizeSceneFormat ? fieldOptionsOptimizeSceneFormat.value : false
        };

        if (engineVersionDropdown.value !== 'current') {
            data.engine_version = engineVersionDropdown.value;
        }

        // ajax call
        editor.call('apps:download', data, function (job) {
            // show download progress
            panelDownloadProgress.hidden = false;
            btnDownloadReady.hidden = true;
            downloadProgressIconWrapper.classList.remove('success');
            downloadProgressIconWrapper.classList.remove('error');

            downloadProgressTitle.class.remove('error');
            downloadProgressTitle.text = 'Preparing build...';

            // smoothly scroll to the bottom
            panelDownloadProgress.scrollIntoView({
                behavior: 'smooth',
                block: 'end'
            });

            // when job is updated get the job and
            // proceed depending on job status
            var evt = editor.on('messenger:job.update', function (msg) {
                if (msg.job.id === job.id) {
                    evt.unbind();

                    // get job
                    Ajax({
                        url: '{{url.api}}/jobs/' + job.id,
                        auth: true
                    })
                    .on('load', function (status, data) {
                        var job = data;
                        // success ?
                        if (job.status === 'complete') {
                            downloadProgressIconWrapper.classList.add('success');
                            downloadProgressTitle.text = 'Your build is ready';
                            urlToDownload = job.data.download_url;
                            btnDownloadReady.hidden = false;
                            jobInProgress = false;

                            refreshButtonsState();
                        } else if (job.status === 'error') { // handle error
                            downloadProgressIconWrapper.classList.add('error');
                            downloadProgressTitle.class.add('error');
                            downloadProgressTitle.text = job.messages[0];
                            jobInProgress = false;

                            refreshButtonsState();
                        }
                    }).on('error', function () {
                        // error
                        downloadProgressIconWrapper.classList.add('error');
                        downloadProgressTitle.class.add('error');
                        downloadProgressTitle.text = 'Error: Could not start download';
                        jobInProgress = false;

                        refreshButtonsState();
                    });
                }
            });
            events.push(evt);
        }, function () {
            jobInProgress = false;

            refreshButtonsState();

            // error
            log.error(arguments);
        });
    };

    btnWebDownload.on('click', function () {
        if (jobInProgress)
            return;

        download();
    });

    // download progress
    var panelDownloadProgress = document.createElement('div');
    panelDownloadProgress.classList.add('progress');
    panelDownloadProgress.classList.add('download');
    panel.append(panelDownloadProgress);

    // icon
    var downloadProgressIconWrapper = document.createElement('span');
    downloadProgressIconWrapper.classList.add('icon');
    panelDownloadProgress.appendChild(downloadProgressIconWrapper);

    var downloadProgressImg = new Image();
    downloadProgressIconWrapper.appendChild(downloadProgressImg);
    downloadProgressImg.src = config.url.static + "/platform/images/common/ajax-loader.gif";

    // progress info
    var downloadProgressInfo = document.createElement('span');
    downloadProgressInfo.classList.add('progress-info');
    panelDownloadProgress.appendChild(downloadProgressInfo);

    var downloadProgressTitle = new ui.Label({ text: 'Preparing build' });
    downloadProgressTitle.renderChanges = false;
    downloadProgressTitle.class.add('progress-title');
    downloadProgressInfo.appendChild(downloadProgressTitle.element);

    var btnDownloadReady = new ui.Button({ text: 'Download' });
    btnDownloadReady.class.add('ready');
    downloadProgressInfo.appendChild(btnDownloadReady.element);

    btnDownloadReady.on('click', function () {
        if (urlToDownload) {
            window.open(urlToDownload);
        }

        editor.call('picker:publish');
    });

    var refreshButtonsState = function () {
        var selectedScenes = getSelectedScenes();
        var disabled = !inputName.value ||
                       !selectedScenes.length ||
                       inputName.value.length > 1000 ||
                       inputDescription.value.length > 10000 ||
                       inputNotes.value.length > 10000 ||
                       inputVersion.value.length > 20 ||
                       isUploadingImage ||
                       jobInProgress;

        btnPublish.disabled = disabled;
        btnWebDownload.disabled = disabled;
    };

    var createSceneItem = function (scene) {
        var row = new ui.ListItem();
        row.element.id = 'picker-scene-' + scene.id;
        row.sceneId = scene.id;

        container.append(row);

        if (config.scene.id && parseInt(scene.id, 10) === parseInt(config.scene.id, 10))
            row.class.add('current');

        if (scene.id === primaryScene) {
            row.class.add('primary');
        }
        // primary scene icon
        var primary = new ui.Button({
            text: '&#57891'
        });
        primary.class.add('primary');
        row.element.appendChild(primary.element);

        primary.on('click', function () {
            if (!editor.call('permissions:write'))
                return;

            if (primaryScene === scene.id) return;

            primaryScene = scene.id;
            // auto select new primary scene
            select.value = true;

            refreshScenes();
        });

        // show tooltip for primary scene icon
        var tooltipText = scene.id === primaryScene ? 'Primary Scene' : 'Set Primary Scene';
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

        // selection
        var select = new ui.Checkbox();
        select.class.add('tick');
        row.element.appendChild(select.element);

        // if selectAll changes then change this too
        events.push(selectAll.on('change', function (value) {
            select.value = value;
        }));

        // handle checkbox tick
        select.on('change', refreshButtonsState);

        row.select = function () {
            select.value = true;
        };
        row.isSelected = function () {
            return select.value;
        };

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
            if (primaryScene === a.id) {
                return -1;
            } else if (primaryScene === b.id) {
                return 1;
            }

            if (a.modified < b.modified) {
                return 1;
            } else if (a.modified > b.modified) {
                return -1;
            }

            return 0;
        });
    };

    var refreshScenes = function () {
        var content = document.querySelector('.ui-panel.right > .content');
        var scrollTop = content.scrollTop;

        var selectedScenes = getSelectedScenes();

        destroyTooltips();
        destroyEvents();
        container.element.innerHTML = '';
        sortScenes(scenes);
        panelScenes.hidden = !scenes.length;
        panelNoScenes.hidden = !panelScenes.hidden;
        labelNoScenes.hidden = scenes.length;
        loadingScenes.hidden = true;
        progressBar.hidden = true;
        refreshButtonsState();

        // keep previous scene selection or
        // if no scene is selected then select
        // the primary scene
        scenes.forEach(function (scene) {
            var item = createSceneItem(scene);
            if (selectedScenes.indexOf(scene.id) !== -1 || selectedScenes.length === 0 && scene.id === primaryScene) {
                item.select();
            }
        });

        content.scrollTop = scrollTop;
    };

    // on show
    panel.on('show', function () {
        panelDownloadProgress.hidden = true;
        panelNoScenes.hidden = false;
        labelNoScenes.hidden = true;
        loadingScenes.hidden = false;
        progressBar.hidden = false;
        container.element.innerHTML = '';
        inputName.value = config.project.name;
        inputDescription.value = config.project.description;
        inputVersion.value = '';
        inputNotes.value = '';
        engineVersionDropdown.value = editor.call('settings:session').get('engineVersion');
        imageS3Key = null;
        if (config.project.thumbnails.xl) {
            imageS3Key = config.project.thumbnails.xl.substring(config.url.images.length + 1);
        }

        clearAppImage();

        selectAll.value = false;

        var loadedApps = mode !== 'publish';
        var loadedScenes = false;

        editor.call('scenes:list', function (items) {
            loadedScenes = true;

            scenes = items;
            // select primary scene
            if (! primaryScene && items[0]) {
                primaryScene = items[0].id;
            }

            if (loadedApps) {
                refreshScenes();
            }
        });

        if (! loadedApps) {
            editor.call('apps:list', function (apps) {
                loadedApps = true;

                var version = 'e.g. 1.0.0';

                if (apps.length) {
                    apps.sort(function (a, b) {
                        if (a.id === config.project.primaryApp)
                            return -1;
                        if (b.id === config.project.primaryApp)
                            return 1;
                        if (b.modified_at < a.modified_at)
                            return -1;
                        else if (a.modified_at > b.modified_at)
                            return 1;

                        return 0;
                    });

                    if (apps[0].version) {
                        version = 'Previous version: ' + apps[0].version;
                    }
                }

                inputVersion.placeholder = version;

                if (loadedScenes)
                    refreshScenes();
            });
        }


        inputName.elementInput.focus();

        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', false);
    });

    // on hide
    panel.on('hide', function () {
        scenes = [];
        primaryScene = null;
        imageS3Key = null;
        isUploadingImage = false;
        urlToDownload = null;
        jobInProgress = false;
        destroyTooltips();
        destroyEvents();

        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', true);
    });

    editor.on('viewport:hover', function (state) {
        if (state && ! panel.hidden) {
            setTimeout(function () {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // subscribe to messenger scene.delete
    editor.on('messenger:scene.delete', function (data) {
        if (panel.hidden) return;
        if (data.scene.branchId !== config.self.branch.id) return;

        var sceneId = parseInt(data.scene.id, 10);

        var row = document.getElementById('picker-scene-' + sceneId);
        if (row) {
            row.remove();
        }

        for (let i = 0; i < scenes.length; i++) {
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

    // subscribe to messenger scene.new
    editor.on('messenger:scene.new', function (data) {
        if (panel.hidden) return;
        if (data.scene.branchId !== config.self.branch.id) return;

        editor.call('scenes:get', data.scene.id, function (err, scene) {
            if (panel.hidden) return; // check if hidden when Ajax returns

            scenes.push(scene);

            refreshScenes();
        });
    });

});
