import type { MenuItem } from '@playcanvas/pcui';
import { Button, Container, Element, Label, Menu, Overlay, Progress, TextInput } from '@playcanvas/pcui';

import { bytesToHuman } from '@/common/utils';
import { config } from '@/editor/config';

import { button } from './components/button';
import { empty } from './components/empty';
import { spinner } from './components/spinner';
import { openProject as openProjectTab } from './tabs';

const PAGE_SIZE = 24;
const TABS = [
    ['all', 'All'],
    ['mine', 'Mine'],
    ['shared', 'Shared with me'],
    ['private', 'Private'],
    ['starred', 'Starred']
];
const SORTS = [
    ['modified', 'Last edited'],
    ['created', 'Created'],
    ['name', 'Name'],
    ['plays', 'Most played'],
    ['size', 'Size']
];
// home subtitle, picked once per page load (a prompt, like claude code's home, not stats)
const PROMPTS = [
    'What are we building today?',
    'Ready to make something?',
    'What should we make next?',
    'Pick up where you left off, or start something new.',
    'Got an idea for a scene?'
];
const PROMPT = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
// access you have to someone else's project; admin needs no badge, it's the default on yours and your orgs'
const QUALIFIERS = ['name:', 'owner:', 'desc:', 'is:private', 'is:public', 'is:starred', 'is:locked'];
const EMPTY_THUMBNAIL_IMAGE = `${config.url.frontend}static/img/blank-project.webp`;
const SIDE_KEY = 'editor:cms:sidebar:width';
const SIDE_DEFAULT_W = 248;
const SIDE_MIN_W = 200;
const SIDE_MAX_W = 420;

