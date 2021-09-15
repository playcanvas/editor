editor.on('load', function () {
    'use strict';

    var ignoreMouseDownClasses = /(default-mousedown)|(ui-list-item)|(ui-button)|(ui-text)|(ui-number-field)/i;
    var ignoreContextMenuClasses = /(default-mousedown)/i;
    var ignoreElements = /(input)|(textarea)/i;

    // don't prevent for certain cases
    function shouldNotPrevent(ignoreClasses, evt) {
        if (evt.target) {
            if (ignoreClasses.test(evt.target.className)) {
                return true;
            } else if (ignoreElements.test(evt.target.tagName)) {
                return true;
            } else if (evt.target.classList.contains('selectable')) {
                return true;
            }
        }

        return false;
    }

    // prevent drag'n'select
    window.addEventListener('mousedown', function (evt) {
        if (shouldNotPrevent(ignoreMouseDownClasses, evt)) return;

        // blur inputs
        if (window.getSelection) {
            var focusNode = window.getSelection().focusNode;
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
    window.addEventListener('contextmenu', function (evt) {
        if (shouldNotPrevent(ignoreContextMenuClasses, evt)) return;

        evt.preventDefault();
    }, false);

    // main container
    var root = new pcui.Container({
        id: 'layout-root',
        grid: true,
        isRoot: true
    });
    document.body.appendChild(root.dom);
    // expose
    editor.method('layout.root', function () {
        return root;
    });

    // toolbar (left)
    var toolbar = new pcui.Container({
        id: 'layout-toolbar',
        flex: true
    });
    root.append(toolbar);
    // expose
    editor.method('layout.toolbar', function () { return toolbar; });

    // hierarchy
    var hierarchyPanel = new pcui.Panel({
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
        scrollable: true,
        resizable: 'right',
        resizeMin: 196,
        resizeMax: 512
    });

    hierarchyPanel.on('resize', function () {
        editor.call('localStorage:set', 'editor:layout:hierarchy:width', hierarchyPanel.width);
    });
    hierarchyPanel.on('collapse', function () {
        editor.call('localStorage:set', 'editor:layout:hierarchy:collapse', true);
    });
    hierarchyPanel.on('expand', function () {
        editor.call('localStorage:set', 'editor:layout:hierarchy:collapse', false);
    });

    root.append(hierarchyPanel);
    // expose
    editor.method('layout.hierarchy', function () { return hierarchyPanel; });

    // viewport
    var viewport = new pcui.Container({
        id: 'layout-viewport',
        class: 'viewport'
    });
    root.append(viewport);
    // expose
    editor.method('layout.viewport', function () { return viewport; });

    // assets
    const assetsPanel = new pcui.AssetPanel({
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
    assetsPanel.on('viewMode', value => {
        editor.call('localStorage:set', 'editor:assets:viewMode', value);
    });

    assetsPanel.on('resize', function () {
        editor.call('localStorage:set', 'editor:layout:assets:height', assetsPanel.height);
    });
    assetsPanel.on('collapse', function () {
        editor.call('localStorage:set', 'editor:layout:assets:collapse', true);
    });
    assetsPanel.on('expand', function () {
        editor.call('localStorage:set', 'editor:layout:assets:collapse', false);
    });

    root.append(assetsPanel);
    // expose
    editor.method('layout.assets', function () { return assetsPanel; });

    // attributes
    var attributesPanel = new pcui.Panel({
        id: 'layout-attributes',
        class: 'attributes',
        headerText: 'INSPECTOR',
        enabled: false,
        panelType: 'normal',
        width: editor.call('localStorage:get', 'editor:layout:attributes:width') || 320,
        collapsible: true,
        collapseHorizontally: true,
        collapsed: editor.call('localStorage:get', 'editor:layout:attributes:collapse') || false,
        scrollable: true,
        resizable: 'left',
        resizeMin: 256,
        resizeMax: 512
    });

    attributesPanel.on('resize', function () {
        editor.call('localStorage:set', 'editor:layout:attributes:width', attributesPanel.width);
    });
    attributesPanel.on('collapse', function () {
        editor.call('localStorage:set', 'editor:layout:attributes:collapse', true);
    });
    attributesPanel.on('expand', function () {
        editor.call('localStorage:set', 'editor:layout:attributes:collapse', false);
    });

    root.append(attributesPanel);
    // expose
    editor.method('layout.attributes', function () { return attributesPanel; });
    editor.on('permissions:writeState', function (state) {
        attributesPanel.enabled = state;
    });

    // secondary attributes panel
    var attributesSecondaryPanel = new pcui.Panel({
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

    attributesSecondaryPanel.on('resize', function () {
        editor.call('localStorage:set', 'editor:layout:attributes-secondary:width', hierarchyPanel.width);
    });
    attributesSecondaryPanel.on('collapse', function () {
        editor.call('localStorage:set', 'editor:layout:attributes-secondary:collapse', true);
    });
    attributesSecondaryPanel.on('expand', function () {
        editor.call('localStorage:set', 'editor:layout:attributes-secondary:collapse', false);
    });

    root.append(attributesSecondaryPanel);
    // expose
    editor.method('layout.attributes.secondary', function () { return attributesSecondaryPanel; });


    // status bar
    var statusBar = new pcui.Container({
        id: 'layout-statusbar',
        flex: true,
        flexDirection: 'row'
    });
    root.append(statusBar);
    // expose
    editor.method('layout.statusBar', function () { return statusBar; });

    if (window.innerWidth <= 720)
        attributesPanel.folded = true;
});
