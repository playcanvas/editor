import type { EventHandle } from '@playcanvas/observer';
import {
    BooleanInput,
    Button,
    Container,
    Element,
    Label,
    Progress,
    SelectInput,
    TextAreaInput,
    TextInput
} from '@playcanvas/pcui';

import { tooltip, tooltipSimpleItem } from '@/common/tooltips';
import { convertDatetime } from '@/common/utils';
import { config } from '@/editor/config';

const DOWNLOAD_FORMAT_STATIC = 'static';
const DOWNLOAD_FORMAT_WEB_LENS = 'web_lens';
const DOWNLOAD_FORMAT_NPM = 'npm';

editor.once('load', () => {
    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    // holds tooltip targets for cleanup
    let tooltipTargets: Button[] = [];

    // holds events that need to be destroyed
    let events: EventHandle[] = [];

    let containerDownloadOptions: Container | null = null;

    // root container
    const container = new Container({
        flex: true,
        class: 'picker-publish-new'
    });

    // register container with project popup
    editor.call('picker:project:registerPanel', 'publish-download', 'Download New Build', container);
    editor.call('picker:project:registerPanel', 'publish-new', 'Publish New Build', container);

    let mode = 'publish';

    let primaryScene: number | null = null;
    const primarySceneKey = `publish:primaryScene:${config.project.id}:${config.self.branch.id}`;
    const selectedScenesKey = `publish:selectedScenes:${config.project.id}:${config.self.branch.id}`;

    editor.method('picker:publish:new', () => {
        mode = 'publish';
        editor.call('picker:project', 'publish-new');
        container.class.remove('download-mode');
        if (containerDownloadOptions) {
            containerDownloadOptions.hidden = true;
        }
        if (fieldDownloadFormat) {
            fieldDownloadFormat.value = DOWNLOAD_FORMAT_STATIC;
        }
        refreshDownloadFormatOptions();
    });

    editor.method('picker:publish:download', () => {
        mode = 'download';
        editor.call('picker:project', 'publish-download');
        container.class.add('download-mode');
        if (containerDownloadOptions) {
            containerDownloadOptions.hidden = false;
        }
        refreshDownloadFormatOptions();
    });

    // back to builds list
    const back = document.createElement('button');
    back.type = 'button';
    back.classList.add('back');
    back.textContent = 'Back to builds';
    back.addEventListener('click', () => {
        editor.call('picker:builds-publish');
    });
    container.dom.appendChild(back);

    // card-style form section with a heading (matches build detail sections)
    const createFormSection = (className: string, title: string) => {
        const section = new Container({
            class: ['form-section', className]
        });
        const heading = document.createElement('h3');
        heading.textContent = title;
        section.dom.appendChild(heading);
        container.append(section);
        return section;
    };

    const sectionDetails = createFormSection('details', 'Build details');

    // info panel
    const containerInfo = new Container({
        class: 'info'
    });
    sectionDetails.append(containerInfo);

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

    const setAppImage = function (url: string) {
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

        editor.call(
            'images:upload',
            file,
            config.project,
            (data) => {
                imageS3Key = data.s3Key;
                isUploadingImage = false;
                refreshButtonsState();

                setAppImage(data.url);
            },
            (status, data) => {
                // error
                isUploadingImage = false;
                refreshButtonsState();

                clearAppImage();
            }
        );
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

    // Helper to create a text area section with label and error
    const createTextAreaSection = (className: string, labelText: string, maxLength: number, placeholder?: string) => {
        const sectionContainer = new Container({
            class: className
        });
        sectionDetails.append(sectionContainer);

        const label = new Label({
            text: labelText,
            class: 'field-label'
        });
        sectionContainer.append(label);

        const errorLabel = new Label({
            text: `Cannot exceed ${maxLength} characters`,
            class: 'error',
            hidden: true
        });
        sectionContainer.append(errorLabel);

        const input = new TextAreaInput({
            keyChange: true,
            placeholder
        });
        sectionContainer.append(input);

        input.on('change', (value: string) => {
            errorLabel.hidden = value.length <= maxLength;
            refreshButtonsState();
        });

        return input;
    };

    const inputDescription = createTextAreaSection('description', 'Description', 10000);

    // version
    const containerVersion = new Container({
        class: 'version'
    });
    sectionDetails.append(containerVersion);

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

    const inputNotes = createTextAreaSection('notes', 'Release Notes', 10000, "What's changed in this build?");

    const sectionSettings = createFormSection('settings', 'Build settings');

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
        value: editor.call('settings:projectUser').get('editor.launchReleaseCandidate')
            ? 'releaseCandidate'
            : editor.call('settings:session').get('engineVersion'),
        options: ['previous', 'current', 'releaseCandidate']
            .filter((type) => Object.hasOwn(config.engineVersions, type))
            .map((type) => {
                const t = config.engineVersions[type];
                return {
                    t: t.description,
                    v: type
                };
            })
    });
    containerEngineVersion.append(engineVersionDropdown);
    sectionSettings.append(containerEngineVersion);

    let fieldOptionsConcat: BooleanInput | null = null;
    let fieldOptionsMinify: BooleanInput | null = null;
    let fieldOptionsSourcemaps: BooleanInput | null = null;
    let fieldOptionsOptimizeSceneFormat: BooleanInput | null = null;
    let fieldDownloadFormat: SelectInput | null = null;
    let containerBuildOptions: Container | null = null;
    let rowOptionsMinify: Container | null = null;
    let rowOptionsSourcemaps: Container | null = null;
    let optionsBeforeNpmProject: {
        concatenate: boolean;
        minify: boolean;
        sourcemaps: boolean;
        optimizeSceneFormat: boolean;
    } | null = null;
    let refreshingDownloadFormatOptions = false;

    if (!legacyScripts) {
        const containerOptions = new Container({
            class: 'options'
        });
        containerBuildOptions = containerOptions;
        sectionSettings.append(containerOptions);

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

        fieldOptionsConcat = optConcat.input;
        fieldOptionsMinify = optMinify.input;
        fieldOptionsSourcemaps = optSourcemaps.input;
        fieldOptionsOptimizeSceneFormat = optOptimizeFormat.input;
        rowOptionsMinify = optMinify.row;
        rowOptionsSourcemaps = optSourcemaps.row;

        fieldOptionsConcat.on('change', () => {
            refreshDownloadFormatOptions();
        });

        fieldOptionsMinify.on('change', () => {
            refreshDownloadFormatOptions();
        });
    }

    containerDownloadOptions = new Container({
        class: 'options'
    });
    sectionSettings.append(containerDownloadOptions);
    containerDownloadOptions.hidden = true;

    const labelDownloadOptions = new Label({
        text: 'Download Format',
        class: 'field-label'
    });
    containerDownloadOptions.append(labelDownloadOptions);

    const downloadFormatOptions = [
        {
            t: 'Static Website',
            v: DOWNLOAD_FORMAT_STATIC
        },
        {
            t: 'NPM + Vite Project (WIP)',
            v: DOWNLOAD_FORMAT_NPM
        }
    ];

    if (config.self.flags.superUser) {
        downloadFormatOptions.splice(1, 0, {
            t: 'Snapchat Web Lens',
            v: DOWNLOAD_FORMAT_WEB_LENS
        });
    }

    fieldDownloadFormat = new SelectInput({
        class: 'download-format-dropdown',
        value: DOWNLOAD_FORMAT_STATIC,
        options: downloadFormatOptions
    });
    containerDownloadOptions.append(fieldDownloadFormat);

    fieldDownloadFormat.on('change', () => {
        refreshDownloadFormatOptions();
    });

    function refreshDownloadFormatOptions() {
        if (refreshingDownloadFormatOptions) {
            return;
        }

        refreshingDownloadFormatOptions = true;

        const npmProject = fieldDownloadFormat?.value === DOWNLOAD_FORMAT_NPM;
        if (fieldOptionsConcat && fieldOptionsMinify && fieldOptionsSourcemaps && fieldOptionsOptimizeSceneFormat) {
            if (npmProject) {
                if (!optionsBeforeNpmProject) {
                    optionsBeforeNpmProject = {
                        concatenate: fieldOptionsConcat.value,
                        minify: fieldOptionsMinify.value,
                        sourcemaps: fieldOptionsSourcemaps.value,
                        optimizeSceneFormat: fieldOptionsOptimizeSceneFormat.value
                    };
                }

                fieldOptionsConcat.value = false;
                fieldOptionsMinify.value = false;
                fieldOptionsSourcemaps.value = false;
                fieldOptionsOptimizeSceneFormat.value = false;
            } else if (optionsBeforeNpmProject) {
                fieldOptionsConcat.value = optionsBeforeNpmProject.concatenate;
                fieldOptionsMinify.value = optionsBeforeNpmProject.minify;
                fieldOptionsSourcemaps.value = optionsBeforeNpmProject.sourcemaps;
                fieldOptionsOptimizeSceneFormat.value = optionsBeforeNpmProject.optimizeSceneFormat;
                optionsBeforeNpmProject = null;
            }

            fieldOptionsConcat.disabled = npmProject;
            fieldOptionsMinify.disabled = npmProject;
            fieldOptionsSourcemaps.disabled = npmProject;
            fieldOptionsOptimizeSceneFormat.disabled = npmProject;
        }

        if (containerBuildOptions) {
            containerBuildOptions.disabled = npmProject;
            containerBuildOptions.hidden = npmProject;
        }

        if (!npmProject && fieldOptionsConcat && fieldOptionsMinify) {
            if (rowOptionsMinify) {
                rowOptionsMinify.hidden = !fieldOptionsConcat.value;
            }
            if (rowOptionsSourcemaps) {
                rowOptionsSourcemaps.hidden = !fieldOptionsMinify.value || !fieldOptionsConcat.value;
            }
        }

        refreshingDownloadFormatOptions = false;
    }

    // scenes
    const containerScenes = new Container({
        class: 'scenes'
    });
    container.append(containerScenes);

    // header bar attached to the scene list (matches build history header)
    const scenesHeader = new Container({
        class: 'scenes-header'
    });
    containerScenes.append(scenesHeader);

    const labelChooseScenes = new Label({
        text: 'Scenes',
        class: 'field-label'
    });
    scenesHeader.append(labelChooseScenes);

    const selectAllGroup = new Container({
        class: 'select-all-group'
    });
    scenesHeader.append(selectAllGroup);

    const labelSelectAll = new Label({
        text: 'Select all',
        class: 'select-all'
    });
    selectAllGroup.append(labelSelectAll);

    const selectAll = new BooleanInput();
    selectAllGroup.append(selectAll);

    // scenes container
    const sceneList = new Container({
        dom: 'ul',
        class: ['ui-list', 'scene-list']
    });
    containerScenes.append(sceneList);

    const containerNoScenes = new Container({
        class: 'scenes-empty'
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
    let scenes: { id: number | string; name: string; modified: string }[] = [];

    // returns a list of the selected scenes
    // with the primary scene first
    const getSelectedScenes = function () {
        const result = [];

        const listItems = sceneList.innerElement.childNodes as any;
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

    // footer action buttons
    const footer = new Container({
        class: 'form-footer'
    });
    container.append(footer);

    // explains why the action button is disabled
    const footerHint = new Label({
        class: 'footer-hint',
        hidden: true
    });
    footer.append(footerHint);

    // publish button
    const btnPublish = new Button({
        text: 'Publish',
        icon: 'E226',
        class: 'publish'
    });
    footer.append(btnPublish);

    btnPublish.on('click', () => {
        if (jobInProgress) {
            return;
        }

        jobInProgress = true;

        refreshButtonsState();

        const data: Record<string, any> = {
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

            if (fieldOptionsConcat?.value && fieldOptionsMinify.value && fieldOptionsSourcemaps?.value) {
                data.scripts_sourcemaps = true;
            }
        }

        if (fieldOptionsOptimizeSceneFormat) {
            data.optimize_scene_format = fieldOptionsOptimizeSceneFormat.value;
        }

        data.engine_version = config.engineVersions[engineVersionDropdown.value].version;

        editor.api.globals.rest.apps
            .appCreate(data)
            .on('load', () => {
                jobInProgress = false;
                editor.call('picker:builds-publish', { reload: true });
            })
            .on('error', (status) => {
                jobInProgress = false;
                editor.call('status:error', `Error while publishing: ${status}`);
                editor.call('picker:builds-publish');
            });
    });

    // web download button
    const btnWebDownload = new Button({
        text: 'Download',
        icon: 'E245',
        class: 'web-download'
    });
    footer.append(btnWebDownload);

    // download app
    const download = function () {
        jobInProgress = true;

        refreshButtonsState();

        const format = fieldDownloadFormat?.value ?? DOWNLOAD_FORMAT_STATIC;
        const npmProject = format === DOWNLOAD_FORMAT_NPM;

        // post data
        const data: Record<string, any> = {
            name: inputName.value,
            project_id: config.project.id,
            branch_id: config.self.branch.id,
            scenes: getSelectedScenes(),
            scripts_concatenate: !npmProject && !!fieldOptionsConcat?.value,
            scripts_minify: !npmProject && !!fieldOptionsMinify?.value,
            scripts_sourcemaps: !npmProject && !!fieldOptionsMinify?.value && !!fieldOptionsSourcemaps?.value,
            optimize_scene_format: !npmProject && !!fieldOptionsOptimizeSceneFormat?.value,
            format
        };

        data.engine_version = config.engineVersions[engineVersionDropdown.value].version;

        // ajax call
        editor.api.globals.rest.apps
            .appDownload(data)
            .on('load', () => {
                jobInProgress = false;
                editor.call('picker:builds-publish', { reload: true });
            })
            .on('error', (status, error) => {
                jobInProgress = false;

                refreshButtonsState();

                // error
                void log.error`publish error ${status}: ${error}`;
            });
    };

    btnWebDownload.on('click', () => {
        if (jobInProgress) {
            return;
        }

        download();
    });

    const refreshButtonsState = function () {
        const selectedScenes = getSelectedScenes();

        let reason = '';
        if (!inputName.value.length) {
            reason = 'Title is required';
        } else if (inputName.value.length > 1000) {
            reason = 'Title cannot exceed 1000 characters';
        } else if (selectedScenes.length === 0) {
            reason = 'Select at least one scene';
        } else if (inputDescription.value.length > 10000) {
            reason = 'Description is too long';
        } else if (inputNotes.value.length > 10000) {
            reason = 'Release notes are too long';
        } else if (inputVersion.value.length > 20) {
            reason = 'Version cannot exceed 20 characters';
        } else if (isUploadingImage) {
            reason = 'Uploading image…';
        }

        footerHint.text = reason;
        // while scenes are still loading the empty state explains itself
        footerHint.hidden = !reason || !scenes.length;

        const enabled = !reason && !jobInProgress;
        btnPublish.enabled = enabled;
        btnWebDownload.enabled = enabled;
    };

    const createSceneItem = function (scene: any) {
        const row: any = new Container({
            dom: 'li',
            id: `picker-scene-${scene.id}`,
            class: 'ui-list-item'
        });
        const rowText = document.createElement('span');
        row.dom.appendChild(rowText);
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
        const tooltipAnchor = new Element({
            class: 'primary-tooltip-anchor'
        });
        primary.dom.appendChild(tooltipAnchor.dom);
        row.append(primary);

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
            container: tooltipSimpleItem({ text: tooltipText, classNames: ['primary-scene-tooltip'] }),
            target: primary,
            vertAlignEl: tooltipAnchor,
            align: 'right'
        });
        tooltipTargets.push(primary);

        // scene name
        const name = new Label({
            text: scene.name,
            class: 'name'
        });
        row.append(name);

        // scene date
        const date = new Label({
            text: convertDatetime(scene.modified),
            class: 'date'
        });
        row.append(date);

        // selection
        const select = new BooleanInput();
        row.append(select);

        // if selectAll changes then change this too
        events.push(
            selectAll.on('change', (value) => {
                select.value = value;
            })
        );

        // handle checkbox tick
        select.on('change', () => {
            editor.call('localStorage:set', selectedScenesKey, getSelectedScenes());
            refreshButtonsState();
        });

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

    const sortScenes = (sceneList: { modified: string }[]) => {
        sceneList.sort((a, b) => b.modified.localeCompare(a.modified));
    };

    const refreshScenes = function () {
        const content = container.dom.parentElement;
        const scrollTop = content?.scrollTop ?? 0;

        let selectedScenes = getSelectedScenes();

        // restore last persisted selection on fresh open
        if (!selectedScenes.length) {
            const stored = editor.call('localStorage:get', selectedScenesKey);
            if (Array.isArray(stored)) {
                selectedScenes = stored.filter((id) => scenes.some((scene) => scene.id === id));
            }
        }

        destroyTooltips();
        destroyEvents();
        sceneList.clear();
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
            if (selectedScenes.indexOf(scene.id) !== -1 || (selectedScenes.length === 0 && scene.id === primaryScene)) {
                item.select();
            }
        });

        if (content) {
            content.scrollTop = scrollTop;
        }
    };

    // on show
    container.on('show', () => {
        containerNoScenes.hidden = false;
        labelNoScenes.hidden = true;
        loadingScenes.hidden = false;
        progressBar.hidden = false;
        sceneList.clear();
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
                if (items.some((scene) => scene.id === currentScene)) {
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