editor.once('load', () => {
    let rootUser;
    let currentUser;
    let accountUsage;
    let dropdownOrg;
    let menuProject;
    let filter = 'all'; // a tab id or an organization id
    let sortPolicy = 'modified';
    let sortDescending = true;
    let layout = 'grid';
    let shown = PAGE_SIZE;
    let rows = [];
    let events = [];
    let loading = false;
    // first load: nothing to show yet, so counts stay blank instead of reading 0
    const waiting = () => loading && !rootProjects().length;

    const projects = {};

    // DATA

    const orgs = () => rootUser?.organizations ?? [];
    const isOrg = (id) => orgs().some((org) => org.id === id);
    const userName = (user) => user.full_name || user.username;
    const avatarUrl = (id, size = 32) => `${config.url.api}/users/${id}/thumbnail?size=${size}`;
    const ownerName = (project) => {
        if (project.owner_id === rootUser.id) {
            return userName(rootUser);
        }
        const org = orgs().find((o) => o.id === project.owner_id);

        // the projects api sends the owner as a username string
        return org ? userName(org) : (project.owner?.full_name ?? project.owner?.username ?? project.owner ?? '');
    };
    // shared projects can arrive without owner details, so skip empty parts instead of leaving a stray dot
    const joined = (...parts) => parts.filter(Boolean).join(' · ');
    const isPending = (project) => project.new_owner_id != null || !!project.new_owner;
    // you, or an organization you're in, are being offered the project
    const isRecipient = (project) => project.new_owner_id === config.self.id || isOrg(project.new_owner_id);
    const blocked = (project) =>
        project.locked || project.access_level === 'none' || project.disabled || isPending(project);
    const rootProjects = () => projects[rootUser?.id] ?? [];
    const listFor = (id) => (isOrg(id) ? projects[id] : rootProjects()) ?? [];
    const matchTab = (project, tab) => {
        switch (tab) {
            case 'mine':
                return project.owner_id === config.self.id;
            case 'shared':
                return project.owner_id !== config.self.id;
            case 'private':
                return project.private;
            case 'starred':
                return !!project.star_id;
            default:
                return true;
        }
    };

    // search syntax: plain words match name, owner or description; `key:value` narrows to one field; quotes allow spaces
    const IS = {
        private: (p) => p.private,
        public: (p) => !p.private,
        starred: (p) => !!p.star_id,
        locked: (p) => !!p.locked
    };
    const parseQuery = (query) => {
        return [...query.matchAll(/(?:(\w+):)?("[^"]*"?|\S+)/g)]
            .map(([, key, value]) => [key?.toLowerCase(), value.replace(/"/g, '').toLowerCase()] as [string, string])
            .filter(([, value]) => value && !/^\w+:$/.test(value));
    };
    const has = (text, value) => (text ?? '').toLowerCase().includes(value);
    const matchTerm = (p, [key, value]) => {
        switch (key) {
            case 'name':
                return has(p.name, value);
            case 'owner':
                return has(ownerName(p), value);
            case 'desc':
                return has(p.description, value);
            case 'is':
                return !!IS[value]?.(p);
            default:
                return has(p.name, value) || has(ownerName(p), value) || has(p.description, value);
        }
    };
    const sortKey = {
        modified: (p) => Date.parse(p.modified),
        created: (p) => Date.parse(p.created),
        name: (p) => p.name.toLowerCase(),
        plays: (p) => p.plays ?? 0,
        size: (p) => p.size?.total ?? 0
    };
    const visible = () => {
        const terms = parseQuery(searchInput.value);
        const key = sortKey[sortPolicy];
        const dir = sortDescending ? -1 : 1;
        const list = listFor(filter);

        // plain words also match names with typos, like the editor's other searches
        const names = list.map((p) => [p.name, p]);
        const fuzzy = terms.map(([key, value]) => (key ? null : new Set(editor.call('search:items', names, value))));
        return list
            .filter(
                (p) =>
                    (isOrg(filter) || matchTab(p, filter)) && terms.every((t, i) => matchTerm(p, t) || fuzzy[i]?.has(p))
            )
            .sort(
                (a, b) =>
                    Number(isPending(b)) - Number(isPending(a)) ||
                    (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0) * dir
            );
    };
    const timeAgo = (date) => {
        const minutes = Math.max(0, Math.round((Date.now() - Date.parse(date)) / 60000));
        const unit = (n, u) => `${n} ${u}${n === 1 ? '' : 's'} ago`;
        if (minutes < 60) {
            return minutes < 1 ? 'just now' : unit(minutes, 'minute');
        }
        if (minutes < 1440) {
            return unit(Math.round(minutes / 60), 'hour');
        }
        if (minutes < 2880) {
            return 'yesterday';
        }
        if (minutes < 43200) {
            return unit(Math.round(minutes / 1440), 'day');
        }
        if (minutes < 525600) {
            return unit(Math.round(minutes / 43200), 'month');
        }
        return unit(Math.round(minutes / 525600), 'year');
    };
    const shortCount = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n ?? 0}`);
    const greeting = () => {
        const hour = new Date().getHours();
        return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    };

    // UI HELPERS

    const box = (cls, parent?: Container) => {
        const c = new Container({ class: cls });
        parent?.append(c);
        return c;
    };
    const text = (value, cls, parent?: Container) => {
        const l = new Label({ text: value, class: cls });
        parent?.append(l);
        return l;
    };
    // a focusable surface: Enter or Space on it presses it; keys on buttons inside it stay theirs
    const pressable = (el: HTMLElement, label: string, onPress: () => void) => {
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', label);
        el.addEventListener('keydown', (e) => {
            if (e.target === el && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onPress();
            }
        });
    };
    const image = (src, cls, parent?: Container) => {
        const img = new Element({ dom: 'img', class: cls });
        (img.dom as HTMLImageElement).src = src;
        (img.dom as HTMLImageElement).loading = 'lazy';
        (img.dom as HTMLImageElement).alt = '';
        parent?.append(img);
        return img;
    };
    // public is the default, so only private gets a badge
    const badges = (project, parent: Container) => {
        if (project.locked) {
            text('Locked', ['cms-badge', 'locked'], parent);
        }
        if (project.access_level === 'none' && !isPending(project)) {
            text('No access', 'cms-badge', parent);
        }
        if (project.disabled) {
            text('Disabled', ['cms-badge', 'disabled'], parent);
        }
        if (project.private) {
            text('Private', 'cms-badge', parent);
        }
    };
    // views, plays and stars in the card footer; forks show in list rows and the welcome card
    const stats = (project, parent: Container) => {
        const line = box('cms-stats', parent);
        if (project.access_level !== 'none') {
            text(shortCount(project.views), 'cms-views', line);
        }
        if (project.primary_app_url) {
            text(shortCount(project.plays), 'cms-plays', line);
        }
        if (canStar(project)) {
            starToggle(project, line);
        }
        return line;
    };
    // starring needs read access, which a no-access project doesn't give
    const canStar = (project) => project.access_level !== 'none';
    // optimistic, so the count moves on click; a failed call puts it back
    const starToggle = (project, parent: Container, cls?) => {
        const btn = new Button({ class: ['cms-star', ...[cls ?? []].flat()] });
        // set while a request is in flight, so the star fills before the server replies
        let pending = null;
        const paint = () => {
            const on = pending ?? !!project.star_id;
            btn.text = shortCount(project.starred);
            btn.class[on ? 'add' : 'remove']('on');
            btn.dom.title = on ? 'Unstar' : 'Star';
            btn.dom.setAttribute('aria-pressed', String(on));
        };
        btn.on('click', (e) => {
            e.stopPropagation();
            if (pending !== null) {
                return;
            }
            const { star_id: id, starred = 0 } = project;
            pending = !id;
            const settle = () => {
                pending = null;
                paint();
                renderTools();
            };
            const revert = () => {
                project.star_id = id;
                project.starred = starred;
                settle();
            };
            if (id) {
                project.star_id = null;
                project.starred = Math.max(0, starred - 1);
                editor.call('projects:unstar', id, settle, revert);
            } else {
                project.starred = starred + 1;
                editor.call(
                    'projects:star',
                    'project',
                    project.id,
                    (star) => {
                        project.star_id = star.id;
                        settle();
                    },
                    revert
                );
            }
            paint();
            renderTools();
        });
        paint();
        parent.append(btn);
        return btn;
    };
    const toggleWatch = (project) => {
        const { watch_id: id, watched = 0 } = project;
        const revert = () => {
            project.watch_id = id;
            project.watched = watched;
        };
        if (id) {
            project.watch_id = null;
            project.watched = Math.max(0, watched - 1);
            editor.call('projects:unwatch', id, null, revert);
        } else {
            project.watched = watched + 1;
            editor.call(
                'projects:watch',
                project.id,
                (watch) => {
                    project.watch_id = watch.id;
                },
                revert
            );
        }
    };
    // accept/decline for the recipient, cancel for the sender; both refresh the list when done
    const transferActions = (project, parent: Container) => {
        const actions = box(['cms-transfer', isRecipient(project) ? 'incoming' : 'outgoing'], parent);
        const act = (label, kind: 'primary' | 'secondary', call: () => Promise<unknown>) => {
            const btn = button({ kind, size: 'sm', text: label });
            btn.on('click', (e) => {
                e.stopPropagation();
                actions.enabled = false;
                call().then(refreshUI, (err) => {
                    actions.enabled = true;
                    editor.call(
                        'picker:project:buildAlert',
                        rightPanel,
                        typeof err === 'string' ? err : 'Could not update the transfer'
                    );
                });
            });
            actions.append(btn);
        };
        const decline = () =>
            new Promise((resolve, reject) => editor.call('projects:declineTransfer', project.id, resolve, reject));
        if (isRecipient(project)) {
            act('Decline', 'secondary', decline);
            act('Accept', 'primary', () => editor.call('projects:acceptTransfer', project.id));
        } else {
            act('Cancel transfer', 'secondary', decline);
        }
        return actions;
    };
    const pendingText = (project) =>
        isRecipient(project)
            ? ['Transfer request', `${ownerName(project) || 'The owner'} wants to give you this project`]
            : ['Transfer pending', `Waiting for ${project.new_owner || 'the new owner'} to accept`];
    // the owner, then up to two other members and a count
    const avatarGroup = (project, parent: Container) => {
        const group = box('cms-members', parent);
        image(avatarUrl(project.owner_id, 44), 'cms-avatar', group);
        const others = (project.users ?? []).filter((id) => id !== project.owner_id);
        others.slice(0, 2).forEach((id) => image(avatarUrl(id, 44), 'cms-avatar', group));
        if (others.length > 2) {
            text(`+${others.length - 2}`, 'cms-members-more', group);
        }
        if (others.length) {
            group.dom.title = `${others.length} other member${others.length === 1 ? '' : 's'}`;
        }
    };
    // a muted dash keeps a list column filled when there's no value
    const dash = (parent: Container, title?: string) => {
        const cell = text('—', ['cms-row-cell', 'dash'], parent);
        if (title) {
            cell.dom.title = title;
        }
    };
    const canDelete = (project) => {
        return (
            project.owner_id === config.self.id ||
            editor.call('project:management:isOrgAdmin', project.owner_id, config.self)
        );
    };

    // ACTIONS

    // opens the existing project picker for a project, the same way the old grid did
    const openProject = (project) => {
        if (project.disabled) {
            return;
        }
        if (project.locked) {
            editor.call('picker:project:lockedView', project);
        } else if (project.access_level === 'none') {
            editor.call('picker:project:noAdmin', project);
        } else {
            editor.call('picker:project:reduced', project);
        }
    };
    // projects never open in this tab: each gets its own, reused if it's already open
    const openEditor = (project) => openProjectTab(project.id);
    const launch = (project) => {
        if (project.primary_app_url) {
            window.open(project.primary_app_url, '_blank');
        }
    };

    const exportFromMenu = (project) => {
        toggleProgress(true, 100, `Exporting ${project.name}...`);
        editor
            .call('project:management:export', project.id)
            .then(
                (url) => window.open(url, '_blank'),
                (err) => editor.call('picker:project:buildAlert', rightPanel, err)
            )
            .finally(() => toggleProgress(false));
    };

    // displays or hides the loading bar in the CMS main panel based on parameter
    // a labelled call is an upload with real progress; a bare call means loading, shown as skeleton bones
    const toggleProgress = function (toggle: boolean, progress = 100, label = '') {
        if (label === '') {
            loading = toggle;
            progressBar.hidden = true;
            progressLabel.hidden = true;
            progressBarContainer.class.remove('progress-container-expand');
            if (toggle && rootUser) {
                refresh();
            }
            return;
        }
        progressBar.value = progress;
        progressBar.hidden = !toggle;
        progressLabel.hidden = false;
        progressLabel.text = label;
        progressBarContainer.class.add('progress-container-expand');
    };

    const bone = (cls, parent: Container) => {
        const b = new Element({ class: ['cms-bone', ...[cls].flat()] });
        parent.append(b);
        return b;
    };
    const renderSkeleton = () => {
        listContainer.clear();
        more.clear();
        listContainer.class[layout === 'grid' ? 'add' : 'remove']('grid');
        listContainer.class[layout === 'list' ? 'add' : 'remove']('rows');
        for (let i = 0; i < 6; i++) {
            if (layout === 'grid') {
                const card = box(['cms-card', 'skeleton'], listContainer);
                bone('thumb', box('cms-card-thumb', card));
                const body = box('cms-card-body', card);
                bone(['line', 'title'], body);
                bone(['line', 'full'], body);
                bone(['line', 'part'], body);
                bone(['line', 'meta'], body);
                bone(['line', 'stats'], box(['cms-stats', 'cms-card-foot'], card));
            } else {
                const row = box(['cms-row', 'skeleton'], listContainer);
                bone('row-thumb', row);
                const info = box('cms-row-info', row);
                bone(['line', 'title'], info);
                bone(['line', 'part'], info);
                box('cms-row-cell', row);
                bone(['line', 'cell'], row);
                bone(['line', 'cell'], row);
                bone(['line', 'cell'], row);
                bone(['line', 'cell'], row);
                box('cms-kebab-space', row);
            }
        }
    };

    // spinner used while the usage card reloads
    const toggleSpinner = (root: Container, toggle: boolean) => {
        root.clear();
        if (toggle) {
            root.append(spinner({ size: 'md', class: 'progress-icon' }));
        }
    };

    // OVERLAY

    const root = editor.call('layout.root');
    const overlay = new Overlay({
        clickable: false,
        class: 'picker-project-cms',
        hidden: true
    });
    root.append(overlay);

    const panel = box('cms-root');
    overlay.append(panel);

    // SIDEBAR

    // drag the right edge to resize, like the version control sidebar
    const side = new Container({
        class: 'cms-side',
        width: editor.call('localStorage:get', SIDE_KEY) || SIDE_DEFAULT_W,
        resizable: 'right',
        resizeMin: SIDE_MIN_W,
        resizeMax: SIDE_MAX_W
    });
    side.on('resize', () => editor.call('localStorage:set', SIDE_KEY, side.width));
    panel.append(side);

    const brand = box('cms-brand', side);
    brand.append(new Element({ class: 'cms-logo' }));
    text('PlayCanvas', 'cms-brand-name', brand);

    const newProjectSideButton = new Button({ class: 'cms-new', icon: 'E120', text: 'New project' });
    side.append(newProjectSideButton);
    newProjectSideButton.on('click', () => editor.call('picker:project:newProject'));

    // the sidebar holds both ways to start a project, so they're reachable from every page and scroll position
    const importSideButton = new Button({ class: ['cms-nav', 'cms-import'], icon: 'E222', text: 'Import project' });
    side.append(importSideButton);
    importSideButton.on('click', () => filePicker.click());

    const navItem = (icon, label, onClick) => {
        const item = new Button({ class: 'cms-nav', icon, text: label });
        side.append(item);
        item.on('click', onClick);
        return item;
    };
    const projectsNav = navItem('E139', 'Projects', () => setFilter('all'));
    navItem('E129', 'Explore', () => window.open(`${config.url.home}/explore/featured`, '_blank'));
    navItem('E232', 'Docs', () => window.open('https://developer.playcanvas.com/', '_blank'));

    const recentsHeader = text('Recents', 'cms-section', side);
    const recentsList = box('cms-side-list', side);

    const orgHeader = box('cms-section', side);
    text('Organizations', null, orgHeader);
    const addOrganizationButton = button({ kind: 'icon', size: 'sm', icon: 'E120', label: 'New organization' });
    orgHeader.append(addOrganizationButton);
    addOrganizationButton.on('click', () => editor.call('picker:project:newOrganization'));
    const orgList = box('cms-side-list', side);

    box('cms-gap', side);

    const storageCard = box('cms-storage', side);
    storageCard.dom.title = 'Storage details';
    storageCard.on('click', () => toggleStoragePopover());
    pressable(storageCard.dom, 'Storage details', () => toggleStoragePopover());

    const meRow = box('cms-me', side);
    const meAvatar = image(avatarUrl(config.self.id, 56), 'cms-me-avatar', meRow);
    const meText = box('cms-me-text', meRow);
    const meName = text('', 'cms-me-name', meText);
    const mePlan = text('', 'cms-me-plan', meText);
    const accountButton = button({ kind: 'icon', label: 'Account menu', class: 'cms-kebab' });
    meRow.append(accountButton);
    const openAccount = () => window.open(`${config.url.home}/account`, '_blank');
    meAvatar.on('click', openAccount);
    pressable(meAvatar.dom, 'Account settings', openAccount);

    // MAIN PANEL

    const main = box('cms-main', panel);
    const scroll = new Element({ class: 'cms-scroll' });
    main.append(scroll);
    const rightPanel = box('cms-col'); // also the root for alerts from other pickers
    scroll.dom.appendChild(rightPanel.dom);

    // progress bar and loading label
    const progressBarContainer = box('progress-container', rightPanel);
    const progressBar = new Progress({ value: 100, class: 'progress' });
    progressBar.hidden = true;
    const progressLabel = new Label({ text: 'Uploading', hidden: true });
    progressBarContainer.append(progressBar);
    progressBarContainer.append(progressLabel);

    // header
    const head = box('cms-head', rightPanel);
    const headText = box('cms-head-text', head);
    const title = text('', 'cms-title', headText);
    const subtitle = text('', 'cms-subtitle', headText);
    const orgMenuButton = button({ kind: 'icon', label: 'Organization actions', class: 'cms-kebab', hidden: true });
    head.append(orgMenuButton);
    const headerUtils = box('cms-head-actions', head);
    headerUtils.hidden = true; // only shown on the start screen; see refresh()

    // file picker
    const filePicker = document.createElement('input');
    filePicker.id = 'file-picker';
    filePicker.type = 'file';
    filePicker.accept = 'application/zip';
    filePicker.addEventListener('change', () => {
        importProject(filePicker.files);
        filePicker.value = null;
    });

    const importProjectButton = button({ kind: 'ghost', icon: 'E222', text: 'Import' });
    headerUtils.append(importProjectButton);
    importProjectButton.on('click', () => filePicker.click());

    const newProjectButton = button({ kind: 'primary', icon: 'E120', text: 'New project' });
    headerUtils.append(newProjectButton);
    newProjectButton.on('click', () => editor.call('picker:project:newProject'));

    // lets the blank page add its MCP button next to the account menu
    editor.method('picker:project:cms:addAccountButton', (button: Element) => {
        meRow.appendBefore(button, accountButton);
    });

    const welcome = box('cms-welcome', rightPanel);
    const sectionTitle = text('Projects', 'cms-heading', rightPanel);

    // search, filter hints, tabs, sort and layout stay pinned while the list scrolls
    const toolbar = box('cms-toolbar', rightPanel);

    // the divider only shows once the toolbar is pinned and cards scroll under it
    scroll.dom.addEventListener(
        'scroll',
        () => {
            const stuck = toolbar.dom.getBoundingClientRect().top <= scroll.dom.getBoundingClientRect().top;
            toolbar.class[stuck ? 'add' : 'remove']('stuck');
        },
        { passive: true }
    );
    const searchBox = box('cms-search', toolbar);
    const searchInput = new TextInput({
        class: 'cms-search-input',
        keyChange: true
    });
    searchBox.append(searchInput);
    // native placeholder, PCUI's own sits small and right-aligned
    searchInput.input.placeholder = 'Search projects, or filter with name:, owner:, desc:, is:';
    const clearSearch = button({
        kind: 'icon',
        size: 'sm',
        label: 'Clear search',
        class: 'cms-search-clear',
        hidden: true
    });
    searchBox.append(clearSearch);

    const hints = box('cms-hints', toolbar);
    text('Filter by', null, hints);
    QUALIFIERS.forEach((q) => {
        const chip = new Button({ class: 'cms-hint', text: q });
        hints.append(chip);
        chip.dom.addEventListener('mousedown', (e) => e.preventDefault()); // keep the cursor in the search box
        chip.on('click', () => {
            const value = searchInput.value.trim();
            searchInput.value = `${value}${value ? ' ' : ''}${q}`;
            searchInput.focus();
            const input = searchInput.input;
            input.setSelectionRange(input.value.length, input.value.length);
        });
    });
    text('Use quotes for spaces, e.g. name:"orbit arena"', 'cms-hints-tip', hints);

    const tools = box('cms-tools', toolbar);
    const tabs = box('cms-tabs', tools);
    const tabButtons = TABS.map(([id, label]) => {
        const tab = new Button({ class: 'cms-tab', text: label });
        const count = document.createElement('span');
        count.className = 'cms-count';
        tab.dom.appendChild(count);
        tabs.append(tab);
        tab.on('click', () => setFilter(id));
        return [id, tab, count] as const;
    });
    const sortButton = new Button({ class: 'cms-sort', text: 'Sort by' });
    const sortValue = document.createElement('span');
    sortValue.className = 'cms-sort-value';
    sortButton.dom.appendChild(sortValue);
    tools.append(sortButton);
    const layoutToggle = box('cms-layout', tools);
    const gridButton = new Button({ class: ['cms-layout-button', 'grid'] });
    gridButton.dom.title = 'Cards';
    gridButton.dom.setAttribute('aria-label', 'Show as cards');
    const listButton = new Button({ class: ['cms-layout-button', 'list'] });
    listButton.dom.title = 'List';
    listButton.dom.setAttribute('aria-label', 'Show as list');
    layoutToggle.append(gridButton);
    layoutToggle.append(listButton);
    gridButton.on('click', () => setLayout('grid'));
    listButton.on('click', () => setLayout('list'));

    const listContainer = box('cms-list', rightPanel);
    const more = box('cms-more', rightPanel);

    // MENUS

    const menuItem = (id, label, onSelect, cls?) => ({ id, text: label, onSelect, class: cls });
    const addMenu = (cls, items) => {
        const menu = new Menu({ class: ['cms-menu', ...[cls].flat()], items, hidden: true });
        root.append(menu);
        return menu;
    };
    const menuEntry = (menu: Menu, id) => (menu.dom.querySelector(`#${id}`) as HTMLElement & { ui?: MenuItem })?.ui;
    const showMenu = (menu: Menu, anchor: Element, alignRight = false) => {
        menu.hidden = false;
        const rect = anchor.dom.getBoundingClientRect();
        const width = (menu.dom.querySelector('.pcui-menu-items') as HTMLElement)?.offsetWidth ?? 180;
        menu.position(alignRight ? rect.right - width : rect.left, rect.bottom + 4);
    };

    const sortMenu = addMenu('picker-builds-filter-menu', [
        ...SORTS.map(([id, label]) => menuItem(`cms-sort-${id}`, label, () => setSort(id, id !== 'name'))),
        menuItem('cms-sort-desc', 'Descending', () => setSort(sortPolicy, true)),
        menuItem('cms-sort-asc', 'Ascending', () => setSort(sortPolicy, false))
    ]);
    sortButton.on('click', () => {
        SORTS.forEach(([id]) =>
            menuEntry(sortMenu, `cms-sort-${id}`)?.class[id === sortPolicy ? 'add' : 'remove']('selected')
        );
        menuEntry(sortMenu, 'cms-sort-desc')?.class[sortDescending ? 'add' : 'remove']('selected');
        menuEntry(sortMenu, 'cms-sort-asc')?.class[sortDescending ? 'remove' : 'add']('selected');
        showMenu(sortMenu, sortButton, true);
    });

    // grouped: open it, about it, copies of it, then handing it over or removing it
    const rowMenu = addMenu('picker-builds-menu', [
        menuItem('cms-row-editor', 'Open editor', () => openEditor(menuProject), 'primary'),
        menuItem('cms-row-launch', 'Play', () => launch(menuProject)),
        menuItem('cms-row-settings', 'Project settings', () => openProject(menuProject), 'cms-menu-group'),
        menuItem('cms-row-copy', 'Copy link', () =>
            navigator.clipboard.writeText(`${config.url.home}/editor/project/${menuProject.id}`)
        ),
        menuItem('cms-row-watch', 'Watch', () => toggleWatch(menuProject), 'cms-menu-group'),
        menuItem('cms-row-fork', 'Fork', () => editor.call('picker:project:fork', menuProject)),
        menuItem('cms-row-export', 'Export', () => exportFromMenu(menuProject)),
        menuItem(
            'cms-row-transfer',
            'Transfer ownership',
            () => editor.call('picker:project:modal:transferProject', menuProject),
            'cms-menu-group'
        ),
        menuItem(
            'cms-row-delete',
            'Delete project',
            () => editor.call('picker:project:modal:deleteProjectConfirmation', menuProject),
            'delete'
        )
    ]);
    const showRowMenu = (project, anchor: Element) => {
        menuProject = project;
        menuEntry(rowMenu, 'cms-row-editor').enabled = !blocked(project);
        menuEntry(rowMenu, 'cms-row-launch').enabled = !!project.primary_app_url;
        menuEntry(rowMenu, 'cms-row-watch').text = project.watch_id ? 'Stop watching' : 'Watch';
        menuEntry(rowMenu, 'cms-row-watch').hidden = !canStar(project);
        menuEntry(rowMenu, 'cms-row-fork').hidden = blocked(project);
        menuEntry(rowMenu, 'cms-row-export').hidden =
            blocked(project) || !editor.call('project:management:canExport', project);
        menuEntry(rowMenu, 'cms-row-transfer').hidden =
            blocked(project) || !editor.call('project:management:canTransfer', project);
        menuEntry(rowMenu, 'cms-row-delete').hidden = !canDelete(project);
        showMenu(rowMenu, anchor, true);
    };

    // same look as the project menu, with delete set apart in red
    const orgDropdownMenu = addMenu('picker-builds-menu', [
        menuItem('organization-details', 'Organization details', () =>
            window.open(`${config.url.home}/user/${dropdownOrg.username}/account`, '_blank')
        ),
        menuItem(
            'organization-delete',
            'Delete organization',
            () => editor.call('picker:project:deleteOrganization', projects[dropdownOrg.id]),
            ['cms-menu-group', 'delete']
        )
    ]);
    orgMenuButton.on('click', () => {
        dropdownOrg = orgs().find((org) => org.id === filter);
        showMenu(orgDropdownMenu, orgMenuButton, true);
    });

    const accountMenu = addMenu('picker-builds-menu', [
        menuItem('cms-account-settings', 'Account settings', () => window.open(`${config.url.home}/account`, '_blank')),
        menuItem('cms-account-upgrade', 'Upgrade plan', () =>
            window.open(`${config.url.home}/upgrade?account=${rootUser.username}`, '_blank')
        ),
        menuItem('cms-account-feedback', 'Feedback', () =>
            window.open('https://forum.playcanvas.com/t/playcanvas-editor-feedback/616', '_blank')
        ),
        menuItem('cms-account-github', 'GitHub', () => window.open('https://github.com/playcanvas/editor', '_blank'))
    ]);
    accountButton.on('click', () => {
        accountMenu.hidden = false;

        // opens above the account row and spans it, like the mcp popover beside it
        const rect = meRow.dom.getBoundingClientRect();
        accountMenu.innerElement.style.width = `${rect.width}px`;
        accountMenu.position(rect.left, rect.top - accountMenu.innerElement.clientHeight - 4);
    });

    // storage breakdown, anchored next to the storage card
    const storagePopover = box('cms-storage-popover');
    storagePopover.hidden = true;
    root.append(storagePopover);
    const closeStorage = (e: MouseEvent) => {
        if (!storagePopover.dom.contains(e.target as Node) && !storageCard.dom.contains(e.target as Node)) {
            toggleStoragePopover(false);
        }
    };
    const toggleStoragePopover = (show = storagePopover.hidden) => {
        storagePopover.hidden = !show;
        storageCard.class[show ? 'add' : 'remove']('open');
        document[show ? 'addEventListener' : 'removeEventListener']('mousedown', closeStorage);
        if (!show || !accountUsage) {
            return;
        }
        const allowance = currentUser.limits.diskAllowance * 1000 * 1000;
        const owned = listFor(filter)
            .filter((p) => p.owner_id === currentUser.id)
            .sort((a, b) => (b.size?.total ?? 0) - (a.size?.total ?? 0));
        storagePopover.clear();
        const top = box('cms-pop-head', storagePopover);
        text('Storage', 'cms-pop-title', top);
        text(userName(currentUser), 'cms-pop-plan', top);
        const big = box('cms-pop-big', storagePopover);
        text(bytesToHuman(accountUsage.total), 'cms-pop-used', big);
        text(`of ${bytesToHuman(allowance)} used`, 'cms-pop-of', big);
        const bar = box('cms-bar', storagePopover);
        const fill = new Element({ class: 'cms-bar-fill' });
        bar.append(fill);
        fill.style.width = `${Math.min(100, (accountUsage.total / allowance) * 100)}%`;
        const largest = box('cms-pop-rows', storagePopover);
        text('Largest projects', 'cms-pop-key', largest);
        owned.slice(0, 4).forEach((p) => {
            const r = box('cms-pop-row', largest);
            text(p.name, null, r);
            text(bytesToHuman(p.size?.total ?? 0), 'value', r);
        });
        const free = box('cms-pop-rows', storagePopover);
        const r = box('cms-pop-row', free);
        text('Free', null, r);
        text(bytesToHuman(Math.max(0, allowance - accountUsage.total)), 'value', r);
        const upgrade = button({ kind: 'primary', text: 'Upgrade plan' });
        storagePopover.append(upgrade);
        upgrade.on('click', () => window.open(`${config.url.home}/upgrade?account=${currentUser.username}`, '_blank'));
        const rect = storageCard.dom.getBoundingClientRect();
        storagePopover.style.left = `${rect.right + 8}px`;
        storagePopover.style.bottom = `${window.innerHeight - rect.bottom}px`;
    };

    // RENDER

    const renderUsage = () => {
        toggleSpinner(storageCard, true);
        editor.call('users:getUsage', currentUser.id, (res) => {
            accountUsage = res;
            const allowance = currentUser.limits.diskAllowance * 1000 * 1000;
            const percent = Math.min(100, Math.round((accountUsage.total / allowance) * 100));
            toggleSpinner(storageCard, false);
            const top = box('cms-storage-row', storageCard);
            text('Storage', 'cms-storage-title', top);
            text(`${percent}%`, null, top);
            const bar = box('cms-bar', storageCard);
            const fill = new Element({ class: 'cms-bar-fill' });
            bar.append(fill);
            fill.style.width = `${percent}%`;
            const bottom = box('cms-storage-row', storageCard);
            text(`${bytesToHuman(accountUsage.total)} of ${bytesToHuman(allowance)}`, null, bottom);
            const upgrade = text('Upgrade', 'cms-storage-upgrade', bottom);
            upgrade.on('click', (e) => {
                e.stopPropagation();
                window.open(`${config.url.home}/upgrade?account=${currentUser.username}`, '_blank');
            });
            renderHead();
        });
    };

    const renderSidebar = () => {
        projectsNav.class[isOrg(filter) ? 'remove' : 'add']('active');

        recentsList.clear();
        if (loading && !rootProjects().length) {
            for (let i = 0; i < 5; i++) {
                const item = box(['cms-side-item', 'skeleton'], recentsList);
                bone('side-thumb', item);
                bone(['line', 'label'], item);
            }
        }
        rootProjects()
            .filter((p) => !blocked(p))
            .sort((a, b) => Date.parse(b.modified) - Date.parse(a.modified))
            .slice(0, 5)
            .forEach((p) => {
                const item = box('cms-side-item', recentsList);
                image(p.thumbnails?.s ?? p.thumbnails?.m ?? EMPTY_THUMBNAIL_IMAGE, 'cms-side-thumb', item);
                text(p.name, 'cms-side-label', item);
                item.dom.title = p.name;
                item.on('click', () => openProject(p));
            });
        recentsHeader.hidden = !recentsList.dom.children.length;

        orgList.clear();
        orgs().forEach((org) => {
            const item = box(['cms-side-item', 'org'], orgList);
            item.class[filter === org.id ? 'add' : 'remove']('active');
            image(avatarUrl(org.id, 44), 'cms-side-thumb', item);
            text(userName(org), 'cms-side-label', item);
            text(waiting() ? '' : `${(projects[org.id] ?? []).length}`, 'cms-side-count', item);
            item.on('click', () => setFilter(org.id));
        });

        if (rootUser) {
            meName.text = userName(rootUser);
            mePlan.text = rootUser.username;
        }
    };

    const renderHead = () => {
        const org = orgs().find((o) => o.id === filter);
        orgMenuButton.hidden = !org;
        sectionTitle.hidden = !!org;

        if (org) {
            title.text = userName(org);
            subtitle.text = `Organization · ${(projects[org.id] ?? []).length} projects`;
        } else {
            // counts live on the tabs and storage on the sidebar card, so home gets a prompt
            title.text = `${greeting()}, ${userName(rootUser)}`;
            subtitle.text = PROMPT;
        }
    };

    // the most recently edited project you can open
    const renderWelcome = () => {
        welcome.clear();
        const list = rootProjects();
        if (loading && !list.length) {
            welcome.hidden = isOrg(filter);
            welcome.class.add('skeleton');
            bone('welcome-thumb', welcome);
            const info = box('cms-welcome-info', welcome);
            bone(['line', 'eyebrow'], info);
            bone(['line', 'title'], info);
            bone(['line', 'part'], info);
            bone(['line', 'meta'], info);
            bone(['line', 'stats'], info);
            return;
        }
        welcome.class.remove('skeleton');
        const lead = list.filter((p) => !blocked(p)).sort((a, b) => Date.parse(b.modified) - Date.parse(a.modified))[0];
        welcome.hidden = !lead || isOrg(filter);
        if (!lead) {
            return;
        }
        // framed so the hover zoom stays inside the rounded corners, like the card thumbnails
        image(lead.thumbnails?.m ?? EMPTY_THUMBNAIL_IMAGE, null, box('cms-welcome-thumb', welcome));
        const info = box('cms-welcome-info', welcome);

        // three groups: what the project is, its facts, then what you can do with it
        const titles = box('cms-welcome-titles', info);
        text('Continue editing', 'cms-eyebrow', titles);
        const name = box('cms-welcome-name', titles);
        text(lead.name, null, name);
        badges(lead, name);
        if (lead.description) {
            text(lead.description, 'cms-welcome-desc', titles);
        }

        // labelled values; counts that don't apply are left out, like on the cards
        const facts = box('cms-facts', info);
        const fact = (label, value) => {
            const item = box('cms-fact', facts);
            text(label, 'cms-fact-label', item);
            const v = box('cms-fact-value', item);
            text(value, null, v);
            return v;
        };
        const owner = ownerName(lead);
        if (owner) {
            fact('Owner', owner).prepend(image(avatarUrl(lead.owner_id, 36), 'cms-avatar'));
        }
        fact('Edited', timeAgo(lead.modified));
        fact('Views', shortCount(lead.views));
        if (lead.primary_app_url) {
            fact('Plays', shortCount(lead.plays));
        }
        if (lead.fork_count) {
            fact('Forks', shortCount(lead.fork_count));
        }
        fact('Size', bytesToHuman(lead.size?.total ?? 0));
        // actions sit under the details so the card reads as one unit on wide screens
        const actions = box('cms-welcome-actions', info);
        const edit = button({ kind: 'primary', icon: 'E130', text: 'Open editor' });
        actions.append(edit);
        edit.dom.addEventListener('mousedown', (e) => e.stopPropagation());
        edit.on('click', (e) => {
            e.stopPropagation();
            openEditor(lead);
        });
        if (lead.primary_app_url) {
            const play = button({ kind: 'primary', icon: 'E286', text: 'Play' });
            actions.append(play);
            play.on('click', (e) => {
                e.stopPropagation();
                launch(lead);
            });
        }

        // same actions menu as the cards
        kebabFor(lead, actions);
        welcome.dom.onclick = () => openProject(lead);
    };

    const renderTools = () => {
        const org = isOrg(filter);
        tabs.hidden = org;
        tabButtons.forEach(([id, tab, count]) => {
            count.textContent = waiting() ? '' : `${rootProjects().filter((p) => matchTab(p, id)).length}`;
            tab.class[filter === id ? 'add' : 'remove']('active');
        });
        sortValue.textContent = `${SORTS.find(([id]) => id === sortPolicy)[1]}${sortDescending ? '' : ' (ascending)'}`;
        gridButton.class[layout === 'grid' ? 'add' : 'remove']('active');
        listButton.class[layout === 'list' ? 'add' : 'remove']('active');
        const query = searchInput.value;
        clearSearch.hidden = !query;
        toolbar.class[query ? 'add' : 'remove']('has-query');
    };

    const buildCard = (project) => {
        const card = box(['cms-card', ...cardState(project)], listContainer);
        card.dom.tabIndex = 0;
        const thumb = box('cms-card-thumb', card);
        image(project.thumbnails?.m ?? EMPTY_THUMBNAIL_IMAGE, null, thumb);
        const tags = box('cms-card-tags', thumb);
        if (project.private) {
            text('Private', 'cms-badge', tags);
        }
        // editing a shared project is the norm, so only flag the exception
        if (project.owner_id !== config.self.id && project.access_level === 'read') {
            text('Read only', ['cms-badge', 'info'], tags);
        }
        const pending = isPending(project);
        if (pending) {
            text(pendingText(project)[0], ['cms-badge', 'transfer'], tags);
        }

        // pending transfers get a badge and a byline instead of a cover
        const cover = pending
            ? null
            : project.locked
              ? ['Locked', 'The owner is over their storage limit']
              : project.access_level === 'none'
                ? ['No access', `Ask ${ownerName(project) || 'the owner'} for an invite`]
                : project.disabled
                  ? ['Disabled', 'Contact support to restore it']
                  : null;
        if (cover) {
            const c = box(project.locked ? ['cms-card-cover', 'locked'] : 'cms-card-cover', thumb);
            text(cover[0], 'cms-cover-title', c);
            text(cover[1], null, c);
        }
        const body = box('cms-card-body', card);
        const titleRow = box('cms-card-title', body);
        text(project.name, 'cms-card-name', titleRow);
        if (!pending) {
            kebabFor(project, titleRow);
        }
        text(
            project.description || 'No description',
            project.description ? 'cms-card-desc' : ['cms-card-desc', 'empty'],
            body
        );
        // avatars, then the owner over the edit time, so the name gets the full width
        const meta = box('cms-card-meta', body);
        avatarGroup(project, meta);
        const byline = box('cms-card-byline', meta);
        text(ownerName(project), 'cms-card-owner', byline).dom.title = ownerName(project);
        const when = sortPolicy === 'created' ? `created ${timeAgo(project.created)}` : timeAgo(project.modified);
        if (pending) {
            const status = isRecipient(project) ? `Offered ${when}` : `Sent to ${project.new_owner} ${when}`;
            text(status, ['cms-card-when', 'transfer'], byline);
        } else {
            text(when, 'cms-card-when', byline);
        }

        // counts and size get their own strip so the owner line keeps the full width
        if (pending) {
            transferActions(project, card).class.add('cms-card-foot');
            return;
        }
        const foot = stats(project, card);
        foot.class.add('cms-card-foot');
        text(bytesToHuman(project.size?.total ?? 0), 'cms-card-size', foot);
        bindOpen(card, project);
    };

    const buildRow = (project) => {
        const row = box(['cms-row', ...cardState(project)], listContainer);
        row.dom.tabIndex = 0;
        const thumbSrc = project.thumbnails?.s ?? project.thumbnails?.m ?? EMPTY_THUMBNAIL_IMAGE;
        if (project.locked) {
            // same lock as the card cover, over the thumbnail
            image(thumbSrc, null, box(['cms-row-thumb', 'locked'], row));
        } else {
            image(thumbSrc, 'cms-row-thumb', row);
        }
        const pending = isPending(project);
        const info = box(pending ? ['cms-row-info', 'has-actions'] : 'cms-row-info', row);
        const textCol = pending ? box('cms-row-text', info) : info;
        const name = box('cms-row-name', textCol);
        text(project.name, null, name);
        badges(project, name);
        text(
            pending
                ? pendingText(project)[1]
                : project.access_level === 'none'
                  ? 'Ask the owner for access'
                  : project.locked
                    ? 'Owner is over the storage limit'
                    : project.disabled
                      ? 'Disabled by support'
                      : joined(ownerName(project), project.description),
            'cms-row-sub',
            textCol
        );
        if (pending) {
            transferActions(project, info).class.add('cms-row-actions');
            [0, 1, 2, 3, 4].forEach(() => dash(row));
            text(timeAgo(project.modified), 'cms-row-cell', row);
            box('cms-row-cell', row);
            return;
        }
        text(
            shortCount(project.fork_count ?? 0),
            ['cms-row-cell', 'cms-forks', ...(project.fork_count ? [] : ['zero'])],
            row
        );
        if (project.access_level !== 'none') {
            text(shortCount(project.views), ['cms-row-cell', 'cms-views'], row);
        } else {
            dash(row);
        }
        if (project.primary_app_url) {
            text(shortCount(project.plays), ['cms-row-cell', 'cms-plays'], row);
        } else {
            dash(row, 'Not published');
        }
        if (canStar(project)) {
            starToggle(project, row, 'cms-row-cell');
        } else {
            dash(row);
        }
        text(bytesToHuman(project.size?.total ?? 0), 'cms-row-cell', row);
        text(timeAgo(project.modified), 'cms-row-cell', row);
        kebabFor(project, row);
        bindOpen(row, project);
    };

    const cardState = (project) =>
        [
            project.disabled && 'is-off',
            (project.locked || project.access_level === 'none') && !isPending(project) && 'is-dim'
        ].filter(Boolean);
    const bindOpen = (item: Container, project) => {
        item.on('click', () => openProject(project));
        pressable(item.dom, project.name, () => openProject(project));
    };
    const kebabFor = (project, parent: Container) => {
        const kebab = button({ kind: 'icon', label: 'Project actions', class: 'cms-kebab' });
        parent.append(kebab);
        kebab.on('click', (e) => {
            e.stopPropagation();
            showRowMenu(project, kebab);
        });
    };

    const renderMore = () => {
        more.clear();
        if (!rows.length) {
            return;
        }
        if (shown < rows.length) {
            more.append(spinner());
            text(`Loading more · showing ${shown} of ${rows.length}`, null, more);

            // the observer only fires on changes, so re-observe to catch a sentinel still in view
            observer.unobserve(more.dom);
            observer.observe(more.dom);
        } else {
            text(rows.length === 1 ? '1 project shown' : `All ${rows.length} projects shown`, null, more);
        }
    };

    const renderList = () => {
        if (loading) {
            return renderSkeleton();
        }
        rows = visible();
        shown = PAGE_SIZE;
        listContainer.clear();
        listContainer.class[layout === 'grid' ? 'add' : 'remove']('grid');
        listContainer.class[layout === 'list' ? 'add' : 'remove']('rows');
        if (!rows.length) {
            const query = searchInput.value.trim();
            const starred = !query && filter === 'starred';
            const action = starred
                ? undefined
                : button({ kind: 'secondary', text: query ? 'Clear search' : 'New project' });
            action?.on('click', () => (query ? (searchInput.value = '') : editor.call('picker:project:newProject')));
            listContainer.append(
                empty({
                    class: 'cms-empty',
                    title: query ? `No projects match ${query}` : starred ? 'No starred projects' : 'No projects yet',
                    text: query
                        ? 'Try fewer filters, or clear the search.'
                        : starred
                          ? 'Star a project to keep it here.'
                          : 'Create one, or import a project export.',
                    action
                })
            );
        }
        // column headers so every number reads against its column
        if (layout === 'list' && rows.length) {
            const head = box(['cms-row', 'cms-row-head'], listContainer);
            box('cms-row-head-thumb', head);
            text('Project', 'cms-row-head-name', head);
            ['Forks', 'Views', 'Plays', 'Stars', 'Size', 'Edited'].forEach((label) =>
                text(label, 'cms-row-cell', head)
            );
            box('cms-row-head-actions', head);
        }
        rows.slice(0, shown).forEach(layout === 'grid' ? buildCard : buildRow);
        renderMore();
    };

    // appends the next page when the bottom of the list scrolls into view
    const loadMore = () => {
        if (shown >= rows.length) {
            return;
        }
        rows.slice(shown, shown + PAGE_SIZE).forEach(layout === 'grid' ? buildCard : buildRow);
        shown += PAGE_SIZE;
        renderMore();
    };
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[entries.length - 1].isIntersecting) {
                loadMore();
            }
        },
        { root: scroll.dom, rootMargin: '300px' }
    );
    observer.observe(more.dom);

    const refresh = () => {
        if (!rootUser) {
            return;
        }
        renderSidebar();

        // nothing to browse yet: the greeting and actions take the centre, like claude code's start screen;
        // otherwise the sidebar's new project and import cover it
        const start = !loading && !isOrg(filter) && !rootProjects().length;
        rightPanel.class[start ? 'add' : 'remove']('start');
        headerUtils.hidden = !start;
        renderHead();
        renderWelcome();
        renderTools();
        renderList();
    };

    // CONTROLLERS

    const setFilter = (id) => {
        filter = id;
        const org = orgs().find((o) => o.id === id);
        scroll.dom.scrollTop = 0;
        if (org) {
            editor.call('users:loadOne', org.id, (res) => {
                // another filter was picked while this user loaded
                if (filter !== id) {
                    return;
                }
                currentUser = res;
                renderUsage();
                refresh();
            });
        } else {
            const changed = currentUser !== rootUser;
            currentUser = rootUser;
            if (changed) {
                renderUsage();
            }
            refresh();
        }
    };

    const setSort = (policy, descending) => {
        sortPolicy = policy;
        sortDescending = descending;
        renderTools();
        renderList();
    };

    const setLayout = (value) => {
        layout = value;
        renderTools();
        renderList();
    };

    searchInput.on('change', () => {
        renderTools();
        renderList();
    });
    clearSearch.on('click', () => {
        searchInput.value = '';
        searchInput.focus();
    });

    // checks whether importing is allowed for current user based on permissions
    const importDisabled = () => {
        return !(
            currentUser.id === config.self.id ||
            editor.call('project:management:isOrgAdmin', currentUser.id, config.self)
        );
    };

    // handles the flow for project importing including error and loading states
    const importProject = async (files) => {
        if (importDisabled() || files.length === 0) {
            return;
        }

        toggleProgress(true, 0, 'Uploading... Please stand by');

        try {
            const result = await editor.invoke('projects:uploadExport', files[0], (progress) => {
                // progress returned by Ajax is in range 0-1
                progressBar.value = progress * 100;
            });
            progressLabel.text = "Upload Complete! Importing... (Please don't close this window)";

            const importer = editor.call('picker:project:cms:currentUser');

            // a job update listener reacts to status changes, the import can outlive the request
            let job = null;
            const jobStatusEvent = editor.on('messenger:job.update', async (msg) => {
                if (msg.job.id === job.id) {
                    jobStatusEvent.unbind();
                }

                const jobInfo = await editor.call('projects:getJobStatus', msg.job.id);
                if (jobInfo.status === 'complete') {
                    toggleProgress(false);

                    const report = jobInfo.data.import_report?.count ? jobInfo.data.import_report : null;
                    if (importer.organization) {
                        // organization viewers have no access to the new project, so list it instead of opening it
                        loadProjects();
                        if (report) {
                            editor.call('picker:project:newProjectConfirmation', null, report);
                        }
                    } else {
                        editor.call('picker:project:newProjectConfirmation', jobInfo.data.project_id, report);
                    }
                } else if (jobInfo.status === 'error') {
                    toggleProgress(false);
                    console.error(jobInfo.messages[0] || 'There was an error while importing');
                    editor.call('picker:project:buildAlert', rightPanel, 'Could not import project');
                }
            });
            events.push(jobStatusEvent);

            job = await editor.call('projects:importNew', result.s3Key, importer.id);
        } catch (error) {
            toggleProgress(false);
            if (error) {
                console.error(error);
            }
            editor.call('picker:project:buildAlert', rightPanel, 'Could not import project');
        }
    };

    // loads your projects and each organization's into the CMS main panel
    const loadProjects = () => {
        // only the first load shows skeletons; a reload swaps the list in place, keeping how far you'd scrolled
        const reload = rootUser.id in projects;
        if (!reload) {
            toggleProgress(true);
        }
        const owners = [rootUser, ...orgs()];
        const promises = owners.map((owner) => {
            return editor.call(
                'projects:list',
                owner.id,
                editor.call('project:management:showOwnerView', owner) ? 'profile' : null
            );
        });

        Promise.all(promises).then((values) => {
            values.forEach((value, i) => {
                projects[owners[i].id] = value.result ?? [];
            });
            const [top, count] = [scroll.dom.scrollTop, shown];
            toggleProgress(false);
            refresh();
            if (reload) {
                while (shown < count && shown < rows.length) {
                    loadMore();
                }
                scroll.dom.scrollTop = top;
            }
        });
    };

    const refreshUI = () => {
        loadProjects();
        renderUsage();
    };

    // helper method to destroy all outstanding events on close
    const destroyEvents = () => {
        events.forEach((evt) => evt?.unbind());
        events = [];
    };

    // EVENTS

    overlay.on('hide', () => {
        destroyEvents();
        toggleStoragePopover(false);
        searchInput.value = '';
        setFilter('all');
        editor.call('picker:project:hideAlerts');
    });

    // focus search with /, only when no dialog or menu sits on top
    window.addEventListener('keydown', (e) => {
        if (
            overlay.hidden ||
            (e.target as HTMLElement).matches('input, textarea') ||
            document.querySelector(
                '.pcui-overlay:not(.pcui-hidden):not(.picker-project-cms), .pcui-menu:not(.pcui-hidden)'
            )
        ) {
            return;
        }
        if (e.key === '/') {
            e.preventDefault();
            searchInput.focus();
        }
    });

    editor.method('picker:project:cms:currentUser', () => {
        return currentUser;
    });

    editor.method('picker:project:cms:rootUser', () => {
        return rootUser;
    });

    // hook to reset filter to All (user projects)
    editor.method('picker:project:cms:resetFilter', () => {
        setFilter('all');
    });

    // hook to retrieve the organization whose menu was last opened
    editor.method('picker:project:cms:dropdownOrg', () => {
        return dropdownOrg;
    });

    // hook to refresh list of organizations
    editor.method('picker:project:cms:refreshOrgs', (organization, deleteOrg = false) => {
        if (!deleteOrg) {
            rootUser.organizations.push(organization);
        } else {
            rootUser.organizations = rootUser.organizations.filter((org) => org.id !== organization.id);
        }
        loadProjects();

        // open the new organization as the owner, so new projects, imports and storage are its own
        if (!deleteOrg) {
            setFilter(organization.id);
        }
    });

    // method to display panel
    editor.method('picker:project:cms', () => {
        // first open: show the skeleton now so the bare editor layout doesn't show while the user loads
        if (!rootUser) {
            loading = true;
            title.text = greeting();
            subtitle.text = PROMPT;
            renderSidebar();
            renderWelcome();
            renderSkeleton();
            overlay.hidden = false;
        }
        editor.call('users:loadOne', config.self.id, (user) => {
            rootUser = user;
            currentUser = rootUser;
            filter = 'all';
            refresh();
            loadProjects();
            renderUsage();
            overlay.hidden = false;
        });
    });

    editor.on('messenger:project.create', () => {
        if (overlay.hidden) {
            return;
        }
        refreshUI();
    });

    editor.on('messenger:project.delete', () => {
        if (overlay.hidden) {
            return;
        }
        refreshUI();
        editor.call('picker:project:cms:toggleProgress', false);
    });

    editor.on('messenger:project.user.image', () => {
        if (rootUser) {
            refreshUI();
        }
    });

    // hook to retrieve main CMS panel (used to display errors from other files)
    editor.method('picker:project:cms:getPanel', () => {
        return panel;
    });

    // settings, team and transfer changes elsewhere on the page
    editor.on('projects:changed', () => refreshUI());

    editor.method('picker:project:cms:toggleProgress', (toggle) => {
        toggleProgress(toggle);
    });
});
