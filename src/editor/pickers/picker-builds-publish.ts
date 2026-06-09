import { Container, Label, Progress, Button } from '@playcanvas/pcui';

import { LegacyList } from '@/common/ui/list';
import { LegacyListItem } from '@/common/ui/list-item';
import { bytesToHuman, convertDatetime } from '@/common/utils';
import { config } from '@/editor/config';

const APP_LIMIT = 16;

editor.once('load', () => {
    // global variables
    const projectSettings = editor.call('settings:project');
    let detailApp = null;  // app whose detail page is currently open
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

    // detail "page" for a single build (hidden until a row is opened)
    const detailView = new Container({
        flex: true,
        class: 'build-detail',
        hidden: true
    });
    panel.append(detailView);

    // list chrome that is hidden while the detail page is open
    const listChrome = [primaryBuildHeading, primaryBuild, publishButtons, existingBuildsLabel, noBuilds, container, loadMore];

    let skip = 0;
    loadMore.on('click', () => {
        editor.api.globals.rest.projects.projectBuilds(APP_LIMIT, skip += APP_LIMIT).on('load', (status, data) => {
            const results = data.result.map(normalizeBuildJob);
            if (results.length === 0) {
                loadMore.hidden = true;
                return;
            }
            apps.push(...results);
            results.forEach(app => createAppItem(app));
        });
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

    // build the detail "page" for a single build
    const renderDetail = function (app: any) {
        detailView.element.innerHTML = '';

        const isComplete = app.task.status === 'complete';
        const canPublish = app.type === 'publish' && !!app.app_id;
        const canDelete = !!app.build_job_id;
        const isPrimary = config.project.primaryApp === app.app_id;

        const back = document.createElement('button');
        back.type = 'button';
        back.classList.add('back');
        back.textContent = '← Back to builds';
        back.addEventListener('click', showList);
        events.push({ unbind: () => back.removeEventListener('click', showList) });
        detailView.element.appendChild(back);

        const header = document.createElement('div');
        header.classList.add('detail-header');
        detailView.element.appendChild(header);

        const status = document.createElement('span');
        status.classList.add('status', app.task.status);
        header.appendChild(status);

        const heading = document.createElement('div');
        heading.classList.add('heading');
        header.appendChild(heading);

        const nameRow = document.createElement('div');
        nameRow.classList.add('name-row');
        heading.appendChild(nameRow);

        const name = document.createElement('span');
        name.classList.add('name');
        name.textContent = app.name;
        nameRow.appendChild(name);

        const typeBadge = document.createElement('span');
        typeBadge.classList.add('badge', app.type);
        typeBadge.textContent = app.type === 'publish' ? 'Publish' : 'Download';
        nameRow.appendChild(typeBadge);

        const formatBadge = document.createElement('span');
        formatBadge.classList.add('badge');
        formatBadge.textContent = app.settings && app.settings.format || app.version || app.type;
        nameRow.appendChild(formatBadge);

        if (isPrimary) {
            const primaryBadge = document.createElement('span');
            primaryBadge.classList.add('badge', 'primary-badge');
            primaryBadge.textContent = 'Primary';
            nameRow.appendChild(primaryBadge);
        }

        const sub = document.createElement('div');
        sub.classList.add('sub');
        sub.textContent = [
            isComplete ? 'Succeeded' : (app.task.status === 'error' ? 'Failed' : 'In progress'),
            app.build_job_id ? `#${app.build_job_id}` : null
        ].filter(Boolean).join(' · ');
        heading.appendChild(sub);

        const actions = document.createElement('div');
        actions.classList.add('detail-actions');
        header.appendChild(actions);

        if (isComplete && app.url) {
            const artifact = document.createElement('a');
            artifact.classList.add('artifact');
            artifact.href = app.url;
            artifact.target = '_blank';
            artifact.rel = 'noopener';
            artifact.textContent = app.type === 'publish' ? 'Open' : 'Download';
            actions.appendChild(artifact);
        }

        if (canPublish) {
            const primary = new Button({ text: 'Set primary', class: 'set-primary' });
            events.push(handlePermissions(primary));
            if (primary.enabled && (!isComplete || isPrimary)) {
                primary.enabled = false;
            }
            events.push(primary.on('click', () => {
                if (isPrimary || !isComplete) {
                    return;
                }
                editor.call('projects:setPrimaryApp', app.app_id, null, () => {
                    refreshApps();
                });
                refreshApps();
                toggleCollapsingPublishButtons(true);
            }));
            actions.appendChild(primary.dom);
        }

        if (canDelete) {
            const del = new Button({ text: 'Delete', class: 'delete' });
            events.push(handlePermissions(del));
            events.push(del.on('click', () => {
                editor.call('picker:confirm', 'Are you sure you want to delete this build?');
                editor.once('picker:confirm:yes', () => {
                    editor.api.globals.rest.projects.projectBuildDelete(app.build_job_id);
                    removeApp(app);
                });
            }));
            actions.appendChild(del.dom);
        }

        if (app.task.status === 'error' && app.task.message) {
            const error = document.createElement('div');
            error.classList.add('error');
            error.textContent = app.task.message;
            detailView.element.appendChild(error);
        }

        const details = createDetails(app);
        details.hidden = false;
        detailView.element.appendChild(details);
    };

    // return from the detail page to the build list
    const showList = function () {
        detailApp = null;
        detailView.hidden = true;
        detailView.element.innerHTML = '';

        existingBuildsLabel.hidden = false;
        publishButtons.hidden = false;
        container.hidden = apps.length === 0;
        loadMore.hidden = apps.length === 0;
        noBuilds.hidden = apps.length > 0;

        const primaryExists = apps.some(item => item.type === 'publish' && item.app_id === config.project.primaryApp);
        primaryBuildHeading.hidden = !primaryExists;
        primaryBuild.hidden = !primaryExists;
    };

    // open the detail page for a build
    const showDetail = function (app: any) {
        detailApp = app;
        listChrome.forEach((el) => {
            el.hidden = true;
        });
        renderDetail(app);
        detailView.hidden = false;
    };

    // create UI for single app
    const createAppItem = function (app: any, list: LegacyList = container, options: any = {}) {
        const item = new LegacyListItem();
        item.element.id = options.summary ? `primary-app-${app.id}` : `app-${app.id}`;

        list.append(item);

        if (config.project.primaryApp === app.app_id || config.project.primaryApp === app.id) {
            item.class.add('primary');
        }

        item.class.add(app.task.status);
        item.class.add(app.type);

        const row = document.createElement('div');
        row.classList.add('build-row');
        item.element.appendChild(row);

        const status = document.createElement('span');
        status.classList.add('status', app.task.status);
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
        type.classList.add('badge', app.type);
        type.textContent = app.type === 'publish' ? 'Publish' : 'Download';
        nameRow.appendChild(type);

        const format = document.createElement('span');
        format.classList.add('badge');
        format.textContent = app.settings && app.settings.format || app.version || app.type;
        nameRow.appendChild(format);

        if (config.project.primaryApp === app.app_id) {
            const primaryBadge = document.createElement('span');
            primaryBadge.classList.add('badge', 'primary-badge');
            primaryBadge.textContent = 'Primary';
            nameRow.appendChild(primaryBadge);
        }

        const sub = document.createElement('div');
        sub.classList.add('sub');
        const actor = app.actor && (app.actor.name || app.actor.username);
        sub.textContent = [
            app.build_job_id ? `#${app.build_job_id}` : null,
            actor ? `by ${actor}` : null
        ].filter(Boolean).join(' · ');
        body.appendChild(sub);

        const branch = document.createElement('div');
        branch.classList.add('branch');
        const branchName = document.createElement('span');
        branchName.classList.add('branch-name');
        branchName.textContent = app.branch && app.branch.name || 'main';
        branch.appendChild(branchName);
        row.appendChild(branch);

        const rightMeta = document.createElement('div');
        rightMeta.classList.add('right-meta');

        const date = document.createElement('span');
        date.classList.add('date');
        date.textContent = convertDatetime(app.created_at);
        rightMeta.appendChild(date);

        if (app.duration_ms) {
            const duration = document.createElement('span');
            duration.classList.add('duration');
            duration.textContent = `${Math.round(app.duration_ms / 1000)}s`;
            rightMeta.appendChild(duration);
        }

        row.appendChild(rightMeta);

        events.push(item.on('click', () => showDetail(app)));

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
        document.getElementById(`app-${app.id}`)?.remove();
        document.getElementById(`primary-app-${app.id}`)?.remove();

        const index = apps.findIndex(item => item.id === app.id);
        if (index !== -1) {
            apps.splice(index, 1);
        }

        container.hidden = apps.length === 0;

        // if the deleted build's detail page is open, return to the list
        if (detailApp && detailApp.id === app.id) {
            showList();
        }
    };

    const removeBuildJob = function (id: number) {
        const app = apps.find(item => item.build_job_id === id);
        if (app) {
            removeApp(app);
        }
    };

    // recreate app list UI
    const refreshApps = function () {
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

        // keep the detail page in sync if one is open
        if (detailApp) {
            const updated = apps.find(item => item.build_job_id === detailApp.build_job_id);
            if (updated) {
                showDetail(updated);
            } else {
                showList();
            }
        }
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
        showList();
        loadApps();

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // on hide
    panel.on('hide', () => {
        apps = [];
        detailApp = null;
        detailView.hidden = true;
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
