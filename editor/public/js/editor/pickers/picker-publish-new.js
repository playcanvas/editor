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

    var privateSettings = editor.call('settings:projectPrivate');

    // register panel with project popup
    editor.call('picker:project:registerPanel', 'publish-download', 'Download New Build', panel);
    editor.call('picker:project:registerPanel', 'publish-new', 'Publish New Build', panel);
    editor.call('picker:project:registerPanel', 'publish-facebook', 'Publish to Facebook Instant Games', panel);

    var mode = 'publish';

    var primaryScene = null;

    editor.method('picker:publish:new', function () {
        mode = 'publish';
        editor.call('picker:project', 'publish-new');
        panel.class.remove('download-mode');
        panel.class.remove('facebook-mode');
        panel.class.remove('upgrade');
    });

    editor.method('picker:publish:download', function () {
        mode = 'download';
        editor.call('picker:project', 'publish-download');
        panel.class.add('download-mode');
        panel.class.remove('facebook-mode');

        if (config.owner.plan.type === 'free') {
            panel.class.add('upgrade');
        } else {
            panel.class.remove('upgrade');
        }
    });

    editor.method('picker:publish:facebook', function () {
        mode = 'facebook';
        editor.call('picker:project', 'publish-facebook')
        panel.class.remove('download-mode');
        panel.class.add('facebook-mode');

        if (config.owner.plan.type === 'free') {
            panel.class.add('upgrade');
        } else {
            panel.class.remove('upgrade');
        }

        panelFbId.hidden = !!privateSettings.get('facebook.appId');
        panelFbToken.hidden = !!privateSettings.get('facebook.uploadToken');
        if (! panelFbToken.hidden) {
            tooltipToken.html = getTooltipTokenHtml();
        }
    });

    // upgrade notice
    var labelUpgrade = new ui.Label({
        text: 'This is a premium feature. <a href="/upgrade?account=' + config.owner.username + '" target="_blank">UPGRADE</a> to be able to download your project.',
        unsafe: true
    });
    labelUpgrade.class.add('upgrade');
    panel.append(labelUpgrade);

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
    inputName.class.add('input-field');
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
    inputVersion.class.add('input-field');
    inputVersion.placeholder = 'e.g. 1.0.0';
    panelVersion.append(inputVersion);

    inputVersion.elementInput.addEventListener('keyup', function (e) {
        inputVersionError.hidden = inputVersion.value.length <= 20;
        refreshButtonsState();
    });

    // facebook
    var panelFbId = new ui.Panel()
    panelFbId.class.add('facebook');
    panel.append(panelFbId)

    // app id
    label = new ui.Label({text: 'App ID'});
    label.class.add('field-label');
    panelFbId.append(label);

    var btnHelpAppId = new ui.Button({
        text: '&#57656;'
    });
    btnHelpAppId.class.add('help');
    panelFbId.append(btnHelpAppId);

    var tooltipFbId = Tooltip.attach({
        target: btnHelpAppId.element,
        html: 'This is the Facebook App ID which you can find at the dashboard of your Facebook application. Click <a href="https://developers.facebook.com/apps/" target="_blank">here</a> to see all your Facebook applications.',
        align: 'left',
        hoverable: true,
        root: editor.call('layout.root')
    });
    tooltipFbId.class.add('publish-facebook');

    var suspendFbChanges = false;

    var inputFbAppId = new ui.TextField();
    inputFbAppId.class.add('input-field');
    inputFbAppId.renderChanges = false;
    inputFbAppId.placeholder = 'e.g. 777394875732366';
    panelFbId.append(inputFbAppId);
    inputFbAppId.on('change', function (value) {
        if (! suspendFbChanges)
            privateSettings.set('facebook.appId', value);
        tooltipToken.html = getTooltipTokenHtml();
        refreshButtonsState();
    });

    privateSettings.on('facebook.appId:set', function (value) {
        suspendFbChanges = true;
        inputFbAppId.value = value;
        suspendFbChanges = false;
    });

    // upload token
    var panelFbToken = new ui.Panel()
    panelFbToken.class.add('facebook');
    panel.append(panelFbToken);

    label = new ui.Label({text: 'Upload Access Token'});
    label.class.add('field-label');
    panelFbToken.append(label);

    var btnHelpToken = new ui.Button({
        text: '&#57656;'
    });
    btnHelpToken.class.add('help');
    panelFbToken.append(btnHelpToken);

    var getTooltipTokenHtml = function () {
        var result = 'An Access Token used when uploading a build to Facebook. You can find this under the ';
        if (privateSettings.get('facebook.appId')) {
            result += '<a href="https://developers.facebook.com/apps/' + privateSettings.get('facebook.appId') + '/hosting/" target="_blank">Canvas Hosting page</a>';
        } else {
            result +=  'Canvas Hosting page';
        }
        result += ' at the dashboard of your Facebook application.';
        return result;
    };

    var tooltipToken = Tooltip.attach({
        target: btnHelpToken.element,
        html: getTooltipTokenHtml(),
        align: 'left',
        hoverable: true,
        root: editor.call('layout.root')
    });
    tooltipToken.class.add('publish-facebook');

    var inputFbUploadToken = new ui.TextField();
    inputFbUploadToken.class.add('input-field');
    inputFbUploadToken.renderChanges = false;
    panelFbToken.append(inputFbUploadToken);

    inputFbUploadToken.on('change', function (value) {
        if (! suspendFbChanges)
            privateSettings.set('facebook.uploadToken', value);
        refreshButtonsState();
    });

    privateSettings.on('facebook.uploadToken:set', function (value) {
        suspendFbChanges = true;
        inputFbUploadToken.value = value;
        suspendFbChanges = false;
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


    if (! legacyScripts) {
        // options
        var panelOptions = new ui.Panel();
        panelOptions.class.add('options');
        panel.append(panelOptions);

        label = new ui.Label({text: 'Options'});
        label.class.add('field-label');
        panelOptions.append(label);

        // concatenate scripts
        var panelOptionsConcat = new ui.Panel();
        panelOptionsConcat.class.add('field');
        panelOptions.append(panelOptionsConcat);
        var fieldOptionsConcat = new ui.Checkbox();
        fieldOptionsConcat.value = true;
        fieldOptionsConcat.class.add('tick');
        panelOptionsConcat.append(fieldOptionsConcat);
        var label = new ui.Label({ text: 'Concatenate Scripts' });
        panelOptionsConcat.append(label);
    }


    // scenes
    var panelScenes = new ui.Panel();
    panelScenes.class.add('scenes');
    panel.append(panelScenes);

    label = new ui.Label({text: 'Choose Scenes'});
    panelScenes.append(label);

    var selectAll = new ui.Checkbox();
    selectAll.class.add('tick');
    panelScenes.append(selectAll);

    label = new ui.Label({text: 'Select all'});
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
    var labelNoScenes = new ui.Label({text: 'There are no scenes.'});
    labelNoScenes.class.add('error');
    labelNoScenes.hidden = true;
    panelNoScenes.append(labelNoScenes);

    // loading scenes
    var loadingScenes = new ui.Label({
        text: 'Loading scenes...'
    });
    panelNoScenes.append(loadingScenes);

    var progressBar = new ui.Progress({progress: 1});
    progressBar.hidden = false;
    panelNoScenes.append(progressBar);

    // holds all scenes
    var scenes = [];

    // returns a list of the selected scenes
    // with the primary scene first
    var getSelectedScenes = function () {
        var result = [];

        var listItems = container.innerElement.childNodes;
        for (var i = 0; i < listItems.length; i++) {
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

        if (fieldOptionsConcat)
            data.scripts_concatenate = fieldOptionsConcat.value;

        editor.call('apps:new', data, function () {
            jobInProgress = false;
            editor.call('picker:builds');
        }, function (status) {
            jobInProgress = false;
            editor.call('status:error', 'Error while publishing: ' + status);
            editor.call('picker:builds');
        });
    });

    // publish on facebook button
    var btnPublishFb = new ui.Button({
        text: 'Publish Now'
    });
    btnPublishFb.class.add('publish-fb');
    panel.append(btnPublishFb);

    btnPublishFb.on('click', function () {
        if (jobInProgress)
            return;

        jobInProgress = true;
        refreshButtonsState();

        var data = {
            project_id: config.project.id,
            branch_id: config.self.branch.id,
            scenes: getSelectedScenes()
        };

        if (inputNotes.value)
            data.release_notes = inputNotes.value;

        // ajax call
        editor.call('apps:publishFb', data, function (job) {
            // show progress
            panelFacebookProgress.hidden = false;
            btnFacebookLink.hidden = true;
            facebookProgressIconWrapper.classList.remove('success');
            facebookProgressIconWrapper.classList.remove('error');

            facebookProgressTitle.class.remove('error');
            facebookProgressTitle.text = 'Preparing build...';

            // when job is updated get the job and
            // proceed depending on job status
            var evt = editor.on('messenger:job.update', function (msg) {
                console.log('messenger update')
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
                            facebookProgressIconWrapper.classList.add('success');
                            facebookProgressTitle.text = 'Build published';
                            btnFacebookLink.hidden = false;
                            jobInProgress = false;
                            refreshButtonsState();
                        }
                        // handle error
                        else if (job.status === 'error') {
                            facebookProgressIconWrapper.classList.add('error');
                            facebookProgressTitle.class.add('error');
                            facebookProgressTitle.text = job.messages[0];
                            jobInProgress = false;
                            refreshButtonsState();
                        }
                    }).on('error', function () {
                        // error
                        facebookProgressIconWrapper.classList.add('error');
                        facebookProgressTitle.class.add('error');
                        facebookProgressTitle.text = 'Error: Could not publish';
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
            console.error(arguments);
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
        jobInProgress = true;

        refreshButtonsState();

        // post data
        var data = {
            name: inputName.value,
            project_id: config.project.id,
            branch_id: config.self.branch.id,
            scenes: getSelectedScenes(),
            target: target,
            scripts_concatenate: fieldOptionsConcat ? fieldOptionsConcat.value : false
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
                        }
                        // handle error
                        else if (job.status === 'error') {
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
            console.error(arguments);
        });
    };

    btnWebDownload.on('click', function () {
        if (jobInProgress)
            return;

        download('web');
    });

    // ios download button
    var btnIosDownload = new ui.Button({
        text: 'iOS Download'
    });
    btnIosDownload.class.add('ios-download');
    panel.append(btnIosDownload);

    btnIosDownload.on('click', function () {
        if (jobInProgress)
            return;

        if (config.owner.plan.type !== 'org' && config.owner.plan.type !== 'organization') {
            editor.call('picker:confirm', 'You need an Organization account to be able to download for iOS. Would you like to upgrade?', function () {
                window.open('/upgrade');
            });

            return;
        }
        download('ios');
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

    var downloadProgressTitle = new ui.Label({text: 'Preparing build'});
    downloadProgressTitle.renderChanges = false;
    downloadProgressTitle.class.add('progress-title');
    downloadProgressInfo.appendChild(downloadProgressTitle.element);

    var btnDownloadReady = new ui.Button({text: 'Download'});
    btnDownloadReady.class.add('ready');
    downloadProgressInfo.appendChild(btnDownloadReady.element);

    btnDownloadReady.on('click', function () {
        if (urlToDownload) {
            window.open(urlToDownload);
        }

        editor.call('picker:publish');
    });

    // facebook progress
    var panelFacebookProgress = document.createElement('div');
    panelFacebookProgress.classList.add('progress');
    panelFacebookProgress.classList.add('facebook');
    panel.append(panelFacebookProgress);

    // icon
    var facebookProgressIconWrapper = document.createElement('span');
    facebookProgressIconWrapper.classList.add('icon');
    panelFacebookProgress.appendChild(facebookProgressIconWrapper);

    var facebookProgressImg = new Image();
    facebookProgressIconWrapper.appendChild(facebookProgressImg);
    facebookProgressImg.src = config.url.static + "/platform/images/common/ajax-loader.gif";

    // progress info
    var facebookProgressInfo = document.createElement('span');
    facebookProgressInfo.classList.add('progress-info');
    panelFacebookProgress.appendChild(facebookProgressInfo);

    var facebookProgressTitle = new ui.Label({text: 'Preparing build'});
    facebookProgressTitle.renderChanges = false;
    facebookProgressTitle.class.add('progress-title');
    facebookProgressInfo.appendChild(facebookProgressTitle.element);

    var btnFacebookLink = new ui.Button({text: 'View Builds'});
    btnFacebookLink.class.add('ready');
    facebookProgressInfo.appendChild(btnFacebookLink.element);

    btnFacebookLink.on('click', function () {
        window.open('https://developers.facebook.com/apps/' + privateSettings.get('facebook.appId') + '/hosting');
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
        btnIosDownload.disabled = disabled;

        btnPublishFb.disabled = jobInProgress ||
                                !privateSettings.get('facebook.appId') ||
                                !privateSettings.get('facebook.uploadToken') ||
                                !selectedScenes.length;
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

            primaryScene = scene.id;
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
        panelFacebookProgress.hidden = true;
        panelNoScenes.hidden = false;
        labelNoScenes.hidden = true;
        loadingScenes.hidden = false;
        progressBar.hidden = false;
        container.element.innerHTML = '';
        inputName.value = config.project.name;
        inputDescription.value = config.project.description;
        inputVersion.value = '';
        inputNotes.value = '';
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

    editor.on('viewport:hover', function(state) {
        if (state && ! panel.hidden) {
            setTimeout(function() {
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
