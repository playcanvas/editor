import { Container, Label, Menu, Progress, Button } from '@playcanvas/pcui';

import { LegacyList } from '@/common/ui/list';
import { LegacyListItem } from '@/common/ui/list-item';
import { LegacyTooltip } from '@/common/ui/tooltip';
import { bytesToHuman, convertDatetime } from '@/common/utils';
import { config } from '@/editor/config';

const APP_LIMIT = 16;

editor.once('load', () => {
    // global variables
    const projectSettings = editor.call('settings:project');
    let dropdownApp = null;  // app whose dropdown was last clicked
    let apps = [];  // all loaded builds
    let tooltips = [];  // holds all tooltips
    let events = [];  // holds events that need to be destroyed

    // disables / enables field depending on permissions
    const handlePermissions = function (field: { enabled: boolean }) {
        field.enabled = editor.call('permissions:write');
        return editor.on(`permissions:set:${config.self.id}`, (accessLevel) => {
            if (accessLevel === 'write' || accessLevel === 'admin') {
                field.enabled = true;
            } else {
                field.enabled = false;
            }
        });
    };

    // collapses publish and download buttons
    const toggleCollapsingPublishButtons = (collapse = true) => {
        if (collapse) {
            labelDownloadIcon.style.display = 'none';
            labelDownloadDesc.style.display = 'none';
            labelPublishDesc.style.display = 'none';
            labelPublishIcon.style.display = 'none';

            btnPublish.class.add('collapsed');
            btnDownload.class.add('collapsed');

            panelPlaycanvas.class.add('collapsed');
            panelSelfHost.class.add('collapsed');
        } else {
            labelDownloadIcon.style.display = 'block';
            labelDownloadDesc.style.display = 'block';
            labelPublishDesc.style.display = 'block';
            labelPublishIcon.style.display = 'block';

            btnPublish.class.remove('collapsed');
            btnDownload.class.remove('collapsed');

            panelPlaycanvas.class.remove('collapsed');
            panelSelfHost.class.remove('collapsed');
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

    const progressBar = new Progress({ value: 100 });
    progressBar.hidden = true;
    panel.append(progressBar);

    const primaryBuildHeading = new Label({
        text: 'Primary build',
        class: 'primary-build-heading',
        hidden: true
    });
    panel.append(primaryBuildHeading);

    const primaryBuild = new LegacyList();
    primaryBuild.class.add('primary-build-summary');
    primaryBuild.selectable = false;
    primaryBuild.hidden = true;
    panel.append(primaryBuild);

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
        text: 'Build history',
        class: 'builds-list-heading'
    });
    panel.append(existingBuildsLabel);

    // no builds message
    let noBuildsText = 'You have not created any builds.';
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
    container.selectable = false;
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
        editor.api.globals.rest.projects.projectBuilds(APP_LIMIT, skip += APP_LIMIT).on('load', (status, data) => {
            const results = data.result.map(normalizeBuildJob);
            if (results.length === 0) {
                loadMore.hidden = true;
                return;
            }
            apps.push(...results);
            results.forEach(createAppItem);
        });
    });

    const dropdownMenu = new Menu({
        class: 'picker-builds-menu',
        items: [{
            text: 'Delete',
            onIsEnabled: () => editor.call('permissions:write') && !!dropdownApp?.build_job_id,
            onSelect: () => {
                if (!dropdownApp?.build_job_id) {
                    return;
                }

                editor.call('picker:confirm', 'Are you sure you want to delete this build?');
                editor.once('picker:confirm:yes', () => {
                    removeApp(dropdownApp);
                    editor.api.globals.rest.projects.projectBuildDelete(dropdownApp.build_job_id);
                });
            }
        }]
    });

    editor.call('layout.root').append(dropdownMenu);

    // on closing menu remove 'clicked' class from respective dropdown
    dropdownMenu.on('hide', () => {
        if (dropdownApp) {
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
        primaryBuildHeading.hidden = true;
        primaryBuild.hidden = true;
        noBuilds.hidden = toggle || apps.length > 0;
    };

    const normalizeBuildJob = function (job: any) {
        const settings = job.settings || {};
        const artifacts = job.artifacts || [];
        const artifact = artifacts[0];

        return {
            id: job.app_id || `job-${job.id}`,
            app_id: job.app_id,
            job_id: job.job_id,
            build_job_id: job.id,
            type: job.type,
            actor: job.actor,
            settings,
            artifacts,
            branch: job.branch,
            name: settings.name || 'Untitled',
            version: settings.version || settings.format,
            release_notes: settings.release_notes || '',
            created_at: job.created_at,
            completed_at: job.completed_at,
            duration_ms: job.duration_ms,
            source: job.source,
            size: artifact && artifact.bytes !== undefined ? artifact.bytes : null,
            views: 0,
            url: artifact && artifact.url,
            task: {
                status: job.status,
                message: job.message || ''
            }
        };
    };

    const createDetails = function (app: any) {
        const details = document.createElement('div');
        details.classList.add('details');
        details.hidden = true;

        const add = function (label: string, value: any) {
            if (value === undefined || value === null || value === '') {
                return;
            }

            const row = document.createElement('div');
            row.classList.add('detail-row');

            const key = document.createElement('span');
            key.classList.add('key');
            key.textContent = label;
            row.appendChild(key);

            const val = document.createElement('span');
            val.classList.add('value');
            val.textContent = value;
            row.appendChild(val);

            details.appendChild(row);
        };

        const settings = app.settings || {};
        add('Type', app.type === 'publish' ? 'Publish' : 'Download');
        add('Format', settings.format);
        add('Engine', settings.engine_version);
        add('Branch', app.branch && app.branch.name);
        add('Created by', app.actor && (app.actor.name || app.actor.username));
        add('Source', app.source && app.source.type);
        add('Duration', app.duration_ms ? `${Math.round(app.duration_ms / 1000)}s` : null);
        add('Release notes', app.release_notes);

        if (settings.scenes && settings.scenes.length) {
            add('Scenes', settings.scenes.map(scene => `${scene.name} (${scene.id})`).join(', '));
        }

        const options = [];
        if (settings.scripts_concatenate) {
            options.push('Concatenate scripts');
        }
        if (settings.scripts_minify) {
            options.push('Minify scripts');
        }
        if (settings.scripts_sourcemaps) {
            options.push('Source maps');
        }
        if (settings.optimize_scene_format) {
            options.push('Optimize scene format');
        }
        add('Options', options.length ? options.join(', ') : 'None');

        if (app.artifacts && app.artifacts.length) {
            app.artifacts.forEach((artifact) => {
                const row = document.createElement('div');
                row.classList.add('detail-row');

                const key = document.createElement('span');
                key.classList.add('key');
                key.textContent = 'Artifact';
                row.appendChild(key);

                const val = document.createElement('span');
                val.classList.add('value');
                const link = document.createElement('a');
                link.href = artifact.url;
                link.target = '_blank';
                link.rel = 'noopener';
                link.textContent = artifact.type === 'app' ? 'Open app' : 'Download';
                val.appendChild(link);

                if (artifact.bytes !== null && artifact.bytes !== undefined) {
                    const bytes = document.createTextNode(` (${bytesToHuman(artifact.bytes)})`);
                    val.appendChild(bytes);
                }

                row.appendChild(val);
                details.appendChild(row);
            });
        }

        return details;
    };

    // create UI for single app
    const createAppItem = function (app: any, list: LegacyList = container, options: any = {}) {
        const item = new LegacyListItem();
        item.element.id = options.summary ? `primary-app-${app.id}` : `app-${app.id}`;

        list.append(item);

        const canPublish = !options.summary && app.type === 'publish' && !!app.app_id;
        const canDelete = !options.summary && !!app.build_job_id;

        if (config.project.primaryApp === app.app_id || config.project.primaryApp === app.id) {
            item.class.add('primary');
        }

        item.class.add(app.task.status);
        item.class.add(app.type);

        const row = document.createElement('div');
        row.classList.add('build-row');
        item.element.appendChild(row);

        const status = document.createElement('span');
        status.classList.add('status');
        status.classList.add(app.task.status);
        if (app.task.status === 'complete') {
            status.setAttribute('aria-label', 'Succeeded');
        } else if (app.task.status === 'error') {
            status.setAttribute('aria-label', 'Failed');
        }
        row.appendChild(status);

        const body = document.createElement('div');
        body.classList.add('body');
        row.appendChild(body);

        const nameRow = document.createElement('div');
        nameRow.classList.add('name-row');
        body.appendChild(nameRow);

        const name = new Label({
            text: app.name,
            class: 'name'
        });
        nameRow.appendChild(name.dom);

        const type = document.createElement('span');
        type.classList.add('badge');
        type.classList.add(app.type);
        type.textContent = app.type === 'publish' ? 'Publish' : 'Download';
        nameRow.appendChild(type);

        const format = document.createElement('span');
        format.classList.add('badge');
        format.textContent = app.settings && app.settings.format || app.version || app.type;
        nameRow.appendChild(format);

        if (config.project.primaryApp === app.app_id) {
            const primaryBadge = document.createElement('span');
            primaryBadge.classList.add('badge');
            primaryBadge.classList.add('primary-badge');
            primaryBadge.textContent = 'Primary';
            nameRow.appendChild(primaryBadge);
        }

        const meta = document.createElement('div');
        meta.classList.add('meta');
        body.appendChild(meta);

        const addMeta = function (value: any, cls?: string) {
            if (value === undefined || value === null || value === '') {
                return null;
            }

            const span = document.createElement('span');
            span.classList.add('meta-item');
            if (cls) {
                span.classList.add(cls);
            }
            span.textContent = value;
            meta.appendChild(span);
            return span;
        };

        addMeta(app.task.status === 'complete' ? 'Succeeded' : (app.task.status === 'error' ? 'Failed' : 'In progress'), 'state');
        addMeta(app.build_job_id ? `#${app.build_job_id}` : null, 'run');
        addMeta(convertDatetime(app.created_at), 'date');
        addMeta(app.actor && (app.actor.name || app.actor.username), 'actor');
        addMeta(app.branch && app.branch.name || 'main', 'branch');
        addMeta(app.duration_ms ? `${Math.round(app.duration_ms / 1000)}s` : null, 'duration');
        addMeta(app.size === null ? null : bytesToHuman(app.size), 'size');

        const actions = document.createElement('div');
        actions.classList.add('actions');
        const stopActions = function (e: MouseEvent) {
            e.stopPropagation();
        };
        actions.addEventListener('click', stopActions);
        events.push({
            unbind: () => {
                actions.removeEventListener('click', stopActions);
            }
        });
        row.appendChild(actions);

        const primary = new Button({
            icon: 'E223',
            class: 'primary'
        });
        events.push(handlePermissions(primary));
        primary.hidden = options.summary || !canPublish;
        if (primary.enabled && (!canPublish || app.task.status !== 'complete')) {
            primary.enabled = false;
        }
        actions.appendChild(primary.dom);

        events.push(primary.on('click', (e?: MouseEvent) => {
            e?.stopPropagation();

            if (!canPublish || config.project.primaryApp === app.app_id || app.task.status !== 'complete') {
                return;
            }

            editor.call('projects:setPrimaryApp', app.app_id, null, () => {
                refreshApps();
            });

            refreshApps();
            toggleCollapsingPublishButtons(true);
        }));

        if (canPublish) {
            const tooltipText = config.project.primaryApp === app.app_id ? 'Primary build' : 'Change the projects\'s primary build';
            const tooltip = LegacyTooltip.attach({
                target: primary.dom,
                text: tooltipText,
                align: 'right',
                root: editor.call('layout.root')
            });
            tooltips.push(tooltip);
        }

        if (app.task.status === 'complete' && app.url) {
            const artifact = document.createElement('a');
            artifact.classList.add('artifact');
            artifact.href = app.url;
            artifact.target = '_blank';
            artifact.rel = 'noopener';
            artifact.textContent = app.type === 'publish' ? 'Open' : 'Download';
            actions.appendChild(artifact);
        }

        const error = new Label({
            text: app.task.message,
            class: 'error',
            hidden: app.task.status !== 'error'
        });
        item.element.appendChild(error.dom);

        const dropdown = document.createElement('button');
        dropdown.type = 'button';
        dropdown.classList.add('action-button');
        dropdown.classList.add('dropdown');
        dropdown.innerHTML = '&#57689;';
        dropdown.hidden = !canDelete;
        dropdown.setAttribute('aria-label', 'Build actions');
        actions.appendChild(dropdown);

        const openMenu = function (e: MouseEvent) {
            e.preventDefault();
            e.stopPropagation();

            dropdown.classList.add('clicked');
            dropdown.innerHTML = '&#57687;';
            dropdownApp = app;

            dropdownMenu.hidden = false;

            const rect = dropdown.getBoundingClientRect();
            const menuItems = dropdownMenu.dom.querySelector('.pcui-menu-items') as HTMLElement;
            dropdownMenu.position(rect.right - menuItems.clientWidth, rect.bottom);
            dropdownMenu.focus();
        };
        dropdown.addEventListener('click', openMenu);
        events.push({
            unbind: () => {
                dropdown.removeEventListener('click', openMenu);
            }
        });

        const details = createDetails(app);
        item.element.appendChild(details);

        const expand = document.createElement('button');
        expand.type = 'button';
        expand.classList.add('action-button');
        expand.classList.add('expander');
        expand.innerHTML = '&#57689;';
        expand.setAttribute('aria-label', 'Show build details');
        actions.appendChild(expand);

        const toggleDetails = function () {
            details.hidden = !details.hidden;
            expand.innerHTML = details.hidden ? '&#57689;' : '&#57687;';
            expand.setAttribute('aria-label', details.hidden ? 'Show build details' : 'Hide build details');
        };

        events.push(item.on('click', toggleDetails));

        const expandDetails = function (e: MouseEvent) {
            e.preventDefault();
            e.stopPropagation();
            toggleDetails();
        };
        expand.addEventListener('click', expandDetails);
        events.push({
            unbind: () => {
                expand.removeEventListener('click', expandDetails);
            }
        });

        return item;
    };

    // CONTROLLERS

    // load build job list
    const loadApps = function (showProgress: boolean = true) {
        skip = 0;

        if (showProgress) {
            toggleProgress(true);
        }

        editor.api.globals.rest.projects.projectBuilds().on('load', (status, data) => {
            const results = data.result.map(normalizeBuildJob);
            apps = results;
            if (showProgress) {
                toggleProgress(false);
            }

            if (apps.length > 0) {
                panelPlaycanvas.class.add('collapsed');
                panelSelfHost.class.add('collapsed');
            }

            toggleCollapsingPublishButtons(apps.length > 0);

            refreshApps();
        });
    };

    // removes an app from the UI
    const removeApp = function (app: any) {
        const item = document.getElementById(`app-${app.id}`);
        if (item) {
            item.remove();
        }

        // remove from apps array
        for (let i = 0; i < apps.length; i++) {
            if (apps[i].id === app.id) {
                // close dropdown menu if current app deleted
                if (dropdownApp === apps[i]) {
                    dropdownMenu.hidden = true;
                }

                apps.splice(i, 1);
                break;
            }
        }

        container.hidden = apps.length === 0;
    };

    const removeBuildJob = function (id: number) {
        const app = apps.find(item => item.build_job_id === id);
        if (app) {
            removeApp(app);
        }
    };

    // recreate app list UI
    const refreshApps = function () {
        dropdownMenu.hidden = true;
        destroyTooltips();
        destroyEvents();
        primaryBuild.element.innerHTML = '';
        container.element.innerHTML = '';
        renderPrimaryBuild();
        container.hidden = apps.length === 0;
        loadMore.hidden = apps.length === 0;
        apps.forEach((app) => {
            createAppItem(app);
        });
    };

    // LOCAL UTILS

    const renderPrimaryBuild = function () {
        const app = apps.find(item => item.type === 'publish' && item.app_id === config.project.primaryApp);
        primaryBuildHeading.hidden = !app;
        primaryBuild.hidden = !app;

        if (app) {
            createAppItem(app, primaryBuild, { summary: true });
        }
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

        refreshApps();
    });

    // handle app created externally
    editor.on('messenger:app.new', () => {
        if (panel.hidden) {
            return;
        }

        loadApps();
    });

    // handle external delete
    editor.on('messenger:app.delete', (data) => {
        if (panel.hidden) {
            return;
        }

        removeApp(data.app);
    });

    editor.on('messenger:build_job.delete', (data) => {
        if (panel.hidden || !data.build_job) {
            return;
        }

        removeBuildJob(Number(data.build_job.id));
    });

    // handle external app updates
    editor.on('messenger:app.update', () => {
        if (panel.hidden) {
            return;
        }

        loadApps();
    });

    editor.on('messenger:job.update', (msg: any) => {
        if (panel.hidden || !msg.job || !apps.some(app => app.job_id === Number(msg.job.id))) {
            return;
        }

        loadApps(false);
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
