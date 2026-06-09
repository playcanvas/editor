import { Container, Label, Menu, Progress, Button } from '@playcanvas/pcui';

import { bytesToHuman, convertDatetime } from '@/common/utils';
import { config } from '@/editor/config';

const APP_LIMIT = 16;

editor.once('load', () => {
    // global variables
    const projectSettings = editor.call('settings:project');
    let detailApp = null;  // app whose detail page is currently open
    let menuApp = null;  // app whose row action menu is open
    let activeKebab = null;  // kebab button that opened the menu
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

    // main panel
    const panel = new Container({
        flex: true,
        class: 'picker-builds-publish'
    });

    // top toolbar: publish (primary) + download (secondary)
    const toolbar = new Container({
        flex: true,
        class: 'builds-toolbar'
    });
    panel.append(toolbar);

    const btnDownload = new Button({
        text: 'Download .zip',
        class: 'download'
    });
    handlePermissions(btnDownload);
    btnDownload.on('click', () => editor.call('picker:publish:download'));
    toolbar.append(btnDownload);

    const btnPublish = new Button({
        text: 'Publish',
        class: 'publish'
    });
    handlePermissions(btnPublish);
    btnPublish.on('click', () => editor.call('picker:publish:new'));
    toolbar.append(btnPublish);

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

    const primaryBuild = new Container({ class: 'builds-list' });
    primaryBuild.class.add('primary-build-summary');
    primaryBuild.hidden = true;
    panel.append(primaryBuild);

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
    const container = new Container({ class: 'builds-list' });
    panel.append(container);

    // detail "page" for a single build (hidden until a row is opened)
    const detailView = new Container({
        flex: true,
        class: 'build-detail',
        hidden: true
    });
    panel.append(detailView);

    // list chrome that is hidden while the detail page is open
    const listChrome = [toolbar, primaryBuildHeading, primaryBuild, existingBuildsLabel, noBuilds, container];

    // pagination state for infinite scroll
    let skip = 0;
    let hasMore = true;
    let loadingMore = false;
    let scrollContainer: HTMLElement | null = null;

    const loadMoreBuilds = function () {
        if (loadingMore || !hasMore || panel.hidden || detailApp) {
            return;
        }
        loadingMore = true;
        skip += APP_LIMIT;
        editor.api.globals.rest.projects.projectBuilds(APP_LIMIT, skip).on('load', (status, data) => {
            loadingMore = false;
            const results = data.result.map(normalizeBuildJob);
            apps.push(...results);
            results.forEach(app => createAppItem(app));
            hasMore = data.pagination ? apps.length < data.pagination.total : results.length === APP_LIMIT;
            fillViewport();
        });
    };

    // keep loading until the list fills the scroll area, so scrolling can trigger more
    const fillViewport = function () {
        if (scrollContainer && hasMore && !loadingMore && !panel.hidden && !detailApp &&
            scrollContainer.scrollHeight <= scrollContainer.clientHeight) {
            loadMoreBuilds();
        }
    };

    const onScroll = function () {
        if (!scrollContainer || loadingMore || !hasMore || panel.hidden || detailApp) {
            return;
        }
        if (scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 240) {
            loadMoreBuilds();
        }
    };

    // shared per-row action menu (opened from the kebab button on each row)
    const rowMenu = new Menu({
        class: 'picker-builds-menu',
        items: [{
            text: 'Open',
            class: 'open',
            onIsVisible: () => menuApp?.type === 'publish' && menuApp?.task.status === 'complete' && !!menuApp?.url,
            onSelect: () => menuApp?.url && window.open(menuApp.url, '_blank', 'noopener')
        }, {
            text: 'Download',
            class: 'download',
            onIsVisible: () => menuApp?.type === 'download' && menuApp?.task.status === 'complete' && !!menuApp?.url,
            onSelect: () => menuApp?.url && window.open(menuApp.url, '_blank', 'noopener')
        }, {
            text: 'View',
            onSelect: () => menuApp && showDetail(menuApp)
        }, {
            text: 'Delete',
            class: 'delete',
            onIsEnabled: () => editor.call('permissions:write') && !!menuApp?.build_job_id,
            onSelect: () => {
                if (!menuApp?.build_job_id) {
                    return;
                }
                const app = menuApp;
                editor.call('picker:confirm', 'Are you sure you want to delete this build?');
                editor.once('picker:confirm:yes', () => {
                    editor.api.globals.rest.projects.projectBuildDelete(app.build_job_id);
                    removeApp(app);
                });
            }
        }]
    });
    editor.call('layout.root').append(rowMenu);

    rowMenu.on('hide', () => {
        activeKebab?.classList.remove('active');
        activeKebab = null;
    });

    const openRowMenu = function (app: any, kebab: HTMLElement) {
        menuApp = app;
        activeKebab = kebab;
        kebab.classList.add('active');
        rowMenu.hidden = false;

        const rect = kebab.getBoundingClientRect();
        const items = rowMenu.dom.querySelector('.pcui-menu-items') as HTMLElement;
        rowMenu.position(rect.right - items.clientWidth, rect.bottom);
        rowMenu.focus();
    };

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

    // relative time for builds created today (just now / x minutes / x hours ago), absolute date otherwise
    const formatBuildDate = function (value: any) {
        const d = new Date(value);
        const now = new Date();
        const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
        if (!sameDay) {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        const mins = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 60000));
        if (mins < 1) {
            return 'just now';
        }
        if (mins < 60) {
            return mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
        }
        const hours = Math.floor(mins / 60);
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
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
        toolbar.hidden = false;
        container.hidden = apps.length === 0;
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
    const createAppItem = function (app: any, list: Container = container, options: any = {}) {
        const item = document.createElement('div');
        item.classList.add('build-item', app.task.status, app.type);
        item.id = options.summary ? `primary-app-${app.id}` : `app-${app.id}`;

        if (config.project.primaryApp === app.app_id || config.project.primaryApp === app.id) {
            item.classList.add('primary');
        }

        list.dom.appendChild(item);

        const row = document.createElement('div');
        row.classList.add('build-row');
        item.appendChild(row);

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
        date.textContent = formatBuildDate(app.created_at);
        date.title = convertDatetime(app.created_at);
        rightMeta.appendChild(date);

        if (app.duration_ms) {
            const duration = document.createElement('span');
            duration.classList.add('duration');
            duration.textContent = `${Math.round(app.duration_ms / 1000)}s`;
            rightMeta.appendChild(duration);
        }

        row.appendChild(rightMeta);

        const kebab = document.createElement('button');
        kebab.type = 'button';
        kebab.classList.add('kebab');
        kebab.setAttribute('aria-label', 'Build actions');
        const openKebab = function (e: MouseEvent) {
            e.preventDefault();
            e.stopPropagation();
            openRowMenu(app, kebab);
        };
        kebab.addEventListener('click', openKebab);
        events.push({
            unbind: () => kebab.removeEventListener('click', openKebab)
        });
        row.appendChild(kebab);

        const onItemClick = () => showDetail(app);
        item.addEventListener('click', onItemClick);
        events.push({
            unbind: () => item.removeEventListener('click', onItemClick)
        });

        return item;
    };

    // CONTROLLERS

    // load build job list
    const loadApps = function (showProgress: boolean = true) {
        skip = 0;
        hasMore = true;
        loadingMore = false;

        if (showProgress) {
            toggleProgress(true);
        }

        editor.api.globals.rest.projects.projectBuilds(APP_LIMIT, 0).on('load', (status, data) => {
            apps = data.result.map(normalizeBuildJob);
            hasMore = data.pagination ? apps.length < data.pagination.total : data.result.length === APP_LIMIT;

            if (showProgress) {
                toggleProgress(false);
            }

            refreshApps();
            fillViewport();
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

        // drop the primary-build summary if its build was the one removed
        const primaryExists = apps.some(item => item.type === 'publish' && item.app_id === config.project.primaryApp);
        primaryBuildHeading.hidden = !primaryExists;
        primaryBuild.hidden = !primaryExists;

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
        primaryBuild.dom.innerHTML = '';
        container.dom.innerHTML = '';
        renderPrimaryBuild();
        container.hidden = apps.length === 0;
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

        // the picker scrolls its content panel; watch it for infinite scroll
        scrollContainer = panel.dom.parentElement;
        scrollContainer?.addEventListener('scroll', onScroll);

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // on hide
    panel.on('hide', () => {
        apps = [];
        detailApp = null;
        detailView.hidden = true;
        scrollContainer?.removeEventListener('scroll', onScroll);
        scrollContainer = null;
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
