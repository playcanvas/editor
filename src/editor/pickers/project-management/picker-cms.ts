import type { MenuItem } from '@playcanvas/pcui';
import { Button, Container, Element, Label, Menu, Overlay, TextInput } from '@playcanvas/pcui';

import { backend, UNSUPPORTED_TIP } from '@/common/backend';
import { supports } from '@/common/supports';
import { TooltipHandle } from '@/common/tooltips';
import { bytesToHuman, countToHuman, escapeHtml } from '@/common/utils';
import { PROJECTS_OPENED_KEY } from '@/core/constants';
import { config } from '@/editor/config';
import type { EditorBlankConfig } from '@/editor-api';

import { inPlace, readUrl, setUrl, withParams } from '../picker-url';

import { button } from './components/button';
import { empty } from './components/empty';
import { spinner } from './components/spinner';
import { openProject as openProjectTab } from './tabs';

const PAGE_SIZE = 24;
// a linked project that doesn't exist, or that you can't see
const CANT_OPEN = "This project couldn't be opened. It may have been deleted, or you may not have access to it.";
// a user named in the url that doesn't exist
const NO_USER = "This user couldn't be found. They may have changed their username or deleted their account.";
const TABS = [
    ['all', 'All'],
    ['mine', 'Mine'],
    ['shared', 'Shared with me'],
    ['private', 'Private'],
    ['starred', 'Starred']
];
const SORTS = [
    ['modified', 'Last edited'],
    ['opened', 'Last opened'],
    ['created', 'Created'],
    ['name', 'Name'],
    ['views', 'Most viewed'],
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
// a profile's links, in order, with the old profile page's icons
const SOCIAL_LINKS = {
    website: {
        label: 'Website',
        icon: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 12h18M12 3c2.2 2.2 3.5 5.29 3.5 9S14.2 18.8 12 21c-2.2-2.2-3.5-5.29-3.5-9S9.8 5.2 12 3Zm0 0a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    },
    x: {
        label: 'X',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>'
    },
    linkedin: {
        label: 'LinkedIn',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>'
    },
    youtube: {
        label: 'YouTube',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.499 6.203a3 3 0 0 0-2.11-2.12C19.523 3.5 12 3.5 12 3.5s-7.523 0-9.389.583a3 3 0 0 0-2.11 2.12A31.123 31.123 0 0 0 0 12a31.123 31.123 0 0 0 .501 5.797 3 3 0 0 0 2.11 2.12C4.477 20.5 12 20.5 12 20.5s7.523 0 9.389-.583a3 3 0 0 0 2.11-2.12A31.123 31.123 0 0 0 24 12a31.123 31.123 0 0 0-.501-5.797ZM9.75 15.568V8.432L16.023 12 9.75 15.568Z"/></svg>'
    }
};
// plans show as an orange tile beside a profile's name, the size of an organization's avatar
const PLAN_DIAMOND =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5.5" fill="#f60"/><path d="M8.5 6.5h7l3 3.8L12 18 5.5 10.3zM5.5 10.3h13M10.5 6.5l-1.2 3.8L12 18l2.7-7.7-1.2-3.8" fill="none" stroke="#1d292c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const PLAN_BUILDING =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5.5" fill="#f60"/><path d="M8 17.5V7.5h5v10M13 10.5h3v7M6.5 17.5h11M10 10h1M10 12.5h1M10 15h1" fill="none" stroke="#1d292c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const PLAN_SHIELD =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5.5" fill="#f60"/><path d="M12 5.2l5.5 2v4.3c0 3.4-2.3 6.2-5.5 7.3-3.2-1.1-5.5-3.9-5.5-7.3V7.2zM9.4 12l1.8 1.8 3.4-3.6" fill="none" stroke="#1d292c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// by the backend's plan types; free is the default and guests have no plan, so neither gets an icon
const PLANS = {
    personal: { label: 'Personal', icon: PLAN_DIAMOND },
    pro: { label: 'Pro', icon: PLAN_DIAMOND },
    org: { label: 'Organization', icon: PLAN_BUILDING },
    organization: { label: 'Organization', icon: PLAN_BUILDING },
    'super-user': { label: 'Super-user', icon: PLAN_SHIELD }
};
const CALENDAR_ICON =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" stroke-width="1.75"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';
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

    // a New project open over the page hides its loading placeholders
    const covered = () => readUrl(location.href).new;

    const projects = {};

    // DATA

    const orgs = () => rootUser?.organizations ?? [];
    const isOrg = (id) => orgs().some((org) => org.id === id);
    // another user's projects, opened read-only from the page config; your sidebar, storage and recents stay yours
    let profileOwner = null;
    const isProfile = (id) => !!profileOwner && id === profileOwner.id;
    // the main area shows one owner's projects: an organization's, or a profile's
    const isOwnerView = (id) => isOrg(id) || isProfile(id);
    // a signed-out visitor can only browse a profile: no account, recents, organizations or storage
    const signedIn = !!config.self;
    const selfId = config.self?.id;
    const userName = (user) => user.full_name || user.username;
    const avatarUrl = (id, size = 32) => `${config.url.api}/users/${id}/thumbnail?size=${size}`;
    const ownerName = (project) => {
        if (project.owner_id === rootUser?.id) {
            return userName(rootUser);
        }
        if (isProfile(project.owner_id)) {
            return userName(profileOwner);
        }
        const org = orgs().find((o) => o.id === project.owner_id);

        // the projects api sends the owner as a username string
        return org ? userName(org) : (project.owner?.full_name ?? project.owner?.username ?? project.owner ?? '');
    };
    // shared projects can arrive without owner details, so skip empty parts instead of leaving a stray dot
    const joined = (...parts) => parts.filter(Boolean).join(' · ');
    const isPending = (project) => project.new_owner_id != null || !!project.new_owner;
    // you, or an organization you're in, are being offered the project
    const isRecipient = (project) => project.new_owner_id === selfId || isOrg(project.new_owner_id);
    const blocked = (project) =>
        project.locked || project.access_level === 'none' || project.disabled || isPending(project);
    const rootProjects = () => projects[rootUser?.id] ?? [];
    // yours and every organization's, each once, for recents
    const allProjects = () => [
        ...new Map(
            [rootUser?.id, ...orgs().map((o) => o.id)].flatMap((id) => projects[id] ?? []).map((p) => [p.id, p])
        ).values()
    ];
    // your own profile is what others see of it: the public projects you own
    const listFor = (id) =>
        (id === selfId && isProfile(id)
            ? rootProjects().filter((p) => p.owner_id === selfId && !p.private)
            : isOwnerView(id)
              ? projects[id]
              : rootProjects()) ?? [];
    const matchTab = (project, tab) => {
        switch (tab) {
            case 'mine':
                return project.owner_id === selfId;
            case 'shared':
                return project.owner_id !== selfId;
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
    // last opened in this browser first, then last edited
    const byRecent = () => {
        const opened = editor.call('localStorage:get', PROJECTS_OPENED_KEY) ?? {};
        return (a, b) => (opened[b.id] ?? 0) - (opened[a.id] ?? 0) || Date.parse(b.modified) - Date.parse(a.modified);
    };

    const sortKey = {
        modified: (p) => Date.parse(p.modified),
        created: (p) => Date.parse(p.created),
        name: (p) => p.name.toLowerCase(),
        views: (p) => p.views ?? 0,
        plays: (p) => p.plays ?? 0,
        size: (p) => p.size?.total ?? 0
    };
    const visible = () => {
        const terms = parseQuery(searchInput.value);
        const key = sortKey[sortPolicy];
        const recent = byRecent();
        const dir = sortDescending ? -1 : 1;
        const list = listFor(filter);

        // plain words also match names with typos, like the editor's other searches
        const names = list.map((p) => [p.name, p]);
        const fuzzy = terms.map(([key, value]) => (key ? null : new Set(editor.call('search:items', names, value))));
        return list
            .filter(
                (p) =>
                    (isOwnerView(filter) || matchTab(p, filter)) &&
                    terms.every((t, i) => matchTerm(p, t) || fuzzy[i]?.has(p))
            )
            .sort(
                (a, b) =>
                    Number(isPending(b)) - Number(isPending(a)) ||
                    (key ? (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0) : -recent(a, b)) * dir
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
            text(countToHuman(project.views), 'cms-views', line);
        }
        if (project.primary_app_url) {
            text(countToHuman(project.plays), 'cms-plays', line);
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
        const btn = new Button({
            class: ['cms-star', ...[cls ?? []].flat()],
            enabled: signedIn && !!backend().projectFollowing
        });
        // set while a request is in flight, so the star fills before the server replies
        let pending = null;
        const paint = () => {
            const on = pending ?? !!project.star_id;
            btn.text = countToHuman(project.starred);
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
        actions.enabled = !!backend().projectTransfer;
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
            signedIn &&
            (project.owner_id === selfId || editor.call('project:management:isOrgAdmin', project.owner_id, config.self))
        );
    };

    // ACTIONS

    // opens the existing project picker for a project, the same way the old grid did, on a linked section if any;
    // signed out, only its read-only settings
    const openProject = (project, section?: string) => {
        if (project.disabled) {
            return;
        }
        if (!signedIn) {
            editor.call('picker:project:guest', project, section);
        } else if (project.locked) {
            editor.call('picker:project:lockedView', project, section);
        } else if (project.access_level === 'none') {
            editor.call('picker:project:noAdmin', project, section);
        } else {
            editor.call('picker:project:reduced', project, section);
        }
    };
    // projects never open in this tab: each gets its own, reused if it's already open
    const openEditor = (project) => openProjectTab(project.id);
    const launch = (project) => {
        if (project.primary_app_url) {
            window.open(project.primary_app_url, '_blank');
        }
    };

    const exportFromMenu = (project) => editor.call('progress:card:export', project);

    // loading is shown as skeleton bones
    const toggleProgress = function (toggle: boolean) {
        loading = toggle;
        if (toggle && rootUser) {
            refresh();
        }
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
        if (covered()) {
            return;
        }
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

    // the backend's services; without one, its controls stay and are disabled
    const importable = !!backend().projectImport;
    const accounts = !!backend().accountManagement;
    const pages = !!backend().pages;
    // in the overlay, since the layout root's tooltips sit below the page
    const unsupported = (target: Element, align: 'top' | 'bottom' | 'left' | 'right' = 'bottom') =>
        TooltipHandle.attach({ root: overlay.dom, target: target.dom, ...UNSUPPORTED_TIP, align });

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
    const importSideButton = new Button({
        class: ['cms-nav', 'cms-import'],
        icon: 'E222',
        text: 'Import project',
        enabled: importable
    });
    side.append(importSideButton);
    if (!importable) {
        unsupported(importSideButton, 'left');
    }
    importSideButton.on('click', () => filePicker.click());

    const navItem = (icon, label, onClick) => {
        const item = new Button({ class: 'cms-nav', icon, text: label });
        side.append(item);
        item.on('click', onClick);
        return item;
    };
    // the site's pages outside the editor, where the backend has them
    const openPage = (path: (pages: NonNullable<ReturnType<typeof backend>['pages']>) => string) => {
        if (supports('pages')) {
            window.open(`${config.url.home}${path(backend().pages)}`, '_blank');
        }
    };

    const projectsNav = navItem('E139', 'Projects', () => setFilter('all'));
    navItem('E129', 'Explore', () => window.open(`${config.url.home}/explore/featured`, '_blank'));
    navItem('E232', 'Docs', () => window.open('https://developer.playcanvas.com/', '_blank'));

    // recents and organizations scroll, so storage and the account row stay pinned at the bottom
    const sideScroll = box('cms-side-scroll', side);
    const recentsHeader = text('Recents', 'cms-section', sideScroll);
    const recentsList = box('cms-side-list', sideScroll);

    const orgHeader = box('cms-section', sideScroll);
    text('Organizations', null, orgHeader);
    const addOrganizationButton = button({ kind: 'icon', size: 'sm', icon: 'E120', label: 'New organization' });
    orgHeader.append(addOrganizationButton);
    addOrganizationButton.on('click', () => editor.call('picker:project:newOrganization'));
    const orgList = box('cms-side-list', sideScroll);

    const storageCard = box('cms-storage', side);
    storageCard.dom.title = 'Storage details';
    storageCard.on('click', () => toggleStoragePopover());
    pressable(storageCard.dom, 'Storage details', () => toggleStoragePopover());

    const meRow = box('cms-me', side);
    const meAvatar = image(signedIn ? avatarUrl(selfId, 56) : EMPTY_THUMBNAIL_IMAGE, 'cms-me-avatar', meRow);
    const meText = box('cms-me-text', meRow);
    const meName = text('', 'cms-me-name', meText);
    const mePlan = text('', 'cms-me-plan', meText);
    const accountButton = button({ kind: 'icon', label: 'Account menu', class: 'cms-kebab' });
    meRow.append(accountButton);
    const openAccount = () => openPage((site) => site.account());

    // your profile is the same page others see, opened in place
    const openOwnProfile = () => {
        if (rootUser) {
            openUser(rootUser);
        }
    };
    if (signedIn) {
        meAvatar.on('click', openOwnProfile);
        pressable(meAvatar.dom, 'Your profile', openOwnProfile);
    }

    // MAIN PANEL

    const main = box('cms-main', panel);

    // phones: a top bar replaces the sidebar, which opens as a drawer
    const topbar = box('cms-topbar', main);
    const drawerButton = button({ kind: 'icon', label: 'Open menu', class: 'cms-topbar-menu' });
    topbar.append(drawerButton);
    drawerButton.on('click', () => panel.class.add('drawer-open'));
    topbar.append(new Element({ class: 'cms-logo' }));
    const topbarTitle = text('Projects', 'cms-topbar-title', topbar);
    const topbarNew = button({ kind: 'primary', size: 'sm', icon: 'E120', text: 'New', class: 'cms-topbar-new' });
    topbarNew.dom.setAttribute('aria-label', 'New project');
    topbar.append(topbarNew);
    topbarNew.on('click', () => editor.call('picker:project:newProject'));

    // signed out: an invitation where your storage and account would be, since starting a project, recents and
    // organizations all need an account
    if (!signedIn) {
        [newProjectSideButton, importSideButton, projectsNav, sideScroll, storageCard, meRow, topbarNew].forEach(
            (el) => (el.hidden = true)
        );
        const { login, signup } = (config as unknown as EditorBlankConfig).url;
        const guest = box(['cms-storage', 'cms-guest'], side);
        text('New to PlayCanvas?', 'cms-storage-title', guest);
        text(
            'Build 3D games and apps in your browser, edit together in real time and publish with one click.',
            'cms-guest-text',
            guest
        );
        const actions = box('cms-guest-actions', guest);
        const signUp = button({ kind: 'primary', size: 'sm', text: 'Sign up' });
        const logIn = button({ kind: 'secondary', size: 'sm', text: 'Log in' });
        actions.append(signUp);
        actions.append(logIn);
        // the backend sends where its sign-up and log-in pages are; without one, its button stays hidden
        signUp.hidden = !signup;
        logIn.hidden = !login;
        signUp.on('click', () => window.location.assign(signup));
        logIn.on('click', () => window.location.assign(login));
    }

    // tapping the scrim or anything in the drawer closes it
    panel.dom.addEventListener('click', (e) => {
        const el = e.target as HTMLElement;
        if (el === panel.dom || el.closest('.cms-side .pcui-button, .cms-side .cms-side-item')) {
            panel.class.remove('drawer-open');
        }
    });
    const scroll = new Element({ class: 'cms-scroll' });
    main.append(scroll);
    const rightPanel = box('cms-col'); // also the root for alerts from other pickers
    scroll.dom.appendChild(rightPanel.dom);

    // a profile is a public page: a banner from the avatar, who they are, then their public totals
    const profileNote = text(
        'This is how others see your profile. Only public projects are shown.',
        'cms-profile-note',
        rightPanel
    );
    const profile = box('cms-profile', rightPanel);
    const bannerArt = image(EMPTY_THUMBNAIL_IMAGE, null, box('cms-profile-banner', profile));
    const profileBar = box('cms-profile-bar', profile);
    const profileAvatar = image(EMPTY_THUMBNAIL_IMAGE, 'cms-profile-avatar', profileBar);

    // your own profile is edited in account settings
    const editProfile = button({ kind: 'secondary', icon: 'E130', text: 'Edit profile', hidden: true });
    profileBar.append(editProfile);
    editProfile.on('click', openAccount);
    const profileInfo = box('cms-profile-info', profile);
    const about = box('cms-profile-about', profileInfo);
    const profileName = box('cms-profile-name', about);
    const profileTitle = text('', 'cms-title', profileName);
    const planIcon = new Element({ dom: 'span', class: 'cms-profile-plan' });
    profileName.append(planIcon);
    const planTip = TooltipHandle.attach({
        root: overlay.dom,
        target: planIcon.dom,
        align: 'bottom',
        class: 'cms-tip'
    });
    const profileOrgs = box('cms-profile-orgs', profileName);
    const profileUser = text('', 'cms-subtitle', about);
    const profileMetas = box('cms-profile-metas', about);
    const skillChips = box('cms-chips', about);
    const totals = box('cms-profile-totals', profileInfo);
    let orgTips = [];
    profile.hidden = profileNote.hidden = true;

    // header
    const head = box('cms-head', rightPanel);

    // an owner's page leads with their avatar, or the organization's logo
    const headAvatar = image(EMPTY_THUMBNAIL_IMAGE, 'cms-head-avatar', head);
    headAvatar.hidden = true;
    const headText = box('cms-head-text', head);
    const headName = box('cms-head-name', headText);
    const title = text('', 'cms-title', headName);
    const headPlan = text('', ['cms-badge', 'plan'], headName);
    headPlan.hidden = true;
    const subtitle = text('', 'cms-subtitle', headText);

    // the bar names the page, but not the greeting
    title.on('change', (t: string) => {
        topbarTitle.text = t && !t.startsWith('Good ') ? t : 'Projects';
    });
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

    const importProjectButton = button({ kind: 'ghost', icon: 'E222', text: 'Import', enabled: importable });
    headerUtils.append(importProjectButton);
    if (!importable) {
        unsupported(importProjectButton, 'top');
    }
    importProjectButton.on('click', () => filePicker.click());

    const newProjectButton = button({ kind: 'primary', icon: 'E120', text: 'New project' });
    headerUtils.append(newProjectButton);
    newProjectButton.on('click', () => editor.call('picker:project:newProject'));

    // lets the blank page add its MCP button next to the account menu
    editor.method('picker:project:cms:addAccountButton', (button: Element) => {
        meRow.appendBefore(button, accountButton);
    });

    const welcome = box('cms-welcome', rightPanel);
    const heading = box('cms-heading', rightPanel);
    const headingText = text('Projects', null, heading);
    const headingCount = text('', 'cms-count', heading);

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
        menuEntry(rowMenu, 'cms-row-watch').hidden = !signedIn || !canStar(project);
        menuEntry(rowMenu, 'cms-row-watch').enabled = !!backend().projectFollowing;
        menuEntry(rowMenu, 'cms-row-fork').hidden = !signedIn || blocked(project);

        // forks finish as jobs
        menuEntry(rowMenu, 'cms-row-fork').enabled = !!(backend().projectCreation && backend().jobs);
        menuEntry(rowMenu, 'cms-row-export').hidden =
            blocked(project) || !editor.call('project:management:canExport', project);
        menuEntry(rowMenu, 'cms-row-export').enabled = !!(backend().projectExport && backend().jobs);
        menuEntry(rowMenu, 'cms-row-transfer').hidden =
            blocked(project) || !editor.call('project:management:canTransfer', project);
        menuEntry(rowMenu, 'cms-row-transfer').enabled = !!backend().projectTransfer;
        menuEntry(rowMenu, 'cms-row-delete').hidden = !canDelete(project);
        menuEntry(rowMenu, 'cms-row-delete').enabled = !!backend().projectManagement;
        showMenu(rowMenu, anchor, true);
    };

    // same look as the project menu, with delete set apart in red
    const orgDropdownMenu = addMenu('picker-builds-menu', [
        {
            ...menuItem('organization-details', 'Organization details', () =>
                openPage((site) => `${site.user(dropdownOrg.username)}/account`)
            ),
            onIsEnabled: () => pages
        },
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
        menuItem('cms-account-profile', 'Your profile', openOwnProfile),
        { ...menuItem('cms-account-settings', 'Account settings', openAccount), onIsEnabled: () => pages },
        {
            ...menuItem('cms-account-upgrade', 'Upgrade plan', () =>
                window.open(`${config.url.home}/upgrade?account=${rootUser.username}`, '_blank')
            ),
            onIsEnabled: () => accounts
        },
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

    // one tooltip, moved to each rebuilt upgrade button. beside the popover and above it, which would
    // otherwise cover its arrow and the gap the pointer crosses to reach its links
    const upgradeTooltip = accounts
        ? null
        : TooltipHandle.make({ root, ...UNSUPPORTED_TIP, align: 'left', class: 'cms-popover-tooltip' });

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
        const upgrade = button({ kind: 'primary', text: 'Upgrade plan', enabled: accounts });
        storagePopover.append(upgrade);
        upgradeTooltip?.attach(upgrade.dom);
        upgrade.on('click', () => window.open(`${config.url.home}/upgrade?account=${currentUser.username}`, '_blank'));
        const rect = storageCard.dom.getBoundingClientRect();
        storagePopover.style.left = `${rect.right + 8}px`;
        storagePopover.style.bottom = `${window.innerHeight - rect.bottom}px`;
    };

    // RENDER

    const renderUsage = () => {
        // signed out there's no storage to show
        if (!currentUser) {
            return;
        }
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
            upgrade.enabled = accounts;
            upgrade.on('click', (e) => {
                e.stopPropagation();
                window.open(`${config.url.home}/upgrade?account=${currentUser.username}`, '_blank');
            });
            renderHead();
        });
    };

    const renderSidebar = () => {
        projectsNav.class[isOwnerView(filter) ? 'remove' : 'add']('active');

        recentsList.clear();
        if (loading && !rootProjects().length && !covered()) {
            for (let i = 0; i < 5; i++) {
                const item = box(['cms-side-item', 'skeleton'], recentsList);
                bone('side-thumb', item);
                bone(['line', 'label'], item);
            }
        }
        allProjects()
            .filter((p) => !blocked(p))
            .sort(byRecent())
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

    const renderProfile = () => {
        const owner = profileOwner;
        editProfile.hidden = !pages || owner.id !== selfId;
        const art = avatarUrl(owner.id, 256);
        (bannerArt.dom as HTMLImageElement).src = art;
        (profileAvatar.dom as HTMLImageElement).src = art;
        profileTitle.text = userName(owner);
        profileUser.text = owner.username;

        // free is the default, so only paid plans get an icon, named in its tooltip
        const plan = PLANS[owner.plan_type];
        planIcon.hidden = !plan;
        planIcon.dom.innerHTML = plan?.icon ?? '';
        planIcon.dom.setAttribute('aria-label', plan ? `${plan.label} plan` : '');
        planTip.html = plan ? `<b>${plan.label}</b> plan` : '';

        // the organizations they're in, like the old profile page; only your own user carries them
        orgTips.forEach((tip) => tip.destroy());
        profileOrgs.clear();
        orgTips = (owner.organizations ?? []).map((org) => {
            const a = new Container({ dom: 'a', class: 'cms-profile-org' });
            const dom = a.dom as HTMLAnchorElement;
            dom.href = withParams(location.href, { user: org.username });
            dom.setAttribute('aria-label', userName(org));
            dom.addEventListener('click', (e) => {
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    openUser(org);
                }
            });
            image(avatarUrl(org.id, 44), null, a);
            profileOrgs.append(a);
            return TooltipHandle.attach({
                root: overlay.dom,
                target: dom,
                align: 'bottom',
                class: 'cms-tip',
                html: `Member of <b>${escapeHtml(userName(org))}</b>`
            });
        });

        // skills are stored as lowercase keys
        skillChips.clear();
        (owner.skills ?? []).forEach((k) => text(k.charAt(0).toUpperCase() + k.slice(1), 'cms-chip', skillChips));
        skillChips.hidden = !skillChips.dom.children.length;

        // only web links: the urls are the owner's own input
        profileMetas.clear();
        for (const link of owner.social_profiles ?? []) {
            if (!SOCIAL_LINKS[link?.provider] || !/^https?:\/\//.test(link?.url ?? '')) {
                continue;
            }
            const { label, icon } = SOCIAL_LINKS[link.provider];
            const url = new URL(link.url);
            const path = url.pathname.replace(/\/+$/, '');

            // a handle reads better than its url on x
            const shown =
                link.provider === 'x' && path
                    ? `@${path.split('/').pop()}`
                    : `${url.hostname.replace(/^www\./, '')}${path}`;
            const a = new Container({ dom: 'a', class: 'cms-profile-link' });
            const dom = a.dom as HTMLAnchorElement;
            dom.href = link.url;
            dom.target = '_blank';
            dom.rel = 'noopener noreferrer nofollow ugc';
            dom.title = label;
            dom.innerHTML = icon;
            text(shown, null, a);
            profileMetas.append(a);
        }
        if (owner.created_at) {
            const since = new Date(owner.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
            const joinedAt = text(`Joined ${since}`, 'cms-profile-joined', profileMetas);
            joinedAt.dom.insertAdjacentHTML('afterbegin', CALENDAR_ICON);
        }

        // public totals; blank while the projects load, instead of reading 0
        totals.clear();
        const list = listFor(owner.id);
        const sum = (key) => list.reduce((n, p) => n + (p[key] ?? 0), 0);
        [
            ['views', 'view'],
            ['plays', 'play'],
            ['starred', 'star']
        ].forEach(([key, word]) => {
            const n = sum(key);
            const item = box('cms-profile-total', totals);
            text(loading ? '' : countToHuman(n), 'cms-profile-count', item);
            text(n === 1 ? word : `${word}s`, null, item);
        });
    };

    const renderHead = () => {
        const org = orgs().find((o) => o.id === filter);
        const onProfile = isProfile(filter);
        profile.hidden = !onProfile;
        profileNote.hidden = !onProfile || profileOwner.id !== selfId;
        head.hidden = onProfile;
        orgMenuButton.hidden = !org;
        headAvatar.hidden = !org;
        head.class[org ? 'add' : 'remove']('owner');
        headPlan.hidden = !org;
        headingText.text = onProfile ? 'Public projects' : 'Projects';
        headingCount.text = onProfile && !loading ? `${listFor(filter).length}` : '';

        if (onProfile) {
            renderProfile();

            // the phone bar names the page
            title.text = userName(profileOwner);
        } else if (org) {
            (headAvatar.dom as HTMLImageElement).src = avatarUrl(org.id, 128);
            headPlan.text = 'organization';
            title.text = userName(org);
            subtitle.text = joined(org.username, `${(projects[org.id] ?? []).length} projects`);
        } else {
            // counts live on the tabs and storage on the sidebar card, so home gets a prompt. with no
            // accounts there's no one signed in to greet by name
            title.text = accounts ? `${greeting()}, ${userName(rootUser)}` : greeting();
            subtitle.text = PROMPT;
        }
    };

    // the project you last opened, or else last edited, that you can open
    const renderWelcome = () => {
        welcome.clear();
        const list = allProjects();
        if (loading && !list.length) {
            welcome.hidden = isOwnerView(filter) || covered();
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
        const lead = list.filter((p) => !blocked(p)).sort(byRecent())[0];
        welcome.hidden = !lead || isOwnerView(filter);
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
        fact('Views', countToHuman(lead.views));
        if (lead.primary_app_url) {
            fact('Plays', countToHuman(lead.plays));
        }
        if (lead.fork_count) {
            fact('Forks', countToHuman(lead.fork_count));
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

        // same actions menu as the cards; phones show the one in the facts instead
        kebabFor(lead, actions);
        kebabFor(lead, facts);
        welcome.dom.onclick = () => openProject(lead);
    };

    const renderTools = () => {
        const org = isOwnerView(filter);
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
        // editing a shared project is the norm, so only flag the exception; on a profile, read only is the norm
        if (project.owner_id !== selfId && project.access_level === 'read' && !isProfile(filter)) {
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
        // a profile's cards are its owner's public work, so they skip the owner, size and actions
        const onProfile = isProfile(filter);
        const body = box(onProfile ? ['cms-card-body', 'public'] : 'cms-card-body', card);
        const titleRow = box('cms-card-title', body);
        text(project.name, 'cms-card-name', titleRow);
        if (!pending && !onProfile) {
            kebabFor(project, titleRow);
        }
        text(
            project.description || 'No description',
            project.description ? 'cms-card-desc' : ['cms-card-desc', 'empty'],
            body
        );
        // avatars, then the owner over the edit time, so the name gets the full width
        if (!onProfile) {
            const meta = box('cms-card-meta', body);
            avatarGroup(project, meta);
            const byline = box('cms-card-byline', meta);
            text(ownerName(project), 'cms-card-owner', byline).dom.title = ownerName(project);
            const when = sortPolicy === 'created' ? `created ${timeAgo(project.created)}` : timeAgo(project.modified);
            if (pending) {
                const status = isRecipient(project) ? `Offered ${when}` : `Sent to ${project.new_owner} ${when}`;
                text(status, ['cms-card-when', 'transfer'], byline);
            } else {
                // the size sits with the date, so the footer only holds counts and fits a 200px card
                text(joined(when, bytesToHuman(project.size?.total ?? 0)), 'cms-card-when', byline);
            }
        }

        // counts get their own strip so the owner line keeps the full width
        if (pending) {
            transferActions(project, card).class.add('cms-card-foot');
            return;
        }
        const foot = stats(project, card);
        foot.class.add('cms-card-foot');
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
            countToHuman(project.fork_count ?? 0),
            ['cms-row-cell', 'cms-forks', ...(project.fork_count ? [] : ['zero'])],
            row
        );
        if (project.access_level !== 'none') {
            text(countToHuman(project.views), ['cms-row-cell', 'cms-views'], row);
        } else {
            dash(row);
        }
        if (project.primary_app_url) {
            text(countToHuman(project.plays), ['cms-row-cell', 'cms-plays'], row);
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
        // nothing to show until you, or signed out a profile, has loaded
        if (!rootUser && !profileOwner) {
            return;
        }
        renderSidebar();

        // nothing to browse yet: the greeting and actions take the centre, like claude code's start screen;
        // otherwise the sidebar's new project and import cover it
        const start = !loading && !isOwnerView(filter) && !rootProjects().length;
        rightPanel.class[start ? 'add' : 'remove']('start');
        headerUtils.hidden = !start;
        renderHead();
        renderWelcome();
        renderTools();
        renderList();
    };

    // CONTROLLERS

    const setFilter = (id) => {
        if (isProfile(id) !== isProfile(filter)) {
            sortPolicy = isProfile(id) ? 'views' : 'modified';
            sortDescending = true;
        }
        filter = id;
        const org = orgs().find((o) => o.id === id);

        // the url names the user whose page is open, so it reloads, links and goes back to it
        setUrl({ user: isProfile(id) ? profileOwner.username : (org?.username ?? null) });
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
            importable &&
            signedIn &&
            (currentUser.id === selfId || editor.call('project:management:isOrgAdmin', currentUser.id, config.self))
        );
    };

    // the upload, import and outcome show on a card of their own, beside any other running jobs
    const importProject = (files) => {
        if (importDisabled() || files.length === 0) {
            return;
        }
        editor.call('progress:card:import', files[0], editor.call('picker:project:cms:currentUser'));
    };

    // loads your projects, each organization's and an open profile's into the CMS main panel
    const loadProjects = () => {
        // only the first load shows skeletons; a reload swaps the list in place, keeping how far you'd scrolled
        const reload = (rootUser ?? profileOwner).id in projects;
        if (!reload) {
            toggleProgress(true);
        }
        // signed out there's no you or organizations to load, only the profile
        const visitor = profileOwner && profileOwner !== rootUser;
        const owners = [...(rootUser ? [rootUser, ...orgs()] : []), ...(visitor ? [profileOwner] : [])];
        const promises = owners.map((owner) => {
            // a profile lists only the owner's public projects, even to members who could see more
            if (owner === profileOwner) {
                return editor.call('projects:list', owner.id, 'public');
            }
            const ownView = editor.call('project:management:showOwnerView', owner);
            return editor.call('projects:list', owner.id, ownView ? 'profile' : null);
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

    // opens a user's page in place: an organization you're in opens as usual, anyone else as a profile
    const openUser = (user) => {
        if (isOrg(user.id)) {
            setFilter(user.id);
            return;
        }
        profileOwner = user.id === selfId ? rootUser : user;

        // skeletons until their projects arrive, instead of an empty list
        if (!(user.id in projects)) {
            loading = true;
            loadProjects();
        }
        setFilter(user.id);
    };

    // a user by username, or null when there's no such user
    const findUser = (name, done) => {
        editor.api.globals.rest.users
            .userGet(encodeURIComponent(name))
            .on('load', (status, user) => done(user))
            .on('error', () => done(null));
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
        if (!supports('projectList')) {
            return;
        }

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
        const show = () => {
            refresh();
            loadProjects();
            renderUsage();
            overlay.hidden = false;
        };
        // a profile the page was served for, or one named in the url
        const visit = (config as unknown as EditorBlankConfig).profileOwner;
        const name = readUrl(location.href).user;
        const find = (done) =>
            visit ? editor.call('users:loadOne', visit.id, done) : name ? findUser(name, done) : done(null);
        const showProfile = (owner) => {
            profileOwner = owner;
            filter = owner.id;
            sortPolicy = 'views';
            show();
        };

        // signed out, a profile is the only thing to show
        if (!signedIn) {
            find((owner) => owner && showProfile(owner));
            return;
        }
        editor.call('users:loadOne', selfId, (user) => {
            rootUser = user;
            currentUser = rootUser;
            filter = 'all';

            // a profile opens on that owner's projects, your own included; an organization's opens as usual
            find((owner) => {
                if (!owner) {
                    show();
                    if (name) {
                        setUrl({ user: null }, true);
                        editor.call('picker:project:buildAlert', rightPanel, NO_USER);
                    }
                } else if (owner.id === user.id) {
                    showProfile(user);
                } else if (isOrg(owner.id)) {
                    show();
                    setFilter(owner.id);
                } else {
                    showProfile(owner);
                }
            });
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

    // the url's project settings: the open project switches section, another loads first; one you can't open
    // shows why instead
    editor.on('picker:url', ({ project: id, section }) => {
        if (!id) {
            editor.call('picker:project:dismiss');
        } else if (editor.call('picker:project:selected') && editor.call('picker:project:getCurrent')?.id === id) {
            editor.call('picker:project:select', section);
        } else {
            const fail = () => editor.call('picker:project:buildAlert', rightPanel, CANT_OPEN);
            editor.call(
                'projects:getOne',
                id,
                (project) => (project.disabled ? fail() : inPlace(() => openProject(project, section))),
                fail
            );
        }
    });

    // back and forward between users' pages; a page served for a profile has no user in its url
    editor.on('picker:url', ({ user }) => {
        const open = isProfile(filter) ? profileOwner.username : orgs().find((o) => o.id === filter)?.username;
        if (
            !rootUser ||
            overlay.hidden ||
            user === (open ?? null) ||
            (!user && (config as unknown as EditorBlankConfig).profileOwner)
        ) {
            return;
        }
        if (!user) {
            setFilter('all');
        } else if (user === rootUser.username) {
            openUser(rootUser);
        } else {
            findUser(user, (found) => (found ? openUser(found) : setFilter('all')));
        }
    });

    // hook to retrieve main CMS panel (used to display errors from other files)
    editor.method('picker:project:cms:getPanel', () => {
        return panel;
    });

    // settings, team and transfer changes elsewhere on the page
    editor.on('projects:changed', () => refreshUI());

    // a project opening in another tab moves it to the top of recents, and of the list sorted by it
    window.addEventListener('storage', (e) => {
        if (e.key === PROJECTS_OPENED_KEY && rootUser) {
            renderSidebar();
            renderWelcome();
            if (sortPolicy === 'opened') {
                renderList();
            }
        }
    });

    editor.method('picker:project:cms:toggleProgress', (toggle) => {
        toggleProgress(toggle);
    });
});
