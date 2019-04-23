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
    var root = new ui.Panel();
    root.element.id = 'ui-root';
    root.flex = true;
    root.flexDirection = 'column';
    root.flexWrap = 'nowrap';
    root.scroll = true;
    document.body.appendChild(root.element);
    // expose
    editor.method('layout.root', function() { return root; });

    var top = new ui.Panel();
    top.style.backgroundColor = '#5f6f72';
    top.style.cursor = 'pointer';
    top.element.id = 'ui-top';
    top.flexShrink = false;
    top.once('click', function() {
        top.destroy();
        toolbar.style.marginTop = '';
    });
    root.append(top);

    // middle
    var middle = new ui.Panel();
    middle.element.id = 'ui-middle';
    middle.flexible = true;
    middle.flexGrow = true;
    root.append(middle);

    // bottom (status)
    var bottom = new ui.Panel();
    bottom.element.id = 'ui-bottom';
    bottom.flexShrink = false;
    root.append(bottom);
    // expose
    editor.method('layout.bottom', function() { return bottom; });


    // toolbar (left)
    var toolbar = new ui.Panel();
    toolbar.element.id = 'ui-toolbar';
    toolbar.flexShrink = false;
    toolbar.style.width = '45px';
    middle.append(toolbar);
    // expose
    editor.method('layout.toolbar', function() { return toolbar; });


    // hierarchy
    var hierarchyPanel = new ui.Panel('HIERARCHY');
    hierarchyPanel.enabled = false;
    hierarchyPanel.class.add('hierarchy');
    hierarchyPanel.flexShrink = false;
    var hierarchyPanelSize = editor.call('localStorage:get', 'editor:layout:hierarchy:width') || '256px';
    hierarchyPanel.style.width = hierarchyPanelSize;
    hierarchyPanel.innerElement.style.width = hierarchyPanelSize;
    hierarchyPanel.foldable = true;
    hierarchyPanel.folded = editor.call('localStorage:get', 'editor:layout:hierarchy:fold') || false;
    hierarchyPanel.horizontal = true;
    hierarchyPanel.scroll = true;
    hierarchyPanel.resizable = 'right';
    hierarchyPanel.resizeMin = 196;
    hierarchyPanel.resizeMax = 512;

    hierarchyPanel.on('resize', function () {
        editor.call('localStorage:set', 'editor:layout:hierarchy:width', hierarchyPanel.style.width);
    });
    hierarchyPanel.on('fold', function () {
        editor.call('localStorage:set', 'editor:layout:hierarchy:fold', true);
    });
    hierarchyPanel.on('unfold', function () {
        editor.call('localStorage:set', 'editor:layout:hierarchy:fold', false);
    });

    middle.append(hierarchyPanel);
    // expose
    editor.method('layout.left', function() { return hierarchyPanel; });
    editor.on('permissions:writeState', function(state) {
        hierarchyPanel.enabled = state;
    });
    if (window.innerWidth <= 480)
        hierarchyPanel.folded = true;


    // center
    var center = new ui.Panel();
    center.flexible = true;
    center.flexGrow = true;
    center.flexDirection = 'column';
    middle.append(center);

    // viewport
    var viewport = new ui.Panel();
    viewport.flexible = true;
    viewport.flexGrow = true;
    viewport.class.add('viewport');
    center.append(viewport);
    // expose
    editor.method('layout.viewport', function() { return viewport; });

    // assets
    var assetsPanel = new ui.Panel('ASSETS');
    assetsPanel.class.add('assets');
    assetsPanel.foldable = true;
    assetsPanel.folded = editor.call('localStorage:get', 'editor:layout:assets:fold') || false;
    assetsPanel.flexShrink = false;
    assetsPanel.innerElement.style.height = editor.call('localStorage:get', 'editor:layout:assets:height') || '212px';
    assetsPanel.scroll = true;
    assetsPanel.resizable = 'top';
    assetsPanel.resizeMin = 106;
    assetsPanel.resizeMax = 106 * 6;
    assetsPanel.headerSize = -1;

    assetsPanel.on('resize', function () {
        editor.call('localStorage:set', 'editor:layout:assets:height', assetsPanel.innerElement.style.height);
    });
    assetsPanel.on('fold', function () {
        editor.call('localStorage:set', 'editor:layout:assets:fold', true);
    });
    assetsPanel.on('unfold', function () {
        editor.call('localStorage:set', 'editor:layout:assets:fold', false);
    });

    center.append(assetsPanel);
    // expose
    editor.method('layout.assets', function() { return assetsPanel; });
    if (window.innerHeight <= 480)
        assetsPanel.folded = true;


    // attributes
    var attributesPanel = new ui.Panel('INSPECTOR');
    attributesPanel.enabled = false;
    attributesPanel.class.add('attributes');
    attributesPanel.flexShrink = false;
    var attributesPanelWidth = editor.call('localStorage:get', 'editor:layout:attributes:width') || '320px';
    attributesPanel.style.width = attributesPanelWidth;
    attributesPanel.innerElement.style.width = attributesPanelWidth;
    attributesPanel.horizontal = true;
    attributesPanel.foldable = true;
    attributesPanel.folded = editor.call('localStorage:get', 'editor:layout:attributes:fold') || false;
    attributesPanel.scroll = true;
    attributesPanel.resizable = 'left';
    attributesPanel.resizeMin = 256;
    attributesPanel.resizeMax = 512;

    attributesPanel.on('resize', function () {
        editor.call('localStorage:set', 'editor:layout:attributes:width', attributesPanel.innerElement.style.width);
    });
    attributesPanel.on('fold', function () {
        editor.call('localStorage:set', 'editor:layout:attributes:fold', true);
    });
    attributesPanel.on('unfold', function () {
        editor.call('localStorage:set', 'editor:layout:attributes:fold', false);
    });

    middle.append(attributesPanel);
    // expose
    editor.method('layout.right', function() { return attributesPanel; });
    editor.on('permissions:writeState', function(state) {
        attributesPanel.enabled = state;
    });
    if (window.innerWidth <= 720)
        attributesPanel.folded = true;
});
