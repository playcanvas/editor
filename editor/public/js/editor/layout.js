editor.on('load', function() {
    'use strict';

    var ignoreClasses = /(ui-list-item)|(ui-button)|(ui-text-field)|(ui-number-field)/i;
    var ignoreElements = /(input)|(textarea)/i;

    // prevent drag'n'select
    window.addEventListener('mousedown', function(evt) {
        // don't prevent for certain cases
        if (evt.target) {
            if (ignoreClasses.test(evt.target.className)) {
                return;
            } else if (ignoreElements.test(evt.target.tagName)) {
                return;
            } else if (evt.target.classList.contains('selectable')) {
                return;
            }
        }

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


    // main container
    var root = new pcui.Container({
        id: 'layout-root',
        grid: true
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
        enabled: false,
        width: editor.call('localStorage:get', 'editor:layout:hierarchy:width') || 256,
        panelType: 'normal',
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

    editor.on('permissions:writeState', function (state) {
        hierarchyPanel.enabled = state;
    });

    // viewport
    var viewport = new pcui.Container({
        id: 'layout-viewport',
        class: 'viewport'
    });
    root.append(viewport);
    // expose
    editor.method('layout.viewport', function () { return viewport; });

    // assets
    var assetsPanel;
    // if (editor.call('users:hasFlag', 'hasPcuiAssetsPanel')) {
        assetsPanel = new pcui.AssetPanel({
            id: 'layout-assets',
            class: 'assets',
            collapsible: true,
            collapsed: editor.call('localStorage:get', 'editor:layout:assets:collapse') || window.innerHeight <= 480,
            height: editor.call('localStorage:get', 'editor:layout:assets:height') || 212,
            resizable: 'top',
            resizeMin: 106,
            resizeMax: 106 * 6
        });
    // } else {
    //     assetsPanel = new pcui.Panel({
    //         id: 'layout-assets',
    //         class: 'assets',
    //         headerText: 'ASSETS',
    //         flex: true,
    //         flexDirection: 'row',
    //         panelType: 'normal',
    //         collapsible: true,
    //         collapsed: editor.call('localStorage:get', 'editor:layout:assets:collapse') || window.innerHeight <= 480,
    //         height: editor.call('localStorage:get', 'editor:layout:assets:height') || 212,
    //         scrollable: true,
    //         resizable: 'top',
    //         resizeMin: 106,
    //         resizeMax: 106 * 6
    //     });
    // }

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
