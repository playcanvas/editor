import { BooleanInput, Container, Label, SelectInput, TextAreaInput, TextInput } from '@playcanvas/pcui';

import { LegacyButton } from '@/common/ui/button';
import { LegacyCheckbox } from '@/common/ui/checkbox';
import { LegacyLabel } from '@/common/ui/label';
import { LegacyList } from '@/common/ui/list';
import { LegacyListItem } from '@/common/ui/list-item';
import { LegacyPanel } from '@/common/ui/panel';
import { LegacyProgress } from '@/common/ui/progress';
import { LegacyTextField } from '@/common/ui/text-field';
import { LegacyTooltip } from '@/common/ui/tooltip';
import { convertDatetime } from '@/common/utils';

editor.once('load', () => {
    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    // holds all tooltips
    let tooltips = [];

    // holds events that need to be destroyed
    let events = [];

    let panelOptionsWebLens: Container = null;

    // main panel
    const panel = new LegacyPanel();
    panel.class.add('picker-publish-new');

    // register panel with project popup
    editor.call('picker:project:registerPanel', 'publish-download', 'Download New Build', panel);
    editor.call('picker:project:registerPanel', 'publish-new', 'Publish New Build', panel);

    let mode = 'publish';

    let primaryScene = null;
    const primarySceneKey = `publish:primaryScene:${config.project.id}:${config.self.branch.id}`;

    editor.method('picker:publish:new', () => {
        mode = 'publish';
        editor.call('picker:project', 'publish-new');
        panel.class.remove('download-mode');
        panelOptionsWebLens.hidden = true;
    });

    editor.method('picker:publish:download', () => {
        mode = 'download';
        editor.call('picker:project', 'publish-download');
        panel.class.add('download-mode');
        if (config.self.flags.superUser) {
            panelOptionsWebLens.hidden = false;
        }
    });

    // info panel
    const panelInfo = new LegacyPanel();
    panelInfo.class.add('info');
    panel.append(panelInfo);

    // image
    const imageField = document.createElement('div');
    imageField.classList.add('image');
    panelInfo.append(imageField);

    const blankImage = `${config.url.static}/platform/images/common/blank_project.png`;

    const clearAppImage = function () {
        imageField.classList.remove('progress');
        if (config.project.thumbnails.m) {
            imageField.classList.remove('blank');
            imageField.style.backgroundImage = `url("${config.project.thumbnails.m}")`;
        } else {
            imageField.classList.add('blank');
            imageField.style.backgroundImage = `url("${blankImage}")`;
        }
    };

    const setAppImage = function (url) {
        imageField.classList.remove('progress');
        imageField.classList.remove('blank');
        imageField.style.backgroundImage = `url("${url}")`;
    };

    clearAppImage();

    // hidden file picker used to upload image
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    imageField.addEventListener('click', () => {
        if (!editor.call('permissions:write')) {
            return;
        }

        fileInput.click();
    });

    let imageS3Key = null;
    let isUploadingImage = false;

    fileInput.addEventListener('change', () => {
        if (isUploadingImage) {
            return;
        }

        isUploadingImage = true;
        refreshButtonsState();

        imageField.classList.remove('blank');
        imageField.classList.add('progress');
        imageField.style.backgroundImage = `url("${config.url.static}/platform/images/common/ajax-loader.gif")`;

        const file = fileInput.files[0];
        fileInput.value = null;

        editor.call('images:upload', file, config.project, (data) => {
            imageS3Key = data.s3Key;
            isUploadingImage = false;
            refreshButtonsState();

            setAppImage(data.url);
        }, (status, data) => {
            // error
            isUploadingImage = false;
            refreshButtonsState();

            clearAppImage();
        });
    });

    const group = document.createElement('span');
    panelInfo.append(group);

    // name
    let label = new LegacyLabel({ text: 'Title' });
    label.class.add('field-label');
    group.appendChild(label.element);

    const inputNameError = new LegacyLabel({
        text: 'Cannot exceed 1000 characters'
    });
    inputNameError.class.add('error');
    inputNameError.hidden = true;
    group.appendChild(inputNameError.element);

    const inputName = new LegacyTextField();
    inputName.renderChanges = false;
    inputName.placeholder = 'Required';
    inputName.class.add('name');
    inputName.class.add('input-field');
    group.appendChild(inputName.element);

    inputName.elementInput.addEventListener('keyup', (e) => {
        inputNameError.hidden = inputName.elementInput.value.length <= 1000;
        refreshButtonsState();
    });

    label = new LegacyLabel({ text: 'Click on the image to upload artwork. 720 x 720px' });
    label.class.add('image-click');
    group.appendChild(label.element);

    // description
    const panelDescription = new Container({
        class: 'description'
    });
    panel.append(panelDescription);

    const labelDescription = new Label({
        text: 'Description',
        class: 'field-label'
    });
    panelDescription.append(labelDescription);

    const inputDescError = new Label({
        text: 'Cannot exceed 10000 characters',
        class: 'error',
        hidden: true
    });
    panelDescription.append(inputDescError);

    const inputDescription = new TextAreaInput({
        keyChange: true
    });
    inputDescription.on('change', (value: string) => {
        inputDescError.hidden = value.length < 10000;
        refreshButtonsState();
    });
    panelDescription.append(inputDescription);

    // version
    const panelVersion = new Container({
        class: 'version'
    });
    panel.append(panelVersion);

    const labelVersion = new Label({
        text: 'Version',
        class: 'field-label'
    });
    panelVersion.append(labelVersion);

    const inputVersionError = new Label({
        text: 'Cannot exceed 20 characters',
        class: 'error',
        hidden: true
    });
    panelVersion.append(inputVersionError);

    const inputVersion = new TextInput({
        renderChanges: false,
        class: 'input-field',
        placeholder: 'e.g. 1.0.0'
    });
    panelVersion.append(inputVersion);

    inputVersion.on('change', (value: string) => {
        inputVersionError.hidden = value.length <= 20;
        refreshButtonsState();
    });

    // release notes
    const panelNotes = new Container({
        class: 'notes'
    });
    panel.append(panelNotes);

    const labelNotes = new Label({
        text: 'Release Notes',
        class: 'field-label'
    });
    panelNotes.append(labelNotes);

    const inputNotesError = new Label({
        text: 'Cannot exceed 10000 characters',
        class: 'error',
        hidden: true
    });
    panelNotes.append(inputNotesError);

    const inputNotes = new TextAreaInput({
        keyChange: true
    });
    panelNotes.append(inputNotes);
    inputNotes.on('change', (value: string) => {
        inputNotesError.hidden = value.length <= 10000;
        refreshButtonsState();
    });

    // engine version
    const panelEngineVersion = new Container({
        class: 'engine-version'
    });
    const labelEngineVersion = new Label({
        text: 'Engine Version',
        class: 'field-label'
    });
    panelEngineVersion.append(labelEngineVersion);

    const engineVersionDropdown = new SelectInput({
        value: editor.call('settings:projectUser').get('editor.launchReleaseCandidate') ? 'releaseCandidate' : editor.call('settings:session').get('engineVersion'),
        options: ['previous', 'current', 'releaseCandidate']
        .filter(type => config.engineVersions.hasOwnProperty(type))
        .map((type) => {
            const t = config.engineVersions[type];
            return {
                t: t.description,
                v: type
            };
        })
    });
    engineVersionDropdown.style.margin = '0';
    panelEngineVersion.append(engineVersionDropdown);
    panel.append(panelEngineVersion);

    let fieldOptionsConcat: BooleanInput;
    let fieldOptionsMinify: BooleanInput;
    let fieldOptionsSourcemaps: BooleanInput;
    let fieldOptionsOptimizeSceneFormat: BooleanInput;
    let fieldOptionsWebLens: BooleanInput;

    if (!legacyScripts) {
        // options
        const panelOptions = new Container({
            class: 'options'
        });
        panel.append(panelOptions);

        const labelOptions = new Label({
            text: 'Options',
            class: 'field-label'
        });
        panelOptions.append(labelOptions);

        // concatenate scripts
        const panelOptionsConcat = new Container({
            class: 'field'
        });
        panelOptions.append(panelOptionsConcat);
        fieldOptionsConcat = new BooleanInput({
            value: true,
            class: 'tick'
        });
        panelOptionsConcat.append(fieldOptionsConcat);
        const labelConcat = new Label({ text: 'Concatenate Scripts' });
        panelOptionsConcat.append(labelConcat);

        // minify scripts
        const panelOptionsMinify = new Container({
            class: 'field'
        });
        panelOptions.append(panelOptionsMinify);
        fieldOptionsMinify = new BooleanInput({
            value: true,
            class: 'tick'
        });
        panelOptionsMinify.append(fieldOptionsMinify);
        const labelMinify = new Label({ text: 'Minify Scripts' });
        panelOptionsMinify.append(labelMinify);

        // generate sourcemaps
        const panelOptionsSourcemaps = new Container({
            class: 'field'
        });
        panelOptions.append(panelOptionsSourcemaps);
        fieldOptionsSourcemaps = new BooleanInput({
            value: false,
            class: 'tick'
        });
        panelOptionsSourcemaps.append(fieldOptionsSourcemaps);
        const labelSourcemaps = new Label({ text: 'Generate Source Maps' });
        panelOptionsSourcemaps.append(labelSourcemaps);

        fieldOptionsConcat.on('change', (value: boolean) => {
            panelOptionsMinify.hidden = !value;
            panelOptionsSourcemaps.hidden = (!fieldOptionsMinify.value || !value);
        });

        fieldOptionsMinify.on('change', (value: boolean) => {
            panelOptionsSourcemaps.hidden = !value;
        });

        // optimize scene format
        const panelOptionsOptimizeFormat = new Container({
            class: 'field'
        });
        panelOptions.append(panelOptionsOptimizeFormat);
        fieldOptionsOptimizeSceneFormat = new BooleanInput({
            value: false,
            class: 'tick'
        });
        panelOptionsOptimizeFormat.append(fieldOptionsOptimizeSceneFormat);
        const labelPreload = new Label({ text: 'Optimize Scene Format' });
        panelOptionsOptimizeFormat.append(labelPreload);

        // export to WebLens format
        panelOptionsWebLens = new Container({
            class: 'field'
        });
        panelOptions.append(panelOptionsWebLens);
        fieldOptionsWebLens = new BooleanInput({
            value: false,
            class: 'tick'
        });
        panelOptionsWebLens.append(fieldOptionsWebLens);
        const labelWebLens = new Label({ text: 'Export to WebLens Format' });
        panelOptionsWebLens.append(labelWebLens);
        panelOptionsWebLens.hidden = true;
    }

    // scenes
    const panelScenes = new LegacyPanel();
    panelScenes.class.add('scenes');
    panel.append(panelScenes);

    label = new LegacyLabel({ text: 'Choose Scenes' });
    panelScenes.append(label);

    const selectAll = new LegacyCheckbox();
    selectAll.class.add('tick');
    panelScenes.append(selectAll);

    label = new LegacyLabel({ text: 'Select all' });
    panelScenes.append(label);
    label.class.add('select-all');

    // scenes container
    const container = new LegacyList();
    container.class.add('scene-list');
    panelScenes.append(container);

    const panelNoScenes = new LegacyPanel();
    panelNoScenes.class.add('scenes');
    panel.append(panelNoScenes);

    // no scenes msg
    const labelNoScenes = new LegacyLabel({ text: 'There are no scenes.' });
    labelNoScenes.class.add('error');
    labelNoScenes.hidden = true;
    panelNoScenes.append(labelNoScenes);

    // loading scenes
    const loadingScenes = new LegacyLabel({
        text: 'Loading scenes...'
    });
    panelNoScenes.append(loadingScenes);

    const progressBar = new LegacyProgress({ progress: 1 });
    progressBar.hidden = false;
    panelNoScenes.append(progressBar);

    // holds all scenes
    let scenes = [];

    // returns a list of the selected scenes
    // with the primary scene first
    const getSelectedScenes = function () {
        const result = [];

        const listItems = container.innerElement.childNodes;
        for (let i = 0; i < listItems.length; i++) {
            if (listItems[i].ui.isSelected()) {
                result.push(listItems[i].ui.sceneId);
            }
        }

        // put primary scene first
        result.sort((a, b) => {
            if (a === primaryScene) {
                return -1;
            }
            if (b === primaryScene) {
                return 1;
            }
            return 0;
        });

        return result;
    };

    let jobInProgress = false;

    // publish button
    const btnPublish = new LegacyButton({
        text: 'Publish Now'
    });
    btnPublish.class.add('publish');
    panel.append(btnPublish);

    btnPublish.on('click', () => {
        if (jobInProgress) {
            return;
        }

        jobInProgress = true;

        refreshButtonsState();

        const data = {
            name: inputName.value,
            project_id: config.project.id,
            branch_id: config.self.branch.id,
            scenes: getSelectedScenes()
        };

        if (inputDescription.value) {
            data.description = inputDescription.value;
        }

        if (inputVersion.value) {
            data.version = inputVersion.value;
        }

        if (inputNotes.value) {
            data.release_notes = inputNotes.value;
        }

        if (imageS3Key) {
            data.image_s3_key = imageS3Key;
        }

        if (fieldOptionsConcat) {
            data.scripts_concatenate = fieldOptionsConcat.value;
        }

        if (fieldOptionsMinify) {
            data.scripts_minify = fieldOptionsMinify.value;

            if (fieldOptionsConcat.value && fieldOptionsMinify.value && fieldOptionsSourcemaps.value) {
                data.scripts_sourcemaps = true;
            }
        }

        if (fieldOptionsOptimizeSceneFormat) {
            data.optimize_scene_format = fieldOptionsOptimizeSceneFormat.value;
        }

        if (fieldOptionsWebLens) {
            data.web_lens = fieldOptionsWebLens.value;
        }


        data.engine_version = config.engineVersions[engineVersionDropdown.value].version;

        editor.api.globals.rest.apps.appCreate(data).on('load', () => {
            jobInProgress = false;
            editor.call('picker:builds-publish');
        }).on('error', (status) => {
            jobInProgress = false;
            editor.call('status:error', `Error while publishing: ${status}`);
            editor.call('picker:builds-publish');
        });
    });

    // web download button
    const btnWebDownload = new LegacyButton({
        text: 'Download'
    });
    btnWebDownload.class.add('web-download');
    panel.append(btnWebDownload);

    let urlToDownload = null;

    // download app
    const download = function () {
        jobInProgress = true;

        refreshButtonsState();

        // post data
        const data = {
            name: inputName.value,
            project_id: config.project.id,
            branch_id: config.self.branch.id,
            scenes: getSelectedScenes(),
            scripts_concatenate: fieldOptionsConcat ? fieldOptionsConcat.value : false,
            scripts_minify: fieldOptionsMinify ? fieldOptionsMinify.value : false,
            scripts_sourcemaps: fieldOptionsMinify && fieldOptionsMinify.value && fieldOptionsSourcemaps.value,
            optimize_scene_format: fieldOptionsOptimizeSceneFormat ? fieldOptionsOptimizeSceneFormat.value : false,
            web_lens: fieldOptionsWebLens ? fieldOptionsWebLens.value : false
        };

        data.engine_version = config.engineVersions[engineVersionDropdown.value].version;

        // ajax call
        editor.api.globals.rest.apps.appDownload(data).on('load', (status, job) => {
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
            const evt = editor.on('messenger:job.update', (msg) => {
                if (msg.job.id === job.id) {
                    evt.unbind();

                    // get job
                    editor.api.globals.rest.jobs.jobGet({ jobId: job.id })
                    .on('load', (status, data) => {
                        const job = data;
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
                    }).on('error', () => {
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
        }).on('error', (status, error) => {
            jobInProgress = false;

            refreshButtonsState();

            // error
            log.error(status, error);
        });
    };

    btnWebDownload.on('click', () => {
        if (jobInProgress) {
            return;
        }

        download();
    });

    // download progress
    const panelDownloadProgress = document.createElement('div');
    panelDownloadProgress.classList.add('progress');
    panelDownloadProgress.classList.add('download');
    panel.append(panelDownloadProgress);

    // icon
    const downloadProgressIconWrapper = document.createElement('span');
    downloadProgressIconWrapper.classList.add('icon');
    panelDownloadProgress.appendChild(downloadProgressIconWrapper);

    const downloadProgressImg = new Image();
    downloadProgressIconWrapper.appendChild(downloadProgressImg);
    downloadProgressImg.src = `${config.url.static}/platform/images/common/ajax-loader.gif`;

    // progress info
    const downloadProgressInfo = document.createElement('span');
    downloadProgressInfo.classList.add('progress-info');
    panelDownloadProgress.appendChild(downloadProgressInfo);

    const downloadProgressTitle = new LegacyLabel({ text: 'Preparing build' });
    downloadProgressTitle.renderChanges = false;
    downloadProgressTitle.class.add('progress-title');
    downloadProgressInfo.appendChild(downloadProgressTitle.element);

    const btnDownloadReady = new LegacyButton({ text: 'Download' });
    btnDownloadReady.class.add('ready');
    downloadProgressInfo.appendChild(btnDownloadReady.element);

    btnDownloadReady.on('click', () => {
        if (urlToDownload) {
            window.open(urlToDownload);
        }

        editor.call('picker:publish');
    });

    const refreshButtonsState = function () {
        const selectedScenes = getSelectedScenes();
        const disabled = !inputName.value ||
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

    const createSceneItem = function (scene) {
        const row = new LegacyListItem();
        row.element.id = `picker-scene-${scene.id}`;
        row.sceneId = scene.id;

        container.append(row);

        if (config.scene.id && parseInt(scene.id, 10) === parseInt(config.scene.id, 10)) {
            row.class.add('current');
        }

        if (scene.id === primaryScene) {
            row.class.add('primary');
        }
        // primary scene icon
        const primary = new LegacyButton({
            text: '&#57891'
        });
        primary.class.add('primary');
        row.element.appendChild(primary.element);

        primary.on('click', () => {
            if (!editor.call('permissions:write')) {
                return;
            }

            if (primaryScene === scene.id) {
                return;
            }

            primaryScene = scene.id;
            editor.call('localStorage:set', primarySceneKey, primaryScene);

            // auto select new primary scene
            select.value = true;

            refreshScenes();
        });

        // show tooltip for primary scene icon
        const tooltipText = scene.id === primaryScene ? 'Primary Scene' : 'Set Primary Scene';
        const tooltip = LegacyTooltip.attach({
            target: primary.element,
            text: tooltipText,
            align: 'right',
            root: editor.call('layout.root')
        });
        tooltips.push(tooltip);

        // scene name
        const name = new LegacyLabel({
            text: scene.name
        });
        name.class.add('name');

        row.element.appendChild(name.element);

        // scene date
        const date = new LegacyLabel({
            text: convertDatetime(scene.modified)
        });
        date.class.add('date');
        row.element.appendChild(date.element);

        // selection
        const select = new LegacyCheckbox();
        select.class.add('tick');
        row.element.appendChild(select.element);

        // if selectAll changes then change this too
        events.push(selectAll.on('change', (value) => {
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

    const destroyTooltips = function () {
        tooltips.forEach((tooltip) => {
            tooltip.destroy();
        });
        tooltips = [];
    };

    const destroyEvents = function () {
        events.forEach((evt) => {
            evt.unbind();
        });

        events = [];
    };

    // handle permission changes
    editor.on(`permissions:set:${config.self.id}`, (accessLevel) => {
        if (accessLevel === 'write' || accessLevel === 'admin') {
            panel.class.remove('disabled');
        } else {
            panel.class.add('disabled');
        }
    });

    const sortScenes = function (scenes) {
        scenes.sort((a, b) => {
            if (a.modified < b.modified) {
                return 1;
            }
            if (a.modified > b.modified) {
                return -1;
            }

            return 0;
        });
    };

    const refreshScenes = function () {
        const content = document.querySelector('.ui-panel.right > .content');
        const scrollTop = content.scrollTop;

        const selectedScenes = getSelectedScenes();

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
        scenes.forEach((scene) => {
            const item = createSceneItem(scene);
            if (selectedScenes.indexOf(scene.id) !== -1 || selectedScenes.length === 0 && scene.id === primaryScene) {
                item.select();
            }
        });

        content.scrollTop = scrollTop;
    };

    // on show
    panel.on('show', () => {
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

        let loadedApps = mode !== 'publish';
        let loadedScenes = false;

        editor.call('scenes:list', (items) => {
            loadedScenes = true;

            scenes = items;
            // select primary scene
            if (!primaryScene) {
                primaryScene = editor.call('localStorage:get', primarySceneKey);
            }
            if (!primaryScene && items.length > 0) {
                const currentScene = parseInt(config.scene.id, 10);
                if (items.some(scene => scene.id === currentScene)) {
                    primaryScene = currentScene;
                } else {
                    primaryScene = items[0].id;
                }
            }

            if (loadedApps) {
                refreshScenes();
            }
        });

        if (!loadedApps) {
            editor.api.globals.rest.projects.projectApps().on('load', (status, data) => {
                const apps = data.result;
                loadedApps = true;

                let version = 'e.g. 1.0.0';

                if (apps.length) {
                    apps.sort((a, b) => {
                        if (a.id === config.project.primaryApp) {
                            return -1;
                        }
                        if (b.id === config.project.primaryApp) {
                            return 1;
                        }
                        if (b.modified_at < a.modified_at) {
                            return -1;
                        }
                        if (a.modified_at > b.modified_at) {
                            return 1;
                        }

                        return 0;
                    });

                    if (apps[0].version) {
                        version = `Previous version: ${apps[0].version}`;
                    }
                }

                inputVersion.placeholder = version;

                if (loadedScenes) {
                    refreshScenes();
                }
            });
        }


        inputName.elementInput.focus();

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // on hide
    panel.on('hide', () => {
        scenes = [];
        primaryScene = null;
        imageS3Key = null;
        isUploadingImage = false;
        urlToDownload = null;
        jobInProgress = false;
        destroyTooltips();
        destroyEvents();

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    editor.on('viewport:hover', (state) => {
        if (state && !panel.hidden) {
            setTimeout(() => {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // subscribe to messenger scene.delete
    editor.on('messenger:scene.delete', (data) => {
        if (panel.hidden) {
            return;
        }
        if (data.scene.branchId !== config.self.branch.id) {
            return;
        }

        const sceneId = parseInt(data.scene.id, 10);

        const row = document.getElementById(`picker-scene-${sceneId}`);
        if (row) {
            row.remove();
        }

        for (let i = 0; i < scenes.length; i++) {
            if (parseInt(scenes[i].id, 10) === sceneId) {
                scenes.splice(i, 1);
                break;
            }
        }

        if (!scenes.length) {
            panelScenes.hidden = true;
            panelNoScenes.hidden = false;
            refreshButtonsState();
        }
    });

    // subscribe to messenger scene.new
    editor.on('messenger:scene.new', (data) => {
        if (panel.hidden) {
            return;
        }
        if (data.scene.branchId !== config.self.branch.id) {
            return;
        }

        editor.call('scenes:get', data.scene.id, (err, scene) => {
            if (panel.hidden) {
                return;
            } // check if hidden when Ajax returns

            scenes.push(scene);

            refreshScenes();
        });
    });

});
