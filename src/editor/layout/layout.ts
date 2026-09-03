import { Button, Container, Panel } from '@playcanvas/pcui';

import { Tooltip } from '@/common/pcui/element/element-tooltip';
import { TooltipHandle } from '@/common/tooltips';

import { AssetPanel } from '../assets/asset-panel';

import { createConsolePanel } from './layout-console';

const createHierarchyPanel = () => {
    const hierarchyPanel = new Panel({
        headerText: 'HIERARCHY',
        id: 'layout-hierarchy',
        flex: true,
        width: editor.call('localStorage:get', 'editor:layout:hierarchy:width') || 256,
        panelType: 'normal',
        scrollable: true,
        collapsible: true,
        collapseHorizontally: true,
        collapsed: editor.call('localStorage:get', 'editor:layout:hierarchy:collapse') || window.innerWidth <= 480,
        resizable: 'right',
        resizeMin: 196,
        resizeMax: 512
    });

    hierarchyPanel.on('resize', () => {
        editor.call('localStorage:set', 'editor:layout:hierarchy:width', hierarchyPanel.width);
    });
    hierarchyPanel.on('collapse', () => {
        editor.call('localStorage:set', 'editor:layout:hierarchy:collapse', true);
    });
    hierarchyPanel.on('expand', () => {
        editor.call('localStorage:set', 'editor:layout:hierarchy:collapse', false);
    });

    return hierarchyPanel;
};

type AssetPanelArgs = ConstructorParameters<typeof AssetPanel>[0];

const createAssetPanel = (args: Partial<AssetPanelArgs>, viewModeKey: string) => {
    const assetsPanel = new AssetPanel({
        class: 'assets',
        panelType: 'normal',
        viewMode: editor.call('localStorage:get', viewModeKey),
        ...args
    } as AssetPanelArgs);

    // save changes to viewmode to localStorage
    assetsPanel.on('viewMode', (value) => {
        editor.call('localStorage:set', viewModeKey, value);
    });

    return assetsPanel;
};

// below this window width the split view has no room to be useful, so it is disabled
const SPLIT_MIN_WINDOW_WIDTH = 1280;

/**
 * Creates the container that fills the assets area of the layout grid. It holds the primary
 * asset panel and a secondary one, so that two folders can be browsed side by side.
 */
