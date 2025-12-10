import type { EventHandle } from '@playcanvas/observer';
import { BooleanInput, Button, Container, Label, Progress, SelectInput, TextAreaInput, TextInput } from '@playcanvas/pcui';

import { tooltip, tooltipSimpleItem } from '@/common/tooltips';
import { LegacyList } from '@/common/ui/list';
import { LegacyListItem } from '@/common/ui/list-item';
import { convertDatetime } from '@/common/utils';

editor.once('load', () => {
    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    // holds tooltip targets for cleanup
    let tooltipTargets: Button[] = [];

    // holds events that need to be destroyed
    let events: EventHandle[] = [];

    let containerOptionsWebLens: Container | null = null;

    // root container
    const container = new Container({
        class: 'picker-publish-new'
    });

    // register container with project popup
    editor.call('picker:project:registerPanel', 'publish-download', 'Download New Build', container);
    editor.call('picker:project:registerPanel', 'publish-new', 'Publish New Build', container);

    let mode = 'publish';

    let primaryScene: number | null = null;
    const primarySceneKey = `publish:primaryScene:${config.project.id}:${config.self.branch.id}`;

    editor.method('picker:publish:new', () => {
        mode = 'publish';
        editor.call('picker:project', 'publish-new');
        container.class.remove('download-mode');
        containerOptionsWebLens.hidden = true;
    });

    editor.method('picker:publish:download', () => {
        mode = 'download';
        editor.call('picker:project', 'publish-download');
        container.class.add('download-mode');
        if (config.self.flags.superUser) {
            containerOptionsWebLens.hidden = false;
        }
    });

    // info panel
    const containerInfo = new Container({
        class: 'info'
    });
    container.append(containerInfo);

    // image
    const imageField = document.createElement('div');
    imageField.classList.add('image');
    containerInfo.append(imageField);

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

    let imageS3Key: string | null = null;
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
    containerInfo.append(group);

    // name
    const labelTitle = new Label({
        text: 'Title',
        class: 'field-label'
    });
    group.appendChild(labelTitle.dom);

    const inputNameError = new Label({
        text: 'Cannot exceed 1000 characters',
        class: 'error',
        hidden: true
    });
    group.appendChild(inputNameError.dom);

    const inputName = new TextInput({
        renderChanges: false,
        placeholder: 'Required',
        class: ['name', 'input-field']
    });
    group.appendChild(inputName.dom);

    inputName.on('change', (value: string) => {
        inputNameError.hidden = value.length <= 1000;
        refreshButtonsState();
    });

    const labelImageClick = new Label({
        text: 'Click on the image to upload artwork. 720 x 720px',
        class: 'image-click'
    });
    group.appendChild(labelImageClick.dom);

    // description
    const containerDescription = new Container({
        class: 'description'
    });
    container.append(containerDescription);

    const labelDescription = new Label({
        text: 'Description',
        class: 'field-label'
    });
    containerDescription.append(labelDescription);

    const inputDescError = new Label({
        text: 'Cannot exceed 10000 characters',
        class: 'error',
        hidden: true
    });
    containerDescription.append(inputDescError);

    const inputDescription = new TextAreaInput({
        keyChange: true
    });
    inputDescription.on('change', (value: string) => {
        inputDescError.hidden = value.length < 10000;
        refreshButtonsState();
    });
    containerDescription.append(inputDescription);

    // version
    const containerVersion = new Container({
        class: 'version'
    });
    container.append(containerVersion);

    const labelVersion = new Label({
        text: 'Version',
        class: 'field-label'
    });
    containerVersion.append(labelVersion);

    const inputVersionError = new Label({
        text: 'Cannot exceed 20 characters',
        class: 'error',
        hidden: true
    });
    containerVersion.append(inputVersionError);

    const inputVersion = new TextInput({
        renderChanges: false,
        class: 'input-field',
        placeholder: 'e.g. 1.0.0'
    });
    containerVersion.append(inputVersion);

    inputVersion.on('change', (value: string) => {
        inputVersionError.hidden = value.length <= 20;
        refreshButtonsState();
    });

    // release notes
    const containerNotes = new Container({
        class: 'notes'
    });
    container.append(containerNotes);

    const labelNotes = new Label({
        text: 'Release Notes',
        class: 'field-label'
    });
    containerNotes.append(labelNotes);

    const inputNotesError = new Label({
        text: 'Cannot exceed 10000 characters',
        class: 'error',
        hidden: true
    });
    containerNotes.append(inputNotesError);

    const inputNotes = new TextAreaInput({
        keyChange: true
    });
    containerNotes.append(inputNotes);
    inputNotes.on('change', (value: string) => {
        inputNotesError.hidden = value.length <= 10000;
        refreshButtonsState();
    });

    // engine version
    const containerEngineVersion = new Container({
        class: 'engine-version'
    });
    const labelEngineVersion = new Label({
        text: 'Engine Version',
        class: 'field-label'
    });
    containerEngineVersion.append(labelEngineVersion);

    const engineVersionDropdown = new SelectInput({
        class: 'engine-version-dropdown',
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
    containerEngineVersion.append(engineVersionDropdown);
    container.append(containerEngineVersion);

    let fieldOptionsConcat: BooleanInput;
    let fieldOptionsMinify: BooleanInput;
    let fieldOptionsSourcemaps: BooleanInput;
    let fieldOptionsOptimizeSceneFormat: BooleanInput;
    let fieldOptionsWebLens: BooleanInput;

    if (!legacyScripts) {
        const containerOptions = new Container({
            class: 'options'
        });
        container.append(containerOptions);

        const labelOptions = new Label({
            text: 'Options',
            class: 'field-label'
        });
        containerOptions.append(labelOptions);

        // Helper to create an option row with checkbox and label
        const createOption = (text: string, value: boolean) => {
            const row = new Container({
                class: 'field'
            });
            containerOptions.append(row);

            const input = new BooleanInput({
                value
            });
            row.append(input);

            const label = new Label({
                text
            });
            row.append(label);

            return { row, input };
        };

        const optConcat = createOption('Concatenate Scripts', true);
        const optMinify = createOption('Minify Scripts', true);
        const optSourcemaps = createOption('Generate Source Maps', false);
        const optOptimizeFormat = createOption('Optimize Scene Format', false);
        const optWebLens = createOption('Export to WebLens Format', false);

        fieldOptionsConcat = optConcat.input;
        fieldOptionsMinify = optMinify.input;
        fieldOptionsSourcemaps = optSourcemaps.input;
        fieldOptionsOptimizeSceneFormat = optOptimizeFormat.input;
        fieldOptionsWebLens = optWebLens.input;

        containerOptionsWebLens = optWebLens.row;
        containerOptionsWebLens.hidden = true;

        fieldOptionsConcat.on('change', (value: boolean) => {
            optMinify.row.hidden = !value;
            optSourcemaps.row.hidden = !fieldOptionsMinify.value || !value;
        });

        fieldOptionsMinify.on('change', (value: boolean) => {
            optSourcemaps.row.hidden = !value;
        });
    }

    // scenes
    const containerScenes = new Container({
        class: 'scenes'
    });
    container.append(containerScenes);

    const labelChooseScenes = new Label({
        text: 'Choose Scenes',
        class: 'field-label'
    });
    containerScenes.append(labelChooseScenes);

    const selectAll = new BooleanInput();
    containerScenes.append(selectAll);

    const labelSelectAll = new Label({
        text: 'Select all',
        class: 'select-all'
    });
    containerScenes.append(labelSelectAll);

    // scenes container
    const sceneList = new LegacyList();
    sceneList.class.add('scene-list');
    containerScenes.append(sceneList);

    const containerNoScenes = new Container({
        class: 'scenes'
    });
    container.append(containerNoScenes);

    // no scenes msg
    const labelNoScenes = new Label({
        text: 'There are no scenes.',
        class: 'error',
        hidden: true
    });
    containerNoScenes.append(labelNoScenes);

    // loading scenes
    const loadingScenes = new Label({
        text: 'Loading scenes...'
    });
    containerNoScenes.append(loadingScenes);

    const progressBar = new Progress({
        value: 100
    });
    containerNoScenes.append(progressBar);

    // holds all scenes
    let scenes: { id: number | string, name: string, modified: string }[] = [];

    // returns a list of the selected scenes
    // with the primary scene first
    const getSelectedScenes = function () {
        const result = [];

        const listItems = sceneList.innerElement.childNodes;
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
    const btnPublish = new Button({
        text: 'Publish Now',
        class: 'publish'
    });
    container.append(btnPublish);

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
    const btnWebDownload = new Button({
        text: 'Download',
        class: 'web-download'
    });
    container.append(btnWebDownload);

    let urlToDownload: string | null = null;

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
    container.append(panelDownloadProgress);

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

    const downloadProgressTitle = new Label({
        text: 'Preparing build',
        class: 'progress-title'
    });
    downloadProgressInfo.appendChild(downloadProgressTitle.dom);

    const btnDownloadReady = new Button({
        text: 'Download',
        class: 'ready'
    });
    downloadProgressInfo.appendChild(btnDownloadReady.dom);

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

        sceneList.append(row);

        if (config.scene.id && parseInt(scene.id, 10) === parseInt(config.scene.id, 10)) {
            row.class.add('current');
        }

        if (scene.id === primaryScene) {
            row.class.add('primary');
        }
        // primary scene icon
        const primary = new Button({
            text: '\uE223',
            class: 'primary'
        });
        row.element.appendChild(primary.dom);

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
        tooltip().attach({
            container: tooltipSimpleItem({ text: tooltipText }),
            target: primary,
            align: 'right'
        });
        tooltipTargets.push(primary);

        // scene name
        const name = new Label({
            text: scene.name,
            class: 'name'
        });
        row.element.appendChild(name.dom);

        // scene date
        const date = new Label({
            text: convertDatetime(scene.modified),
            class: 'date'
        });
        row.element.appendChild(date.dom);

        // selection
        const select = new BooleanInput();
        row.element.appendChild(select.dom);

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
        tooltipTargets.forEach((target) => {
            tooltip().detach(target);
        });
        tooltipTargets = [];
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
            container.class.remove('disabled');
        } else {
            container.class.add('disabled');
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
        sceneList.element.innerHTML = '';
        sortScenes(scenes);
        containerScenes.hidden = !scenes.length;
        containerNoScenes.hidden = !containerScenes.hidden;
        labelNoScenes.hidden = scenes.length > 0;
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
    container.on('show', () => {
        panelDownloadProgress.hidden = true;
        containerNoScenes.hidden = false;
        labelNoScenes.hidden = true;
        loadingScenes.hidden = false;
        progressBar.hidden = false;
        sceneList.element.innerHTML = '';
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

        inputName.focus();

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // on hide
    container.on('hide', () => {
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
        if (state && !container.hidden) {
            setTimeout(() => {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // subscribe to messenger scene.delete
    editor.on('messenger:scene.delete', (data) => {
        if (container.hidden) {
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
            if (parseInt(String(scenes[i].id), 10) === sceneId) {
                scenes.splice(i, 1);
                break;
            }
        }

        if (!scenes.length) {
            containerScenes.hidden = true;
            containerNoScenes.hidden = false;
            refreshButtonsState();
        }
    });

    // subscribe to messenger scene.new
    editor.on('messenger:scene.new', (data) => {
        if (container.hidden) {
            return;
        }
        if (data.scene.branchId !== config.self.branch.id) {
            return;
        }

        editor.call('scenes:get', data.scene.id, (err, scene) => {
            if (container.hidden) {
                return;
            } // check if hidden when Ajax returns

            scenes.push(scene);

            refreshScenes();
        });
    });

});
