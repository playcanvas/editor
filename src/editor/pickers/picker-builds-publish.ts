import { Container, Label, Progress, Button } from '@playcanvas/pcui';

import { LegacyList } from '@/common/ui/list';
import { LegacyListItem } from '@/common/ui/list-item';
import { LegacyMenu } from '@/common/ui/menu';
import { LegacyTooltip } from '@/common/ui/tooltip';
import { bytesToHuman, convertDatetime } from '@/common/utils';

const APP_LIMIT = 16;

editor.once('load', () => {
    // global variables
    const projectSettings = editor.call('settings:project');
    let dropdownApp = null;  // app whose dropdown was last clicked
    let apps = [];  // all loaded builds
    let tooltips = [];  // holds all tooltips
    let events = [];  // holds events that need to be destroyed

    // disables / enables field depending on permissions
    const handlePermissions = function (field: { disabled: boolean }) {
        field.disabled = !editor.call('permissions:write');
        return editor.on(`permissions:set:${config.self.id}`, (accessLevel) => {
            if (accessLevel === 'write' || accessLevel === 'admin') {
                field.disabled = false;
            } else {
                field.disabled = true;
            }
        });
    };

    // collapses publish and download buttons
    const toggleCollapsingPublishButtons = (collapse = true) => {
        if (collapse) {
            labelDownloadIcon.dom.style.display = 'none';
            labelDownloadDesc.dom.style.display = 'none';
            labelPublishDesc.dom.style.display = 'none';
            labelPublishIcon.dom.style.display = 'none';

            btnPublish.dom.classList.add('collapsed');
            btnDownload.dom.classList.add('collapsed');

            panelPlaycanvas.dom.classList.add('collapsed');
            panelSelfHost.dom.classList.add('collapsed');
        } else {
            labelDownloadIcon.dom.style.display = 'block';
            labelDownloadDesc.dom.style.display = 'block';
            labelPublishDesc.dom.style.display = 'block';
            labelPublishIcon.dom.style.display = 'block';

            btnPublish.dom.classList.remove('collapsed');
            btnDownload.dom.classList.remove('collapsed');

            panelPlaycanvas.dom.classList.remove('collapsed');
            panelSelfHost.dom.classList.remove('collapsed');
        }
    };

    // main panel
    const panel = new Container({
        flex: true,
        class: 'picker-builds-publish'
    });
    // panel.class.add('picker-builds-publish');

    // progress bar and loading label
    const loading = new Label({
        text: 'Loading...'
    });
    panel.append(loading);

    const progressBar = new Progress({ progress: 1 });
    progressBar.hidden = true;
    panel.append(progressBar);

    // published build section
    const publishedBuild = new Label({
        text: `Your primary build is available at <a href="${config.project.playUrl}" target="_blank">${config.project.playUrl}</a>.`,
        unsafe: true
    });
    publishedBuild.class.add('build');
    panel.append(publishedBuild);

    // publish buttons container
    const publishButtons = new Container({
        flex: true,
        class: 'publish-buttons-container'
    });
    panel.append(publishButtons);

    // playcanv.as
    const panelPlaycanvas = new Container({
        flex: true,
        class: 'buttons'
    });
    publishButtons.append(panelPlaycanvas);

    const labelPublishIcon = new Label({
        text: '&#57960;',
        unsafe: true,
        class: 'icon'
    });
    panelPlaycanvas.append(labelPublishIcon);

    const labelPublishDesc = new Label({
        text: 'Publish your project publicly on PlayCanvas.',
        class: 'desc'
    });
    panelPlaycanvas.append(labelPublishDesc);

    // publish button
    const btnPublish = new Button({
        text: 'Publish To PlayCanvas',
        class: 'publish'
    });
    handlePermissions(btnPublish);
    panelPlaycanvas.append(btnPublish);

    handlePermissions(panelPlaycanvas);
    panelPlaycanvas.on('click', () => {
        editor.call('picker:publish:new');
    });

    // self host
    const panelSelfHost = new Container({
        flex: true,
        class: 'buttons'
    });
    publishButtons.append(panelSelfHost);

    const labelDownloadIcon = new Label({
        text: '&#57925;',
        class: 'icon',
        unsafe: true
    });
    panelSelfHost.append(labelDownloadIcon);

    const labelDownloadDesc = new Label({
        text: 'Download build and host it on your own server.',
        class: 'desc'
    });
    panelSelfHost.append(labelDownloadDesc);

    // download button
    const btnDownload = new Button({
        text: 'Download .zip',
        class: 'download'
    });
    handlePermissions(btnDownload);
    panelSelfHost.append(btnDownload);

    handlePermissions(panelSelfHost);
    panelSelfHost.on('click', () => {
        editor.call('picker:publish:download');
    });

    // Existing builds label
    const existingBuildsLabel = new Label({
        text: 'Existing builds',
        class: 'builds-list-heading'
    });
    panel.append(existingBuildsLabel);

    // no builds message
    let noBuildsText = 'You have not published any builds.';
    if (!projectSettings.get('useLegacyScripts')) {
        noBuildsText += ' Click PUBLISH to create a new build.';
    }

    const noBuilds = new Label({
        text: noBuildsText,
        class: 'no-builds-label',
        hidden: true
    });
    panel.append(noBuilds);

    // container for builds
    const container = new LegacyList();
    panel.append(container);

    // load more builds button
    const loadMore = new Button({
        text: 'Load More',
        class: 'load-more'
    });
    panel.append(loadMore);
    handlePermissions(loadMore);
    let skip = 0;
    loadMore.on('click', () => {
        editor.api.globals.rest.projects.projectApps(APP_LIMIT, skip += APP_LIMIT).on('load', (status, data) => {
            const results = data.result;
            if (results.length === 0) {
                loadMore.hidden = true;
                return;
            }
            apps.push(...results);
            results.forEach(createAppItem);
        });
    });

    const dropdownMenu = LegacyMenu.fromData({
        'app-delete': {
            title: 'Delete',
            filter: function () {
                return editor.call('permissions:write');
            },
            select: function () {
                editor.call('picker:confirm', 'Are you sure you want to delete this build?');
                editor.once('picker:confirm:yes', () => {
                    removeApp(dropdownApp);
                    editor.api.globals.rest.apps.appDelete(dropdownApp.id);
                });
            }
        }
    });

    // add menu
    editor.call('layout.root').append(dropdownMenu);

    // on closing menu remove 'clicked' class from respective dropdown
    dropdownMenu.on('open', (open) => {
        if (!open && dropdownApp) {
            const item = document.getElementById(`app-${dropdownApp.id}`);
            if (item) {
                const clicked = item.querySelector('.clicked');
                if (clicked) {
                    clicked.innerHTML = '&#57689;';
                    clicked.classList.remove('clicked');
                }
            }
        }
    });

    // register panel with project popup
    editor.call('picker:project:registerMenu', 'builds-publish', 'Builds', panel, 'BUILDS & PUBLISH');

    // hide button if the user doesn't have the right permissions
    if (!editor.call('permissions:read')) {
        editor.call('picker:project:toggleMenu', 'builds-publish', false);
    }

    // if the user permissions change, then change the visibilty of the button
    editor.on('permissions:set', () => {
        editor.call('picker:project:toggleMenu', 'builds-publish', editor.call('permissions:read'));
    });

    // UI

    const toggleProgress = function (toggle: boolean) {
        loading.hidden = !toggle;
        progressBar.hidden = !toggle;
        container.hidden = toggle || apps.length === 0;
        publishedBuild.hidden = toggle || !config.project.primaryApp;
        noBuilds.hidden = toggle || apps.length > 0;
    };

    // create UI for single app
    const createAppItem = function (app: Record<string, unknown>) {
        const item = new LegacyListItem();
        item.element.id = `app-${app.id}`;

        container.append(item);

        if (config.project.primaryApp === app.id) {
            item.class.add('primary');
        }

        item.class.add(app.task.status);

        // primary app button
        const primary = new Button({
            icon: 'E223',
            class: 'primary'
        });
        events.push(handlePermissions(primary));
        if (!primary.disabled && app.task.status !== 'complete') {
            primary.disabled = true;
        }
        item.element.appendChild(primary.element);

        // set primary app
        events.push(primary.on('click', () => {
            if (config.project.primaryApp === app.id || app.task.status !== 'complete') {
                return;
            }

            editor.call('projects:setPrimaryApp', app.id, null, () => {
                // error - refresh apps again to go back to previous state
                refreshApps();
            });

            // refresh apps instantly
            refreshApps();

            // collapse publish and download buttons
            toggleCollapsingPublishButtons(true);
        }));

        // primary icon tooltip
        const tooltipText = config.project.primaryApp === app.id ? 'Primary build' : 'Change the projects\'s primary build';
        const tooltip = LegacyTooltip.attach({
            target: primary.element,
            text: tooltipText,
            align: 'right',
            root: editor.call('layout.root')
        });
        tooltips.push(tooltip);

        // status icon or image
        const status = document.createElement('span');
        status.classList.add('status');
        item.element.appendChild(status);

        let img;

        if (app.task.status === 'complete') {
            img = new Image();
            img.src = app.thumbnails ? app.thumbnails.s : (config.project.thumbnails.s || `${config.url.static}/platform/images/common/blank_project.png`);
            status.appendChild(img);
        } else if (app.task.status === 'running') {
            img = new Image();
            img.src = `${config.url.static}/platform/images/common/ajax-loader.gif`;
            status.appendChild(img);
        }

        const nameRow = document.createElement('div');
        nameRow.classList.add('name-row');
        item.element.appendChild(nameRow);

        // app name
        const name = new Label({
            text: app.name,
            class: 'name'
        });
        nameRow.appendChild(name.element);

        // app version
        const version = new Label({
            text: app.version,
            class: 'version'
        });
        nameRow.appendChild(version.element);

        // row below name
        const info = document.createElement('div');
        info.classList.add('info');
        item.element.appendChild(info);

        // date
        const date = new Label({
            text: convertDatetime(app.created_at),
            class: 'date',
            hidden: app.task.status === 'error'
        });
        info.appendChild(date.element);

        // views
        const views = new Label({
            text: numberWithCommas(app.views),
            class: 'views',
            hidden: app.task.status !== 'complete'
        });
        info.appendChild(views.element);

        // size
        const size = new Label({
            text: bytesToHuman(app.size),
            class: 'size',
            hidden: app.task.status !== 'complete'
        });
        info.appendChild(size.element);

        // branch
        const branch = new Label({
            text: app.branch && app.branch.name || 'main',
            class: 'branch',
            hidden: app.task.status !== 'complete' || projectSettings.get('useLegacyScripts')
        });
        info.appendChild(branch.element);

        // error message
        const error = new Label({
            text: app.task.message,
            class: 'error',
            hidden: app.task.status !== 'error'
        });
        item.element.appendChild(error.element);

        // release notes
        let releaseNotes = app.release_notes || '';
        const indexOfNewLine = releaseNotes.indexOf('\n');
        if (indexOfNewLine !== -1) {
            releaseNotes = releaseNotes.substring(0, indexOfNewLine);
        }
        const notes = new Label({
            text: app.release_notes,
            class: 'notes',
            hidden: !error.hidden,
            renderChanges: false
        });
        item.element.appendChild(notes.element);

        // dropdown
        const dropdown = new Button({
            class: 'dropdown'
        });
        dropdown.element.innerHTML = '&#57689;';
        item.element.appendChild(dropdown.element);

        events.push(dropdown.on('click', () => {
            dropdown.class.add('clicked');
            // change arrow
            dropdown.element.innerHTML = '&#57687;';
            dropdownApp = app;

            // open menu
            dropdownMenu.open = true;

            // position dropdown menu
            const rect = dropdown.element.getBoundingClientRect();
            dropdownMenu.position(rect.right - dropdownMenu.innerElement.clientWidth, rect.bottom);
        }));

        const more = new Button({
            text: 'more...',
            class: 'more',
            hidden: true
        });
        item.element.appendChild(more.element);

        events.push(more.on('click', () => {
            if (notes.class.contains('no-wrap')) {
                notes.text = app.release_notes;
                notes.class.remove('no-wrap');
                more.text = 'less...';
            } else {
                notes.class.add('no-wrap');
                more.text = 'more...';
                notes.text = releaseNotes;
            }
        }));

        if (notes.element.clientHeight > 22) {
            more.hidden = false;
            notes.class.add('no-wrap');
            notes.text = releaseNotes;
        }

        if (app.task.status === 'complete') {
            // handle row click
            const validTargets = [
                status,
                img,
                info,
                item.element,
                name.element,
                date.element,
                size.element,
                views.element,
                notes.element
            ];

            events.push(item.on('click', (e) => {
                if (validTargets.indexOf(e.target) !== -1) {
                    e.stopPropagation();
                    window.open(app.url);
                }
            }));
        }


        return item;
    };

    // CONTROLLERS

    // load app list
    const loadApps = function () {
        toggleProgress(true);

        editor.api.globals.rest.projects.projectApps().on('load', (status, data) => {
            const results = data.result;
            apps = results;
            toggleProgress(false);

            if (apps.length > 0) {
                panelPlaycanvas.element.classList.add('collapsed');
                panelSelfHost.element.classList.add('collapsed');
            }

            toggleCollapsingPublishButtons(apps.length > 0);

            refreshApps();
        });
    };

    // removes an app from the UI
    const removeApp = function (app: { id: string }) {
        const item = document.getElementById(`app-${app.id}`);
        if (item) {
            item.remove();
        }

        // remove from apps array
        for (let i = 0; i < apps.length; i++) {
            if (apps[i].id === app.id) {
                // close dropdown menu if current app deleted
                if (dropdownApp === apps[i]) {
                    dropdownMenu.open = false;
                }

                apps.splice(i, 1);
                break;
            }
        }

        container.hidden = apps.length === 0;
    };

    // recreate app list UI
    const refreshApps = function () {
        dropdownMenu.open = false;
        destroyTooltips();
        destroyEvents();
        container.element.innerHTML = '';
        hoistPrimaryBuild(apps);
        container.hidden = apps.length === 0;
        loadMore.hidden = apps.length === 0;
        apps.forEach(createAppItem);
    };

    // LOCAL UTILS

    // hoists primary app to the top of the list
    const hoistPrimaryBuild = function (apps: { id: string }[]) {
        return apps.sort((a, b) => {
            if (config.project.primaryApp === a.id) {
                return -1;
            }
            if (config.project.primaryApp === b.id) {
                return 1;
            }
            return 0;
        });
    };

    // adds commas every 3 decimals
    const numberWithCommas = function (number: number) {
        const parts = number.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, ',');
        return parts.join('.');
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

    // EVENTS

    // handle external updates to primary app
    editor.on('projects:primaryApp', (newValue, oldValue) => {
        if (panel.hidden) {
            return;
        }

        if (!newValue) {
            publishedBuild.hidden = true;
            return;
        }

        publishedBuild.hidden = false;

        // check if we need to refresh UI
        const currentPrimary = document.getElementById(`app-${newValue}`);
        if (currentPrimary && currentPrimary.classList.contains('primary')) {
            return;
        }

        refreshApps();
    });

    // handle app created externally
    editor.on('messenger:app.new', (data) => {
        if (panel.hidden) {
            return;
        }

        // get app from server
        editor.api.globals.rest.apps.appGet(data.app.id).on('load', (status, app) => {
            // add app if it's not already inside the apps array
            let found = false;
            for (let i = 0; i < apps.length; i++) {
                if (apps[i].id === data.app.id) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                apps.push(app);
                refreshApps();
            }
        });
    });

    // handle external delete
    editor.on('messenger:app.delete', (data) => {
        if (panel.hidden) {
            return;
        }

        removeApp(data.app);
    });

    // handle external app updates
    editor.on('messenger:app.update', (data) => {
        if (panel.hidden) {
            return;
        }

        // get app from server
        editor.api.globals.rest.apps.appGet(data.app.id).on('load', (status, app) => {
            for (let i = 0; i < apps.length; i++) {
                if (apps[i].id === app.id) {
                    apps[i] = app;
                }
            }
            refreshApps();
        });
    });

    // open publishing popup
    editor.method('picker:builds-publish', () => {
        editor.call('picker:project', 'builds-publish');
    });

    // on show
    panel.on('show', () => {
        loadApps();

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // on hide
    panel.on('hide', () => {
        apps = [];
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
});