const createAssetDock = () => {
    const dock = new Container({
        id: 'layout-assets-dock',
        flex: true,
        flexDirection: 'row'
    });

    // the primary panel drives the height and the collapsed state of the whole dock
    const assetsPanel = createAssetPanel(
        {
            id: 'layout-assets',
            collapsible: true,
            collapsed: editor.call('localStorage:get', 'editor:layout:assets:collapse') || window.innerHeight <= 480,
            height: editor.call('localStorage:get', 'editor:layout:assets:height') || 212,
            resizable: 'top',
            resizeMin: 106,
            resizeMax: 106 * 6
        },
        'editor:assets:viewMode'
    );
    dock.append(assetsPanel);

    // the secondary panel is only shown when the split view is turned on
    const assetsPanelSecondary = createAssetPanel(
        {
            id: 'layout-assets-secondary',
            collapsible: false,
            hidden: true,
            showStoreButton: false,
            resizable: 'left',
            resizeMin: 200,
            resizeMax: 1200
        },
        'editor:assets:viewMode:secondary'
    );
    dock.append(assetsPanelSecondary);

    // button that toggles the split view
    const btnSplit = new Button({
        text: 'SPLIT',
        class: ['pcui-asset-panel-btn-split', 'pcui-asset-panel-hide-on-collapse']
    });
    assetsPanel.containerControls.appendBefore(btnSplit, assetsPanel.dropdownType);

    const tooltip = TooltipHandle.make({
        text: 'Split View',
        align: 'bottom',
        class: 'pcui-tooltip-clipboard',
        root: editor.call('layout.root')
    });
    tooltip.hidden = true;
    btnSplit.on('hover', () => {
        tooltip.attach(btnSplit.dom);
        tooltip.text = btnSplit.enabled ?
            'Browse two folders side by side' :
            `Split view needs a window at least ${SPLIT_MIN_WINDOW_WIDTH}px wide`;
        tooltip.class.toggle('inactive', !btnSplit.enabled);
    });

    let split = !!editor.call('localStorage:get', 'editor:layout:assets:split');
    let assetsHeight = editor.call('localStorage:get', 'editor:layout:assets:height') || 212;
    let secondaryWidth = editor.call('localStorage:get', 'editor:layout:assets-secondary:width') || 400;

    const refreshSplit = () => {
        // on a narrow window there is not enough room for two panels, so the split view is
        // turned off without forgetting the preference - it comes back on a wider window
        const canSplit = window.innerWidth >= SPLIT_MIN_WINDOW_WIDTH;
        btnSplit.enabled = canSplit;
        btnSplit.class.toggle('pcui-asset-panel-btn-active', split && canSplit);

        assetsPanelSecondary.hidden = !split || !canSplit || assetsPanel.collapsed;
        dock.class.toggle('assets-split', !assetsPanelSecondary.hidden);

        if (assetsPanelSecondary.hidden) {
            // the hidden panel must never stay the active one
            editor.call('assets:panel:active', assetsPanel);
            return;
        }

        // the height of the dock comes from the primary panel. Without an explicit height the
        // secondary panel would grow to fit all of its assets and cover the viewport
        assetsPanelSecondary.height = assetsHeight;

        // never let the secondary panel take more than half of the window
        assetsPanelSecondary.width = Math.min(secondaryWidth, Math.round(window.innerWidth / 2));
    };

    btnSplit.on('click', () => {
        split = !split;
        editor.call('localStorage:set', 'editor:layout:assets:split', split);
        refreshSplit();
    });

    assetsPanel.on('resize', () => {
        assetsHeight = assetsPanel.height;
        editor.call('localStorage:set', 'editor:layout:assets:height', assetsHeight);
        assetsPanelSecondary.height = assetsHeight;
    });
    assetsPanel.on('collapse', () => {
        editor.call('localStorage:set', 'editor:layout:assets:collapse', true);
        refreshSplit();
    });
    assetsPanel.on('expand', () => {
        editor.call('localStorage:set', 'editor:layout:assets:collapse', false);
        refreshSplit();
    });

    assetsPanelSecondary.on('resize', () => {
        secondaryWidth = assetsPanelSecondary.width;
        editor.call('localStorage:set', 'editor:layout:assets-secondary:width', secondaryWidth);
    });

    window.addEventListener('resize', refreshSplit);

    refreshSplit();

    return { dock, assetsPanel, assetsPanelSecondary };
};

const createAttributesPanel = () => {
    const attributesPanel = new Panel({
        id: 'layout-attributes',
        class: 'attributes',
        headerText: 'INSPECTOR',
        enabled: false,
        panelType: 'normal',
        width: editor.call('localStorage:get', 'editor:layout:attributes:width') ?? 320,
        collapsible: true,
        collapseHorizontally: true,
        collapsed: editor.call('localStorage:get', 'editor:layout:attributes:collapse') ?? false,
        scrollable: true,
        resizable: 'left',
        resizeMin: 256,
        resizeMax: 600
    });

    attributesPanel.on('resize', () => {
        editor.call('localStorage:set', 'editor:layout:attributes:width', attributesPanel.width);
    });
    attributesPanel.on('collapse', () => {
        editor.call('localStorage:set', 'editor:layout:attributes:collapse', true);
    });
    attributesPanel.on('expand', () => {
        editor.call('localStorage:set', 'editor:layout:attributes:collapse', false);
    });

    return attributesPanel;
};

const createSecondaryAttributesPanel = (hierarchyPanel: { width: number }) => {
    const attributesSecondaryPanel = new Panel({
        headerText: 'INSPECTOR',
        id: 'layout-attributes-secondary',
        flex: true,
        width: editor.call('localStorage:get', 'editor:layout:attributes-secondary:width') || 256,
        panelType: 'normal',
        collapsible: true,
        collapseHorizontally: true,
        collapsed:
            editor.call('localStorage:get', 'editor:layout:attributes-secondary:collapse') || window.innerWidth <= 480,
        scrollable: true,
        resizable: 'left',
        resizeMin: 196,
        resizeMax: 512,
        hidden: true
    });

    attributesSecondaryPanel.on('resize', () => {
        editor.call('localStorage:set', 'editor:layout:attributes-secondary:width', hierarchyPanel.width);
    });
    attributesSecondaryPanel.on('collapse', () => {
        editor.call('localStorage:set', 'editor:layout:attributes-secondary:collapse', true);
    });
    attributesSecondaryPanel.on('expand', () => {
        editor.call('localStorage:set', 'editor:layout:attributes-secondary:collapse', false);
    });

    return attributesSecondaryPanel;
};

