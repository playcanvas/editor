import { Container, Menu, MenuItem, SelectInput, TextInput } from '@playcanvas/pcui';

import { handleCallback } from '@/common/utils';
import { config } from '@/editor/config';

const PAGE_SIZE = 50;

// host must live inside the project picker overlay or the picker's
// outside-click handler dismisses itself when the dropdown is clicked
export const createBranchSwitcher = (host: Container) => {
    const projectUserSettings = editor.call('settings:projectUser');

    let branches: Record<string, any> = {};
    let skip: string = null;
    let hasMore = false;
    let loading = false;
    let loadGen = 0;
    let search = '';
    let contextBranch: any = null;

    // top-bar button
    const button = new Container({ class: 'vc-branch-button' });
    button.dom.setAttribute('role', 'button');
    const labels = document.createElement('span');
    labels.classList.add('labels');
    labels.innerHTML = '<span class="hint">Current branch</span><span class="name"></span>';
    button.dom.appendChild(labels);
    const nameEl = labels.querySelector('.name') as HTMLElement;
    nameEl.textContent = config.self.branch.name;

    // dropdown panel floats inside the picker, anchored under the button
    const panel = new Container({ class: 'vc-branch-panel', hidden: true });
    host.append(panel);

    const filter = new Container({ class: 'vc-branch-filter' });
    panel.append(filter);

    // native placeholder; pcui's [placeholder] renders an out-of-place chip
    const searchInput = new TextInput({ keyChange: true, renderChanges: false });
    (searchInput.dom.querySelector('input') as HTMLInputElement).placeholder = 'Filter branches';
    filter.append(searchInput);

    const filterSelect = new SelectInput({
        options: [
            { v: 'open', t: 'Open' },
            { v: 'favorite', t: 'Favorites' },
            { v: 'closed', t: 'Closed' }
        ],
        value: 'favorite'
    });
    filter.append(filterSelect);

    const list = new Container({ class: 'vc-branch-list' });
    panel.append(list);

    const newBranch = document.createElement('button');
    newBranch.type = 'button';
    newBranch.classList.add('vc-new-branch');
    newBranch.textContent = '+ New Branch';
    panel.dom.appendChild(newBranch);
    newBranch.addEventListener('click', () => {
        hidePanel();
        button.emit('newBranch');
    });

    // context menu for row kebabs
    const menu = new Menu({ class: 'version-control' });
    editor.call('layout.root').append(menu);

    const menuItems: { item: MenuItem; show: (b: any) => boolean }[] = [];
    const addMenuItem = (text: string, event: string, show: (b: any) => boolean, cls?: string) => {
        const item = new MenuItem(cls ? { text, class: cls } : { text });
        menu.append(item);
        item.on('select', () => {
            if (contextBranch) {
                hidePanel();
                button.emit(event, contextBranch);
            }
        });
        menuItems.push({ item, show });
        return item;
    };

    const writable = () => editor.call('permissions:write');
    const isCurrent = (b: any) => b.id === config.self.branch.id;
    const isMaster = (b: any) => b.id === config.project.masterBranch;

    const favItem = addMenuItem('Favorite', 'favorite', b => writable() && !isCurrent(b));
    addMenuItem('Merge Into Current Branch', 'merge', b => writable() && !isCurrent(b) && !b.closed);
    addMenuItem('Version Control Graph', 'graph', () => true);
    addMenuItem('Copy Branch ID', 'copyId', () => true);
    addMenuItem('Re-Open This Branch', 'open', b => writable() && !!b.closed);
    addMenuItem('Close This Branch', 'close', b => writable() && !b.closed && !isCurrent(b) && !isMaster(b));
    addMenuItem('Delete This Branch', 'delete', b => writable() && !isCurrent(b) && !isMaster(b), 'delete');

    menu.on('show', () => {
        const favs = projectUserSettings.get('favoriteBranches') || [];
        favItem.text = favs.includes(contextBranch?.id) ? 'Unfavorite This Branch' : 'Favorite This Branch';
        menuItems.forEach(({ item, show }) => {
            item.hidden = !contextBranch || !show(contextBranch);
        });
    });

    button.on('copyId', (b: any) => navigator.clipboard?.writeText(b.id));
    button.on('favorite', (b: any) => {
        const favs = projectUserSettings.get('favoriteBranches') || [];
        const index = favs.indexOf(b.id);
        if (index >= 0) {
            projectUserSettings.remove('favoriteBranches', index);
        } else {
            projectUserSettings.insert('favoriteBranches', b.id);
        }
        render();
    });

    const setStatus = (text: string) => {
        const status = document.createElement('div');
        status.classList.add('vc-list-status');
        status.textContent = text;
        list.dom.appendChild(status);
    };

    const matchesSearch = (b: any) => {
        return !search || editor.call('search:items', [[b.name, b.name]], search).length > 0;
    };

    const createRow = (branch: any) => {
        const row = document.createElement('div');
        row.classList.add('vc-branch-row');
        row.id = `branch-${branch.id}`;

        const favs = projectUserSettings.get('favoriteBranches') || [];
        const fav = favs.includes(branch.id);
        const icon = document.createElement('span');
        icon.classList.add('icon');
        if (isCurrent(branch)) {
            icon.classList.add('current');
            icon.textContent = '●';
        } else if (fav) {
            icon.classList.add('favorite');
            icon.textContent = '★';
        } else {
            icon.textContent = branch.closed ? '✕' : '●';
        }
        row.appendChild(icon);

        const name = document.createElement('span');
        name.classList.add('name');
        if (branch.closed) {
            name.classList.add('closed');
        }
        name.textContent = branch.name;
        name.title = branch.name;
        row.appendChild(name);

        if (isCurrent(branch)) {
            const sub = document.createElement('span');
            sub.classList.add('sub');
            sub.textContent = 'current';
            row.appendChild(sub);
        } else {
            const actions = document.createElement('span');
            actions.classList.add('row-actions');
            row.appendChild(actions);

            if (!branch.closed) {
                const sw = document.createElement('button');
                sw.type = 'button';
                sw.classList.add('switch');
                sw.textContent = 'Switch';
                sw.addEventListener('click', (e) => {
                    e.stopPropagation();
                    hidePanel();
                    button.emit('switch', branch);
                });
                actions.appendChild(sw);
            }

            const kebab = document.createElement('button');
            kebab.type = 'button';
            kebab.classList.add('kebab');
            kebab.setAttribute('aria-label', 'Branch actions');
            kebab.addEventListener('click', (e) => {
                e.stopPropagation();
                contextBranch = branch;
                menu.hidden = false;
                // open beside the row like a submenu; aligning right-edge-to-kebab
                // would cover the panel since the menu is wider than it
                const rect = kebab.getBoundingClientRect();
                menu.position(rect.right + 6, rect.top);
            });
            actions.appendChild(kebab);
        }

        row.addEventListener('click', () => {
            hidePanel();
            button.emit('view', branch);
        });

        return row;
    };

    const render = () => {
        list.dom.innerHTML = '';

        const all = Object.values(branches).filter(matchesSearch);
        if (!all.length) {
            setStatus(loading ? 'Loading…' : 'No branches found');
            return;
        }

        const favs = projectUserSettings.get('favoriteBranches') || [];
        const favBranches = all.filter((b: any) => favs.includes(b.id) || isCurrent(b));
        const rest = all.filter((b: any) => !favBranches.includes(b));

        const addGroup = (title: string, items: any[]) => {
            if (!items.length) {
                return;
            }
            const head = document.createElement('div');
            head.classList.add('vc-group');
            head.textContent = title;
            list.dom.appendChild(head);
            items.forEach(b => list.dom.appendChild(createRow(b)));
        };

        addGroup('Favorites', favBranches);
        addGroup(filterSelect.value === 'closed' ? 'Closed branches' : 'All branches', rest);

        if (loading) {
            setStatus('Loading…');
        }
    };

    const load = (reset: boolean) => {
        // load-more never interrupts; reset supersedes any in-flight request
        if (loading && !reset) {
            return;
        }
        loading = true;
        if (reset) {
            skip = null;
            branches = {};
            loadGen++;
        }
        const gen = loadGen;
        render();

        handleCallback(editor.api.globals.rest.projects.projectBranches({
            limit: PAGE_SIZE,
            skip: skip as unknown as number,
            closed: filterSelect.value === 'closed',
            favorite: filterSelect.value === 'favorite'
        }), (err: any, data: any) => {
            // a newer reset superseded this response
            if (gen !== loadGen) {
                return;
            }
            loading = false;
            if (err) {
                log.error(err);
                render();
                return;
            }
            // current branch always present at the top
            if (!skip && filterSelect.value !== 'closed') {
                branches[config.self.branch.id] = config.self.branch;
            }
            data.result.forEach((b: any) => {
                branches[b.id] = b;
            });
            hasMore = data.pagination.hasMore;
            if (data.result.length) {
                skip = data.result[data.result.length - 1].id;
            }
            render();
        });
    };

    // infinite scroll
    list.dom.addEventListener('scroll', () => {
        if (hasMore && !loading && list.dom.scrollTop + list.dom.clientHeight >= list.dom.scrollHeight - 60) {
            load(false);
        }
    });

    searchInput.on('change', (value: string) => {
        search = value.trim();
        render();
    });

    filterSelect.on('change', () => load(true));

    const positionPanel = () => {
        const rect = button.dom.getBoundingClientRect();
        const hostRect = host.dom.getBoundingClientRect();
        // hug the corner: flush with the button edge, attached under the bar
        panel.style.left = `${rect.left - hostRect.left}px`;
        panel.style.top = `${rect.bottom - hostRect.top}px`;
    };

    const hidePanel = () => {
        panel.hidden = true;
        button.class.remove('active');
        document.removeEventListener('mousedown', onOutside, true);
    };

    const onOutside = (e: MouseEvent) => {
        if (!panel.dom.contains(e.target as Node) && !button.dom.contains(e.target as Node) && menu.hidden) {
            hidePanel();
        }
    };

    button.dom.addEventListener('click', () => {
        // raw listener bypasses pcui gating; respect disabled state during operations
        if (!button.enabled) {
            return;
        }
        if (!panel.hidden) {
            hidePanel();
            return;
        }
        positionPanel();
        panel.hidden = false;
        button.class.add('active');
        searchInput.value = '';
        search = '';
        load(true);
        document.addEventListener('mousedown', onOutside, true);
        setTimeout(() => searchInput.focus());
    });

    // public surface used by the shell
    Object.assign(button, {
        refresh: () => {
            if (!panel.hidden) {
                load(true);
            }
            nameEl.textContent = config.self.branch.name;
        },
        closePanel: hidePanel,
        getBranch: (id: string) => branches[id],
        removeBranch: (id: string) => {
            delete branches[id];
            // discard any in-flight response so it cannot resurrect the branch
            if (loading) {
                loadGen++;
                loading = false;
            }
            render();
        }
    });

    return button as Container & {
        refresh: () => void;
        closePanel: () => void;
        getBranch: (id: string) => any;
        removeBranch: (id: string) => void;
    };
};
