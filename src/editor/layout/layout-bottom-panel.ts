import { Container, Label, Panel } from '@playcanvas/pcui';

import { createConsoleContent, createStatusBarItems } from './layout-console';
import { type AssetPanel } from '../assets/asset-panel';

type Tab = 'assets' | 'console';

const STORAGE_HEIGHT = 'editor:layout:bottom-panel:height';
const STORAGE_COLLAPSE = 'editor:layout:bottom-panel:collapse';
const STORAGE_TAB = 'editor:layout:bottom-panel:active-tab';

export const createBottomPanel = (assetsPanel: AssetPanel) => {
    const savedTab = (editor.call('localStorage:get', STORAGE_TAB) as Tab) || 'assets';

    const bottomPanel = new Panel({
        id: 'layout-bottom-panel',
        headerText: '',
        height: editor.call('localStorage:get', STORAGE_HEIGHT) ?? editor.call('localStorage:get', 'editor:layout:assets:height') ?? 212,
        resizeMin: 106,
        resizeMax: 512,
        resizable: 'top',
        flex: true,
        flexDirection: 'column',
        scrollable: false,
        collapsible: true,
        collapsed: editor.call('localStorage:get', STORAGE_COLLAPSE) ?? editor.call('localStorage:get', 'editor:layout:assets:collapse') ?? false
    });

    // disable initial transition on collapsed state
    bottomPanel.style.transition = 'none';
    setTimeout(() => {
        bottomPanel.style.transition = '';
    });

    // track active tab
    let activeTab: Tab = savedTab;

    const isConsoleVisible = () => !bottomPanel.collapsed && activeTab === 'console';

    // console content
    const onCountersUpdate = (counts: Record<string, number>) => {
        editor.emit('layout:console:counters:update', counts);
    };
    const { header: consoleHeader, body: consoleBody, refresh } = createConsoleContent(isConsoleVisible, onCountersUpdate);

    // build header — tabs + controls only
    const header = bottomPanel.header;

    // hide default title
    const titleEl = header.dom.querySelector('.pcui-panel-header-title');
    if (titleEl) {
        (titleEl as HTMLElement).style.display = 'none';
    }

    // tab buttons
    const tabContainer = new Container({
        class: 'bottom-panel-tabs',
        flex: true,
        flexDirection: 'row'
    });

    const tabAssets = new Label({
        class: 'bottom-panel-tab',
        text: 'ASSETS'
    });
    if (activeTab === 'assets') {
        tabAssets.class.add('active');
    }

    const tabConsole = new Label({
        class: 'bottom-panel-tab',
        text: 'CONSOLE'
    });
    if (activeTab === 'console') {
        tabConsole.class.add('active');
    }

    tabContainer.append(tabAssets);
    tabContainer.append(tabConsole);
    header.append(tabContainer);

    const switchTab = (tab: Tab) => {
        if (tab === activeTab) {
            return;
        }
        activeTab = tab;
        editor.call('localStorage:set', STORAGE_TAB, tab);

        tabAssets.class[tab === 'assets' ? 'add' : 'remove']('active');
        tabConsole.class[tab === 'console' ? 'add' : 'remove']('active');

        // toggle content
        assetsPanel.hidden = tab !== 'assets';
        consoleHeader.hidden = tab !== 'console';
        consoleBody.hidden = tab !== 'console';

        // refresh console when switching to it
        if (tab === 'console') {
            refresh();
        }
    };

    // tab click handlers
    tabAssets.on('click', (e: MouseEvent) => {
        e.stopPropagation();
        if (bottomPanel.collapsed) {
            bottomPanel.collapsed = false;
        }
        switchTab('assets');
    });
    tabConsole.on('click', (e: MouseEvent) => {
        e.stopPropagation();
        if (bottomPanel.collapsed) {
            bottomPanel.collapsed = false;
        }
        switchTab('console');
    });

    // persist height/collapse
    bottomPanel.on('resize', () => {
        editor.call('localStorage:set', STORAGE_HEIGHT, bottomPanel.height);
    });
    bottomPanel.on('collapse', () => {
        editor.call('localStorage:set', STORAGE_COLLAPSE, true);
    });
    bottomPanel.on('expand', () => {
        editor.call('localStorage:set', STORAGE_COLLAPSE, false);
        if (activeTab === 'console') {
            refresh();
        }
    });

    // hide asset panel header title (controls stay visible inside the panel)
    assetsPanel.headerText = '';
    const assetTitleEl = assetsPanel.header.dom.querySelector('.pcui-panel-header-title');
    if (assetTitleEl) {
        (assetTitleEl as HTMLElement).style.display = 'none';
    }

    // body content
    bottomPanel.append(assetsPanel);
    bottomPanel.append(consoleHeader);
    bottomPanel.append(consoleBody);

    // initialize for current tab
    if (activeTab === 'assets') {
        assetsPanel.hidden = false;
        consoleHeader.hidden = true;
        consoleBody.hidden = true;
    } else {
        assetsPanel.hidden = true;
        consoleHeader.hidden = false;
        consoleBody.hidden = false;
    }

    // register tab switching method
    editor.method('layout:bottom-panel:tab', (tab?: Tab) => {
        if (tab) {
            switchTab(tab);
        }
        return activeTab;
    });

    // status bar — a Panel matching the original console panel header appearance
    const { counters, auditorBtn, jobsCount, jobsProgress, statusLabel, versionBtn, createDivider } = createStatusBarItems();

    const statusBar = new Panel({
        id: 'layout-statusbar',
        headerText: '',
        collapsible: false,
        flex: true,
        scrollable: false
    });

    // hide the empty title element
    const statusTitleEl = statusBar.header.dom.querySelector('.pcui-panel-header-title');
    if (statusTitleEl) {
        (statusTitleEl as HTMLElement).style.display = 'none';
    }

    const bar = statusBar.header;

    // expand and switch to console tab when clicking counters
    const onCounterClick = (e: MouseEvent) => {
        if (bottomPanel.collapsed || activeTab !== 'console') {
            e.stopImmediatePropagation();
            bottomPanel.collapsed = false;
            switchTab('console');
        }
    };

    bar.append(createDivider());
    for (const key in counters) {
        const el = counters[key].el;
        if (el) {
            el.dom.addEventListener('click', onCounterClick, true);
            bar.append(el);
        }
    }
    bar.append(createDivider());

    auditorBtn.dom.addEventListener('click', (e: MouseEvent) => {
        if (bottomPanel.collapsed || activeTab !== 'console') {
            e.stopImmediatePropagation();
            bottomPanel.collapsed = false;
            switchTab('console');
            editor.call('picker:auditor');
        }
    }, true);
    bar.append(auditorBtn);
    bar.append(createDivider());
    bar.append(jobsCount);
    bar.append(jobsProgress);
    bar.append(createDivider());
    bar.append(statusLabel);
    bar.append(createDivider());
    bar.append(versionBtn);

    return { bottomPanel, statusBar };
};
