import { Container, Label, Menu, Progress, Button } from '@playcanvas/pcui';

import { bytesToHuman, convertDatetime } from '@/common/utils';
import { config } from '@/editor/config';

const APP_LIMIT = 16;
const DUMMY_LEGACY_APP = {
    id: -1,
    sample: true,
    name: 'Legacy published app sample',
    description: 'temporary manual legacy build description',
    version: '1.0.0',
    release_notes: 'temporary manual legacy build sample',
    size: 7340032,
    views: 42,
    url: 'https://playcanv.as/b/legacy-sample',
    task: { status: 'complete', message: '' },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    completed_at: new Date(Date.now() - 86340000).toISOString(),
    branch: { id: 'legacy', name: 'main' }
};

editor.once('load', () => {
    // global variables
    const projectSettings = editor.call('settings:project');
    let detailApp = null;  // app whose detail page is currently open
    let menuApp = null;  // app whose row action menu is open
    let activeKebab = null;  // kebab button that opened the menu
    let apps = [];  // all loaded builds
    let appIndex: Record<string, any> = {};
    let appList = [];
    let loadedAppIndex = false;
    let tooltips = [];  // holds all tooltips
    let events = [];  // holds events that need to be destroyed
    let detailEvents = [];  // holds detail panel events
    let openingDetail = false;
    let openingBuilds = false;

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

    // progress bar and loading label
    const loading = new Label({
        text: 'Loading...'
    });
    panel.append(loading);

    const progressBar = new Progress({ value: 100 });
    progressBar.hidden = true;
    panel.append(progressBar);

    const primaryBuildHeader = new Container({
        flex: true,
        class: 'primary-build-header'
    });
    panel.append(primaryBuildHeader);

    const primaryBuildHeading = new Label({
        text: 'Primary build',
        class: 'primary-build-heading',
        hidden: true
    });
    primaryBuildHeader.append(primaryBuildHeading);

    // top toolbar: publish (primary) + download (secondary)
    const toolbar = new Container({
        flex: true,
        class: 'builds-toolbar'
    });
    primaryBuildHeader.append(toolbar);

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

    const primaryBuild = new Container({ class: 'primary-build-summary' });
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

    const detailPanel = new Container({
        flex: true,
        class: 'picker-build-detail'
    });

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
            const ids = getPublishAppIds(results);
            if (ids.size) {
                apps = apps.filter(app => app.build_job_id || app.type !== 'publish' || !ids.has(String(app.app_id)));
            }
            apps.push(...results);
            apps.sort(compareBuildDate);
            hasMore = data.pagination ? skip + results.length < data.pagination.total : results.length === APP_LIMIT;
            refreshApps();
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

    const isPrimaryBuild = function (app: any) {
        return !!app && app.type === 'publish' && config.project.primaryApp === app.app_id;
    };

    const isPickerVisible = function () {
        return !panel.hidden || !detailPanel.hidden;
    };

    const canSetPrimaryBuild = function (app: any) {
        return !!app && app.type === 'publish' && app.task.status === 'complete' && !!app.app_id && !isPrimaryBuild(app);
    };

    const isSampleBuild = function (app: any) {
        return app?.source?.sample === true;
    };

    const canDeleteBuild = function (app: any) {
        if (!app) {
            return false;
        }

        return !!app.build_job_id || isSampleBuild(app) ||
            (app.type === 'publish' && Number(app.app_id) > 0);
    };

    const setPrimaryBuild = function (app: any) {
        if (!editor.call('permissions:write') || !canSetPrimaryBuild(app)) {
            return;
        }

        editor.call('projects:setPrimaryApp', String(app.app_id), undefined, refreshApps);
        refreshApps();
    };

    // shared per-row action menu (opened from the kebab button on each row)
    const rowMenu = new Menu({
        class: 'picker-builds-menu',
        items: [{
            text: 'Set Primary Build',
            class: 'primary',
            onIsVisible: () => menuApp?.type === 'publish',
            onIsEnabled: () => editor.call('permissions:write') && canSetPrimaryBuild(menuApp),
            onSelect: () => menuApp && setPrimaryBuild(menuApp)
        }, {
            text: 'View',
            onSelect: () => menuApp && openBuildDetail(menuApp)
        }, {
            text: 'Delete',
            class: 'delete',
            onIsEnabled: () => editor.call('permissions:write') && canDeleteBuild(menuApp),
            onSelect: () => {
                deleteBuild(menuApp);
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
    editor.call('picker:project:registerPanel', 'build-detail', 'Build Details', detailPanel);

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

    const loadAppIndex = function (done: () => void) {
        if (loadedAppIndex) {
            done();
            return;
        }

        editor.api.globals.rest.projects.projectApps().on('load', (status, data) => {
            appList = (data?.result || []).slice();
            appIndex = {};
            appList.forEach((app) => {
                appIndex[String(app.id)] = app;
            });
            const sample = Object.assign({}, DUMMY_LEGACY_APP, {
                id: config.project.primaryApp && !appIndex[String(config.project.primaryApp)] ?
                    config.project.primaryApp :
                    DUMMY_LEGACY_APP.id
            });
            appList.push(sample);
            loadedAppIndex = true;
            done();
        });
    };

    const compareBuildDate = function (a: any, b: any) {
        const at = new Date(a.created_at || a.completed_at || 0).getTime() || 0;
        const bt = new Date(b.created_at || b.completed_at || 0).getTime() || 0;
        return bt - at;
    };

    const normalizeBuildJob = function (job: any) {
        const raw = job.settings || {};
        const artifacts = job.artifacts || [];
        const artifact = artifacts[0];
        const meta = job.app_id ? appIndex[String(job.app_id)] : null;
        const name = raw.name || meta?.name || job.app?.name || 'Untitled';
        const description = raw.description || meta?.description || job.app?.description || '';
        const version = raw.version || meta?.version || job.app?.version || '';
        const releaseNotes = raw.release_notes || raw.releaseNotes || meta?.release_notes ||
            meta?.releaseNotes || job.app?.release_notes || job.app?.releaseNotes || '';
        const size = artifact && artifact.bytes !== undefined ? artifact.bytes : meta?.size ?? job.app?.size ?? null;
        const url = artifact && artifact.url || meta?.url || job.app?.url;
        const rowArtifacts = artifacts.length ? artifacts :
            url ? [{ type: job.type === 'publish' ? 'app' : job.type, url, bytes: size }] : artifacts;
        const settings = Object.assign({}, raw, {
            name,
            description,
            version,
            release_notes: releaseNotes
        });

        return {
            id: job.app_id || `job-${job.id}`,
            app_id: job.app_id,
            job_id: job.job_id,
            build_job_id: job.id,
            type: job.type,
            actor: job.actor,
            settings,
            artifacts: rowArtifacts,
            branch: job.branch,
            name,
            description,
            version,
            release_notes: releaseNotes,
            created_at: job.created_at,
            completed_at: job.completed_at,
            duration_ms: job.duration_ms,
            source: job.source,
            size,
            views: meta?.views ?? job.app?.views ?? job.views ?? 0,
            url,
            task: {
                status: job.status,
                message: job.message || ''
            }
        };
    };

    const normalizeLegacyApp = function (app: any) {
        const bytes = app.size ?? null;
        const url = app.url;
        return {
            id: app.id,
            app_id: app.id,
            build_job_id: null,
            type: 'publish',
            settings: {
                name: app.name,
                description: app.description,
                version: app.version,
                release_notes: app.release_notes || app.releaseNotes,
                format: 'playcanvas'
            },
            artifacts: url ? [{ type: 'app', url, bytes }] : [],
            branch: app.branch,
            name: app.name || 'Untitled',
            description: app.description || '',
            version: app.version || '',
            release_notes: app.release_notes || app.releaseNotes || '',
            created_at: app.created_at,
            completed_at: app.completed_at,
            duration_ms: null,
            source: { type: 'legacy', sample: app.sample === true },
            size: bytes,
            views: app.views ?? 0,
            url,
            task: app.task || { status: 'complete', message: '' }
        };
    };

    const getPublishAppIds = function (rows: any[]) {
        return new Set(rows
        .filter(item => item.type === 'publish' && item.app_id !== null && item.app_id !== undefined)
        .map(item => String(item.app_id)));
    };

    const isSameBuild = function (a: any, b: any) {
        if (!a || !b) {
            return false;
        }
        if (a.build_job_id && b.build_job_id) {
            return Number(a.build_job_id) === Number(b.build_job_id);
        }
        if (a.app_id && b.app_id) {
            return String(a.app_id) === String(b.app_id);
        }
        return a.id === b.id;
    };

    const getStatusLabel = function (app: any) {
        if (app.task.status === 'complete') {
            return 'Succeeded';
        }
        if (app.task.status === 'error') {
            return 'Failed';
        }
        if (app.task.status === 'running') {
            return 'Running';
        }
        return app.task.status || 'Pending';
    };

    const createValue = function (row: any) {
        const value = row.value;
        const val = document.createElement('span');
        val.classList.add('value');
        if (row.variant) {
            val.classList.add(`metadata-${row.variant}`);
        }
        if (row.class) {
            val.classList.add(row.class);
        }
        if (value instanceof Node) {
            val.appendChild(value);
        } else {
            val.textContent = String(value);
        }
        return val;
    };

    const createSection = function (title: string, rows: any[]) {
        const section = document.createElement('section');
        section.classList.add('detail-section');

        const heading = document.createElement('h3');
        heading.textContent = title;
        section.appendChild(heading);

        const grid = document.createElement('div');
        grid.classList.add('metadata-grid');
        section.appendChild(grid);

        rows.forEach((row) => {
            const value = row.value;
            if (value === undefined || value === null || value === '') {
                return;
            }

            const item = document.createElement('div');
            item.classList.add('detail-row');

            const key = document.createElement('span');
            key.classList.add('key');
            key.textContent = row.label;
            item.appendChild(key);

            item.appendChild(createValue(row));
            grid.appendChild(item);
        });

        return section;
    };

    const getBuildOptions = function (settings: any) {
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
        if (!options.length) {
            return 'None';
        }

        const list = document.createElement('span');
        list.classList.add('metadata-list');
        list.setAttribute('role', 'list');
        options.forEach((option) => {
            const item = document.createElement('span');
            item.setAttribute('role', 'listitem');
            item.textContent = option;
            list.appendChild(item);
        });
        return list;
    };

    const createArtifactCard = function (app: any, artifact: any) {
        const card = document.createElement('div');
        card.classList.add('artifact-card', app.type === 'download' ? 'zip' : 'app');

        const icon = document.createElement('span');
        icon.classList.add('artifact-icon');
        card.appendChild(icon);

        const body = document.createElement('div');
        body.classList.add('artifact-body');
        card.appendChild(body);

        const title = document.createElement('div');
        title.classList.add('artifact-title');
        title.textContent = app.type === 'download' ? 'zip' : 'app';
        body.appendChild(title);

        if (artifact.bytes !== null && artifact.bytes !== undefined) {
            const meta = document.createElement('div');
            meta.classList.add('artifact-meta');
            meta.textContent = bytesToHuman(artifact.bytes);
            body.appendChild(meta);
        }

        if (artifact.url) {
            const link = document.createElement('a');
            link.classList.add('artifact-action');
            link.href = artifact.url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = app.type === 'publish' ? 'Open app' : 'Download';
            card.appendChild(link);
        }

        return card;
    };

    const createArtifactSection = function (app: any, artifacts: any[]) {
        if (!artifacts.length) {
            return createSection('Artifacts', [{
                label: 'Artifacts',
                value: 'None'
            }]);
        }

        const section = document.createElement('section');
        section.classList.add('detail-section', 'artifact-section');

        const heading = document.createElement('h3');
        heading.textContent = 'Artifacts';
        section.appendChild(heading);

        const list = document.createElement('div');
        list.classList.add('artifact-list');
        section.appendChild(list);

        artifacts.forEach((artifact) => {
            list.appendChild(createArtifactCard(app, artifact));
        });

        return section;
    };

    const createDetails = function (app: any) {
        const settings = app.settings || {};
        const artifacts = app.artifacts || [];
        const scenes = settings.scenes || [];
        const actor = app.actor && (app.actor.name || app.actor.username);
        const source = app.source && (app.source.name || app.source.type);
        const details = document.createElement('div');
        details.classList.add('detail-body');

        details.appendChild(createSection('Build info', [{
            label: 'Status',
            value: getStatusLabel(app),
            variant: 'badge'
        }, {
            label: 'Build',
            value: app.build_job_id ? `#${app.build_job_id}` : null,
            variant: 'code'
        }, {
            label: 'Job',
            value: app.job_id ? `#${app.job_id}` : null,
            variant: 'code'
        }, {
            label: 'Created',
            value: app.created_at ? convertDatetime(app.created_at) : null
        }, {
            label: 'Completed',
            value: app.completed_at ? convertDatetime(app.completed_at) : null
        }, {
            label: 'Duration',
            value: app.duration_ms ? `${Math.round(app.duration_ms / 1000)}s` : null
        }, {
            label: 'Created by',
            value: actor
        }]));

        if (app.type === 'publish') {
            details.appendChild(createSection('Publish details', [{
                label: 'Title',
                value: app.name
            }, {
                label: 'Description',
                value: app.description
            }, {
                label: 'Version',
                value: app.version
            }, {
                label: 'Release notes',
                value: app.release_notes
            }]));
        }

        details.appendChild(createSection('Source and settings', [{
            label: 'Type',
            value: app.type === 'publish' ? 'Publish' : 'Download',
            variant: 'badge',
            class: app.type
        }, {
            label: 'Format',
            value: settings.format || app.version,
            variant: 'badge'
        }, {
            label: 'Engine',
            value: settings.engine_version,
            variant: 'code'
        }, {
            label: 'Branch',
            value: app.branch && app.branch.name || 'main'
        }, {
            label: 'Source',
            value: source,
            variant: 'badge'
        }, {
            label: 'Options',
            value: getBuildOptions(settings)
        }]));

        details.appendChild(createSection('Scenes', scenes.length ? scenes.map((scene) => {
            return {
                label: scene.name || 'Untitled scene',
                value: scene.id ? `ID ${scene.id}` : 'Included',
                variant: scene.id ? 'code' : null
            };
        }) : [{
            label: 'Scenes',
            value: 'None'
        }]));

        details.appendChild(createArtifactSection(app, artifacts));

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

    const openBuildsPanel = function () {
        editor.call('picker:builds-publish');
    };

    const deleteBuild = function (app: any) {
        if (!canDeleteBuild(app) || !editor.call('permissions:write')) {
            return;
        }

        editor.call('picker:confirm', 'Are you sure you want to delete this build?');
        editor.once('picker:confirm:yes', () => {
            if (app.build_job_id) {
                editor.api.globals.rest.projects.projectBuildDelete(app.build_job_id);
            } else if (!isSampleBuild(app)) {
                editor.api.globals.rest.apps.appDelete(Number(app.app_id));
            }
            removeApp(app);
        });
    };

    const renderDetail = function (app: any) {
        destroyDetailEvents();
        detailPanel.element.innerHTML = '';

        const isComplete = app.task.status === 'complete';
        const canPrimary = app.type === 'publish' && !!app.app_id;
        const canDelete = canDeleteBuild(app);
        const isPrimary = isPrimaryBuild(app);

        const back = document.createElement('button');
        back.type = 'button';
        back.classList.add('back');
        back.textContent = 'Back to builds';
        back.addEventListener('click', openBuildsPanel);
        detailEvents.push({ unbind: () => back.removeEventListener('click', openBuildsPanel) });
        detailPanel.element.appendChild(back);

        const header = document.createElement('div');
        header.classList.add('detail-hero');
        detailPanel.element.appendChild(header);

        const thumb = document.createElement('img');
        thumb.classList.add('thumb');
        thumb.alt = '';
        thumb.src = config.project.thumbnails && (config.project.thumbnails.m || config.project.thumbnails.s) ||
            `${config.url.static}/platform/images/common/blank_project.png`;
        header.appendChild(thumb);

        const heading = document.createElement('div');
        heading.classList.add('heading');
        header.appendChild(heading);

        const nameRow = document.createElement('div');
        nameRow.classList.add('name-row');
        heading.appendChild(nameRow);

        const status = document.createElement('span');
        status.classList.add('status', app.task.status);
        nameRow.appendChild(status);

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

        if (app.type === 'publish') {
            const stats = document.createElement('div');
            stats.classList.add('detail-stats');
            heading.appendChild(stats);

            const views = document.createElement('span');
            views.classList.add('metric', 'views');
            views.title = 'Views';
            views.textContent = String(app.views ?? 0);
            stats.appendChild(views);
        }

        const sub = document.createElement('div');
        sub.classList.add('sub');
        sub.textContent = [
            getStatusLabel(app),
            app.build_job_id ? `Build #${app.build_job_id}` : null,
            app.job_id ? `Job #${app.job_id}` : null,
            app.created_at ? `Created ${formatBuildDate(app.created_at)}` : null
        ].filter(Boolean).join(' · ');
        heading.appendChild(sub);

        const actions = document.createElement('div');
        actions.classList.add('detail-actions');
        header.appendChild(actions);

        if (isComplete && app.url) {
            const artifact = document.createElement('a');
            artifact.classList.add('detail-button');
            artifact.href = app.url;
            artifact.target = '_blank';
            artifact.rel = 'noopener';
            artifact.textContent = app.type === 'publish' ? 'Open' : 'Download';
            actions.appendChild(artifact);
        }

        if (canPrimary) {
            const primary = new Button({ text: 'Set primary', class: 'set-primary' });
            const update = () => {
                primary.enabled = editor.call('permissions:write') && canSetPrimaryBuild(app);
            };
            update();
            detailEvents.push(editor.on(`permissions:set:${config.self.id}`, update));
            detailEvents.push(primary.on('click', () => setPrimaryBuild(app)));
            actions.appendChild(primary.dom);
        }

        if (canDelete) {
            const del = new Button({ text: 'Delete', class: 'delete' });
            detailEvents.push(handlePermissions(del));
            detailEvents.push(del.on('click', () => deleteBuild(app)));
            actions.appendChild(del.dom);
        }

        if (app.task.status === 'error' && app.task.message) {
            const error = document.createElement('div');
            error.classList.add('error');
            error.textContent = app.task.message;
            detailPanel.element.appendChild(error);
        }

        detailPanel.element.appendChild(createDetails(app));
    };

    const openBuildDetail = function (app: any) {
        detailApp = app;
        renderDetail(app);
        openingDetail = true;
        editor.call('picker:project', 'build-detail');
        openingDetail = false;
    };

    // create UI for single app
    const createAppItem = function (app: any, list: Container = container, options: any = {}) {
        const item = document.createElement('div');
        item.classList.add('build-item', app.task.status, app.type);
        item.id = options.summary ? `primary-app-${app.id}` : `app-${app.id}`;

        if (isPrimaryBuild(app)) {
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

        if (isPrimaryBuild(app)) {
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

        const artifact = document.createElement('a');
        artifact.classList.add('row-artifact');
        if (app.task.status === 'complete' && app.url) {
            artifact.href = app.url;
            artifact.target = '_blank';
            artifact.rel = 'noopener';
            artifact.classList.add(app.type === 'publish' ? 'open' : 'download');
            artifact.setAttribute('aria-label', app.type === 'publish' ? 'Open build' : 'Download build');
            const stop = function (e: MouseEvent) {
                e.stopPropagation();
            };
            artifact.addEventListener('click', stop);
            events.push({
                unbind: () => artifact.removeEventListener('click', stop)
            });
        } else {
            artifact.classList.add('placeholder');
            artifact.setAttribute('aria-hidden', 'true');
        }
        row.appendChild(artifact);

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

        const onItemClick = () => openBuildDetail(app);
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

        loadAppIndex(() => {
            editor.api.globals.rest.projects.projectBuilds(APP_LIMIT, 0).on('load', (status, data) => {
                const rows = data.result.map(normalizeBuildJob);
                const ids = getPublishAppIds(rows);
                const legacy = appList
                .filter(app => !ids.has(String(app.id)))
                .map(normalizeLegacyApp);
                apps = rows.concat(legacy).sort(compareBuildDate);
                hasMore = data.pagination ? rows.length < data.pagination.total : data.result.length === APP_LIMIT;

                if (showProgress) {
                    toggleProgress(false);
                }

                refreshApps();
                fillViewport();
            });
        });
    };

    // removes an app from the UI
    const removeApp = function (app: any) {
        const target = apps.find(item => isSameBuild(item, app)) || app;
        document.getElementById(`app-${target.id}`)?.remove();
        document.getElementById(`primary-app-${target.id}`)?.remove();

        const index = apps.findIndex(item => isSameBuild(item, target));
        if (index !== -1) {
            apps.splice(index, 1);
        }

        container.hidden = apps.length === 0;
        noBuilds.hidden = apps.length > 0;

        // drop the primary-build summary if its build was the one removed
        const primaryExists = apps.some(item => item.type === 'publish' && item.app_id === config.project.primaryApp);
        primaryBuildHeading.hidden = !primaryExists;
        primaryBuild.hidden = !primaryExists;

        if (detailApp && isSameBuild(detailApp, target)) {
            openBuildsPanel();
        }
    };

    const removeBuildJob = function (id: number) {
        const app = apps.find(item => item.build_job_id === id);
        if (app) {
            removeApp(app);
        } else if (detailApp?.build_job_id === id) {
            openBuildsPanel();
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
            const updated = apps.find(item => isSameBuild(item, detailApp));
            if (updated) {
                detailApp = updated;
                renderDetail(updated);
            } else if (!detailPanel.hidden) {
                renderDetail(detailApp);
            }
        }
    };

    // LOCAL UTILS

    // Vercel-style summary card for the primary build (richer than the history rows)
    const createPrimaryCard = function (app: any) {
        primaryBuild.dom.innerHTML = '';

        const card = document.createElement('div');
        card.classList.add('primary-build-card', app.task.status);
        card.id = `primary-app-${app.id}`;

        // project thumbnail — the icon that the history rows dropped for the status check/cross/spinner
        const thumb = document.createElement('img');
        thumb.classList.add('thumb');
        thumb.alt = '';
        thumb.src = config.project.thumbnails && (config.project.thumbnails.m || config.project.thumbnails.s) ||
            `${config.url.static}/platform/images/common/blank_project.png`;
        card.appendChild(thumb);

        const body = document.createElement('div');
        body.classList.add('body');
        card.appendChild(body);

        const nameRow = document.createElement('div');
        nameRow.classList.add('name-row');
        body.appendChild(nameRow);

        const status = document.createElement('span');
        status.classList.add('status', app.task.status);
        nameRow.appendChild(status);

        const name = document.createElement('span');
        name.classList.add('name');
        name.textContent = app.name;
        nameRow.appendChild(name);

        const sub = document.createElement('div');
        sub.classList.add('sub');
        const actor = app.actor && (app.actor.name || app.actor.username);
        sub.textContent = [`Last published ${formatBuildDate(app.created_at)}`, actor ? `by ${actor}` : null].filter(Boolean).join(' · ');
        body.appendChild(sub);

        if (app.url) {
            const link = document.createElement('a');
            link.classList.add('url');
            link.href = app.url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = app.url;
            body.appendChild(link);
        }

        const open = document.createElement('a');
        open.classList.add('open-external');
        open.target = '_blank';
        open.rel = 'noopener';
        open.setAttribute('aria-label', 'Open published build');
        if (app.url) {
            open.href = app.url;
        }
        card.appendChild(open);

        // click the card to open its detail page; links open the published app
        const onCardClick = (e: MouseEvent) => {
            if ((e.target as HTMLElement).closest('a')) {
                return;
            }
            openBuildDetail(app);
        };
        card.addEventListener('click', onCardClick);
        events.push({ unbind: () => card.removeEventListener('click', onCardClick) });

        primaryBuild.dom.appendChild(card);
    };

    const renderPrimaryBuild = function () {
        const app = apps.find(item => item.type === 'publish' && item.app_id === config.project.primaryApp);
        primaryBuildHeading.hidden = !app;
        primaryBuild.hidden = !app;

        if (app) {
            createPrimaryCard(app);
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

    const destroyDetailEvents = function () {
        detailEvents.forEach((evt) => {
            evt.unbind();
        });
        detailEvents = [];
    };

    // EVENTS

    // handle external updates to primary app
    editor.on('projects:primaryApp', (newValue, oldValue) => {
        if (!isPickerVisible()) {
            return;
        }

        refreshApps();
    });

    // handle app created externally
    editor.on('messenger:app.new', () => {
        if (!isPickerVisible()) {
            return;
        }

        loadedAppIndex = false;
        loadApps();
    });

    // handle external delete
    editor.on('messenger:app.delete', (data) => {
        if (!isPickerVisible()) {
            return;
        }

        removeApp(data.app);
    });

    editor.on('messenger:build_job.delete', (data) => {
        if (!isPickerVisible() || !data.build_job) {
            return;
        }

        removeBuildJob(Number(data.build_job.id));
    });

    // handle external app updates
    editor.on('messenger:app.update', () => {
        if (!isPickerVisible()) {
            return;
        }

        loadedAppIndex = false;
        loadApps();
    });

    editor.on('messenger:job.update', (msg: any) => {
        if (!isPickerVisible() || !msg.job) {
            return;
        }

        const id = Number(msg.job.id);
        if (!apps.some(app => app.job_id === id) && detailApp?.job_id !== id) {
            return;
        }

        loadApps(false);
    });

    // open publishing popup
    editor.method('picker:builds-publish', () => {
        detailApp = null;
        if (!detailPanel.hidden) {
            openingBuilds = true;
            destroyDetailEvents();
            detailPanel.element.innerHTML = '';
        }

        editor.call('picker:project', 'builds-publish');
        openingBuilds = false;
    });

    // on show
    panel.on('show', () => {
        detailApp = null;
        destroyDetailEvents();
        detailPanel.element.innerHTML = '';
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
        scrollContainer?.removeEventListener('scroll', onScroll);
        scrollContainer = null;

        if (openingDetail) {
            return;
        }

        apps = [];
        appIndex = {};
        appList = [];
        loadedAppIndex = false;
        detailApp = null;
        detailPanel.element.innerHTML = '';
        destroyTooltips();
        destroyEvents();
        destroyDetailEvents();

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    detailPanel.on('show', () => {
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    detailPanel.on('hide', () => {
        destroyDetailEvents();
        detailPanel.element.innerHTML = '';

        if (openingBuilds) {
            return;
        }

        apps = [];
        appIndex = {};
        appList = [];
        loadedAppIndex = false;
        detailApp = null;
        destroyTooltips();
        destroyEvents();

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    editor.on('viewport:hover', (state) => {
        if (state && isPickerVisible()) {
            setTimeout(() => {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });
});