editor.on('load', () => {
    const ignoreMouseDownClasses = /default-mousedown|ui-list-item|ui-button|ui-text|ui-number-field/i;
    const ignoreContextMenuClasses = /default-mousedown/i;
    const ignoreElements = /input|textarea/i;

    // don't prevent for certain cases
    const shouldNotPrevent = (ignoreClasses: RegExp, evt: MouseEvent) => {
        if (evt.target) {
            if (ignoreClasses.test(evt.target.className)) {
                return true;
            }
            if (ignoreElements.test(evt.target.tagName)) {
                return true;
            }
            if (evt.target.classList.contains('selectable')) {
                return true;
            }
        }

        return false;
    };

    // prevent drag'n'select
    window.addEventListener(
        'mousedown',
        (evt: MouseEvent) => {
            if (shouldNotPrevent(ignoreMouseDownClasses, evt)) {
                return;
            }

            // blur inputs
            if (window.getSelection) {
                const focusNode = window.getSelection().focusNode;
                if (focusNode) {
                    if (focusNode.tagName === 'INPUT') {
                        focusNode.blur();
                    } else if (focusNode.firstChild && focusNode.firstChild.tagName === 'INPUT') {
                        focusNode.firstChild.blur();
                    }
                }
            }

            // prevent default will prevent blur, dragstart and selection
            evt.preventDefault();
        },
        false
    );

    // prevent default context menu
    window.addEventListener(
        'contextmenu',
        (evt: MouseEvent) => {
            if (shouldNotPrevent(ignoreContextMenuClasses, evt)) {
                return;
            }

            evt.preventDefault();
        },
        false
    );

    // main container
    const root = new Container({
        id: 'layout-root',
        grid: true,
        isRoot: true
    });
    document.body.appendChild(root.dom);
    editor.method('layout.root', () => {
        return root;
    });

    // tooltip
    const tooltip = new Tooltip({
        id: 'layout-tooltip'
    });
    root.append(tooltip);
    editor.method('layout.tooltip', () => {
        return tooltip;
    });

    // toolbar (left)
    const toolbar = new Container({
        id: 'layout-toolbar',
        flex: true
    });
    root.append(toolbar);
    editor.method('layout.toolbar', () => {
        return toolbar;
    });

    // hierarchy
    const hierarchyPanel = createHierarchyPanel();
    root.append(hierarchyPanel);
    editor.method('layout.hierarchy', () => {
        return hierarchyPanel;
    });

    // viewport
    const viewport = new Container({
        id: 'layout-viewport',
        class: 'viewport'
    });
    root.append(viewport);
    editor.method('layout.viewport', () => {
        return viewport;
    });

    // assets
    const { dock: assetsDock, assetsPanel, assetsPanelSecondary } = createAssetDock();
    root.append(assetsDock);
    editor.method('layout.assets', () => {
        return assetsPanel;
    });
    editor.method('layout.assets.secondary', () => {
        return assetsPanelSecondary;
    });
    editor.method('layout.assets.dock', () => {
        return assetsDock;
    });

    // attributes
    const attributesPanel = createAttributesPanel();
    root.append(attributesPanel);
    editor.method('layout.attributes', () => {
        return attributesPanel;
    });
    editor.on('permissions:writeState', (state: boolean) => {
        attributesPanel.enabled = state;
    });

    // secondary attributes panel
    const attributesSecondaryPanel = createSecondaryAttributesPanel(hierarchyPanel);
    root.append(attributesSecondaryPanel);
    editor.method('layout.attributes.secondary', () => {
        return attributesSecondaryPanel;
    });

    // console
    const consolePanel = createConsolePanel();
    root.append(consolePanel);
    editor.method('layout.console', () => {
        return consolePanel;
    });

    // fold panels on small screens
    if (window.innerWidth <= 720) {
        attributesPanel.folded = true;
    }
});
