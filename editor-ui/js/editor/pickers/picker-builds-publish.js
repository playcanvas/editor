editor.once('load', function () {
    'use strict';

    // global variables
    const projectSettings = editor.call('settings:project');
    let dropdownApp = null;  // app whose dropdown was last clicked
    let apps = [];  // all loaded builds
    let tooltips = [];  // holds all tooltips
    let events = [];  // holds events that need to be destroyed

    // disables / enables field depending on permissions
    const handlePermissions = function (field) {
        field.disabled = !editor.call('permissions:write');
        return editor.on('permissions:set:' + config.self.id, function (accessLevel) {
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
    const panel = new pcui.Container({
        flex: true,
        class: 'picker-builds-publish'
    });
    // panel.class.add('picker-builds-publish');

    // progress bar and loading label
    const loading = new pcui.Label({
        text: 'Loading...'
    });
    panel.append(loading);

    const progressBar = new pcui.Progress({ progress: 1 });
    progressBar.hidden = true;
    panel.append(progressBar);

    // published build section
    const publishedBuild = new pcui.Label({
        text: 'Your primary build is available at <a href="' + config.project.playUrl + '" target="_blank">' + config.project.playUrl + '</a>.',
        unsafe: true
    });
    publishedBuild.class.add('build');
    panel.append(publishedBuild);

    // publish buttons container
    const publishButtons = new pcui.Container({
        flex: true,
        class: 'publish-buttons-container'
    });
    panel.append(publishButtons);

    // playcanv.as
    const panelPlaycanvas = new pcui.Container({
        flex: true,
        class: 'buttons'
    });
    publishButtons.append(panelPlaycanvas);

    const labelPublishIcon = new pcui.Label({
        text: '&#57960;',
        unsafe: true,
        class: 'icon'
    });
    panelPlaycanvas.append(labelPublishIcon);

    const labelPublishDesc = new pcui.Label({
        text: 'Publish your project publicly on PlayCanvas.',
        class: 'desc'
    });
    panelPlaycanvas.append(labelPublishDesc);

    // publish button
    const btnPublish = new pcui.Button({
        text: 'Publish To PlayCanvas',
        class: 'publish'
    });
    handlePermissions(btnPublish);
    panelPlaycanvas.append(btnPublish);

    handlePermissions(panelPlaycanvas);
    panelPlaycanvas.on('click', function () {
        editor.call('picker:publish:new');
    });

    // self host
    const panelSelfHost = new pcui.Container({
        flex: true,
        class: 'buttons'
    });
    publishButtons.append(panelSelfHost);

    const labelDownloadIcon = new pcui.Label({
        text: '&#57925;',
        class: 'icon',
        unsafe: true
    });
    panelSelfHost.append(labelDownloadIcon);

    const labelDownloadDesc = new pcui.Label({
        text: 'Download build and host it on your own server.',
        class: 'desc'
    });
    panelSelfHost.append(labelDownloadDesc);

    // download button
    const btnDownload = new pcui.Button({
        text: 'Download .zip',
        class: 'download'
    });
    handlePermissions(btnDownload);
    panelSelfHost.append(btnDownload);

    handlePermissions(panelSelfHost);
    panelSelfHost.on('click', function () {
        editor.call('picker:publish:download');
    });

    // Existing builds label
    const existingBuildsLabel = new pcui.Label({
        text: 'Existing builds',
        class: 'builds-list-heading'
    });
    panel.append(existingBuildsLabel);

    // no builds message
    let noBuildsText = 'You have not published any builds.';
    if (!projectSettings.get('useLegacyScripts')) {
        noBuildsText += ' Click PUBLISH to create a new build.';
    }

    const noBuilds = new pcui.Label({
        text: noBuildsText,
        class: 'no-builds-label',
        hidden: true
    });
    panel.append(noBuilds);

    // container for builds
    const container = new ui.List();
    panel.append(container);

    const dropdownMenu = ui.Menu.fromData({
        'app-delete': {
            title: 'Delete',
            filter: function () {
                return editor.call('permissions:write');
            },
            select: function () {
                editor.call('picker:confirm', 'Are you sure you want to delete this Build?');
                editor.once('picker:confirm:yes', function () {
                    removeApp(dropdownApp);
                    editor.call('apps:delete', dropdownApp.id);
                });
            }
        }
    });

    // add menu
    editor.call('layout.root').append(dropdownMenu);

    // on closing menu remove 'clicked' class from respective dropdown
    dropdownMenu.on('open', function (open) {
        if (!open && dropdownApp) {
            const item = document.getElementById('app-' + dropdownApp.id);
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
    editor.on('permissions:set', function () {
        editor.call('picker:project:toggleMenu', 'builds-publish', editor.call('permissions:read'));
    });

    // UI

    const toggleProgress = function (toggle) {
        loading.hidden = !toggle;
        progressBar.hidden = !toggle;
        container.hidden = toggle || apps.length === 0;
        publishedBuild.hidden = toggle || !config.project.primaryApp;
        noBuilds.hidden = toggle || apps.length > 0;
    };

    // create UI for single app
    const createAppItem = function (app) {
        const item = new ui.ListItem();
        item.element.id = 'app-' + app.id;

        container.append(item);

        if (config.project.primaryApp === app.id) {
            item.class.add('primary');
        }

        item.class.add(app.task.status);

        // primary app button
        const primary = new pcui.Button({
            icon: 'E223',
            class: 'primary'
        });
        events.push(handlePermissions(primary));
        if (!primary.disabled && app.task.status !== 'complete')
            primary.disabled = true;
        item.element.appendChild(primary.element);

        // set primary app
        events.push(primary.on('click', function () {
            if (config.project.primaryApp === app.id || app.task.status !== 'complete')
                return;

            editor.call('projects:setPrimaryApp', app.id, null, function () {
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
        const tooltip = Tooltip.attach({
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
            img.src = app.thumbnails ? app.thumbnails.s : (config.project.thumbnails.s || config.url.static + '/platform/images/common/blank_project.png');
            status.appendChild(img);
        } else if (app.task.status === 'running') {
            img = new Image();
            img.src = config.url.static + "/platform/images/common/ajax-loader.gif";
            status.appendChild(img);
        }

        const nameRow = document.createElement('div');
        nameRow.classList.add('name-row');
        item.element.appendChild(nameRow);

        // app name
        const name = new pcui.Label({
            text: app.name,
            class: 'name'
        });
        nameRow.appendChild(name.element);

        // app version
        const version = new pcui.Label({
            text: app.version,
            class: 'version'
        });
        nameRow.appendChild(version.element);

        // row below name
        const info = document.createElement('div');
        info.classList.add('info');
        item.element.appendChild(info);

        // date
        const date = new pcui.Label({
            text: editor.call('datetime:convert', app.created_at),
            class: 'date',
            hidden: app.task.status === 'error'
        });
        info.appendChild(date.element);

        // views
        const views = new pcui.Label({
            text: numberWithCommas(app.views),
            class: 'views',
            hidden: app.task.status !== 'complete'
        });
        info.appendChild(views.element);

        // size
        const size = new pcui.Label({
            text: sizeToString(app.size),
            class: 'size',
            hidden: app.task.status !== 'complete'
        });
        info.appendChild(size.element);

        // branch
        const branch = new pcui.Label({
            text: app.branch && app.branch.name || 'main',
            class: 'branch',
            hidden: app.task.status !== 'complete' || projectSettings.get('useLegacyScripts')
        });
        info.appendChild(branch.element);

        // error message
        const error = new pcui.Label({
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
        const notes = new pcui.Label({
            text: app.release_notes,
            class: 'notes',
            hidden: !error.hidden,
            renderChanges: false
        });
        item.element.appendChild(notes.element);

        // dropdown
        const dropdown = new pcui.Button({
            class: 'dropdown'
        });
        dropdown.element.innerHTML = '&#57689;';
        item.element.appendChild(dropdown.element);

        events.push(dropdown.on('click', function () {
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

        const more = new pcui.Button({
            text: 'more...',
            class: 'more',
            hidden: true
        });
        item.element.appendChild(more.element);

        events.push(more.on('click', function () {
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

            events.push(item.on('click', function (e) {
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

        editor.call('apps:list', function (results) {
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
    const removeApp = function (app) {
        const item = document.getElementById('app-' + app.id);
        if (item) {
            item.remove();
        }

        // remove from apps array
        for (let i = 0; i < apps.length; i++) {
            if (apps[i].id === app.id) {
                // close dropdown menu if current app deleted
                if (dropdownApp === apps[i])
                    dropdownMenu.open = false;

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
        sortApps(apps);
        container.hidden = apps.length === 0;
        apps.forEach(createAppItem);
    };

    // LOCAL UTILS

    // sort apps by primary first and then created date
    const sortApps = function (apps) {
        return apps.sort(function (a, b) {
            if (config.project.primaryApp === a.id) {
                return -1;
            } else if (config.project.primaryApp === b.id) {
                return 1;
            }
            if (a.created_at < b.created_at) {
                return 1;
            } else if (a.created_at > b.created_at) {
                return -1;
            }
            return 0;


        });
    };

    // Return the size fixed to 2 digits precision.
    // If the result does not have any decimal points then remove them
    const toFixed = function (size) {
        let result = size.toFixed(2);
        if (result % 1 === 0) {
            result = Math.floor(result);
        }

        return result;
    };

    // convert size in bytes to readable string
    const sizeToString = function (size) {
        const base = 1000;

        if (isNaN(size))
            size = 0;

        if (size < base)
            return size + ' Bytes';

        size /= base;

        if (size < base)
            return toFixed(size) + ' KB';

        size /= base;

        if (size < base)
            return toFixed(size) + ' MB';

        size /= base;

        if (size < base)
            return toFixed(size) + ' GB';

        size /= base;

        return toFixed(size) + ' TB';
    };

    // adds commas every 3 decimals
    const numberWithCommas = function (number) {
        var parts = number.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };

    const destroyTooltips = function () {
        tooltips.forEach(function (tooltip) {
            tooltip.destroy();
        });
        tooltips = [];
    };

    const destroyEvents = function () {
        events.forEach(function (evt) {
            evt.unbind();
        });
        events = [];
    };

    // EVENTS

    // handle external updates to primary app
    editor.on('projects:primaryApp', function (newValue, oldValue) {
        if (panel.hidden) return;

        if (!newValue) {
            publishedBuild.hidden = true;
            return;
        }

        publishedBuild.hidden = false;

        // check if we need to refresh UI
        var currentPrimary = document.getElementById('app-' + newValue);
        if (currentPrimary && currentPrimary.classList.contains('primary'))
            return;

        refreshApps();
    });

    // handle app created externally
    editor.on('messenger:app.new', function (data) {
        if (panel.hidden) return;

        // get app from server
        editor.call('apps:get', data.app.id, function (app) {
            // add app if it's not already inside the apps array
            var found = false;
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
    editor.on('messenger:app.delete', function (data) {
        if (panel.hidden) return;

        removeApp(data.app);
    });

    // handle external app updates
    editor.on('messenger:app.update', function (data) {
        if (panel.hidden) return;

        // get app from server
        editor.call('apps:get', data.app.id, function (app) {
            for (let i = 0; i < apps.length; i++) {
                if (apps[i].id === app.id) {
                    apps[i] = app;
                }
            }
            refreshApps();
        });
    });

    // open publishing popup
    editor.method('picker:builds-publish', function () {
        editor.call('picker:project', 'builds-publish');
    });

    // on show
    panel.on('show', function () {
        loadApps();

        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', false);
    });

    // on hide
    panel.on('hide', function () {
        apps = [];
        destroyTooltips();
        destroyEvents();

        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', true);
    });

    editor.on('viewport:hover', function (state) {
        if (state && !panel.hidden) {
            setTimeout(function () {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });
});
