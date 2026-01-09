import { Container, Panel } from '@playcanvas/pcui';

import { Tooltip } from '@/common/pcui/element/element-tooltip';

import { createConsolePanel } from './layout-console';
import { AssetPanel } from '../assets/asset-panel';

const createHierarchyPanel = () => {
    const hierarchyPanel = new Panel({
        headerText: 'HIERARCHY',
        id: 'layout-hierarchy',
        flex: true,
        enabled: true,
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

const createAssetPanel = () => {
    const assetsPanel = new AssetPanel({
        id: 'layout-assets',
        class: 'assets',
        panelType: 'normal',
        collapsible: true,
        collapsed: editor.call('localStorage:get', 'editor:layout:assets:collapse') || window.innerHeight <= 480,
        height: editor.call('localStorage:get', 'editor:layout:assets:height') || 212,
        resizable: 'top',
        resizeMin: 106,
        resizeMax: 106 * 6,
        viewMode: editor.call('localStorage:get', 'editor:assets:viewMode')
    });

    // save changes to viewmode to localStorage
    assetsPanel.on('viewMode', (value) => {
        editor.call('localStorage:set', 'editor:assets:viewMode', value);
    });

    assetsPanel.on('resize', () => {
        editor.call('localStorage:set', 'editor:layout:assets:height', assetsPanel.height);
    });
    assetsPanel.on('collapse', () => {
        editor.call('localStorage:set', 'editor:layout:assets:collapse', true);
    });
    assetsPanel.on('expand', () => {
        editor.call('localStorage:set', 'editor:layout:assets:collapse', false);
    });

    return assetsPanel;
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

const createSecondaryAttributesPanel = (hierarchyPanel) => {
    const attributesSecondaryPanel = new Panel({
        headerText: 'INSPECTOR',
        id: 'layout-attributes-secondary',
        flex: true,
        enabled: true,
        width: editor.call('localStorage:get', 'editor:layout:attributes-secondary:width') || 256,
        panelType: 'normal',
        collapsible: true,
        collapseHorizontally: true,
        collapsed: editor.call('localStorage:get', 'editor:layout:attributes-secondary:collapse') || window.innerWidth <= 480,
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
    const shouldNotPrevent = (ignoreClasses, evt) => {
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
    window.addEventListener('mousedown', (evt) => {
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
    }, false);


    // prevent default context menu
    window.addEventListener('contextmenu', (evt) => {
        if (shouldNotPrevent(ignoreContextMenuClasses, evt)) {
            return;
        }

        evt.preventDefault();
    }, false);

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
    const assetsPanel = createAssetPanel();
    root.append(assetsPanel);
    editor.method('layout.assets', () => {
        return assetsPanel;
    });

    // attributes
    const attributesPanel = createAttributesPanel();
    root.append(attributesPanel);
    editor.method('layout.attributes', () => {
        return attributesPanel;
    });
    editor.on('permissions:writeState', (state) => {
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
