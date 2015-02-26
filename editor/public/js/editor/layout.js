editor.on('load', function() {
    'use strict';

    // main container
    var root = new ui.Panel();
    root.enabled = false;
    root.element.id = 'ui-root';
    root.flex = true;
    root.flexDirection = 'column';
    root.flexWrap = 'nowrap';
    root.scroll = true;
    root.innerElement.style.overflow = 'hidden';
    document.body.appendChild(root.element);
    // expose
    editor.method('layout.root', function() { return root; });



    // top (header)
    var header = new ui.Panel();
    header.element.id = 'ui-top';
    header.flexShrink = false;
    root.append(header);
    // expose
    editor.method('layout.header', function() { return header; });


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
    bottom.innerElement.textContent = 'status';
    root.append(bottom);
    // expose
    editor.method('layout.bottom', function() { return bottom; });



    // hierarchy
    var hierarchyPanel = new ui.Panel('HIERARCHY');
    hierarchyPanel.class.add('hierarchy');
    hierarchyPanel.flexShrink = false;
    hierarchyPanel.style.width = '320px';
    hierarchyPanel.innerElement.style.width = '320px';
    hierarchyPanel.foldable = true;
    hierarchyPanel.horizontal = true;
    hierarchyPanel.scroll = true;
    hierarchyPanel.resizable = 'right';
    hierarchyPanel.resizeMin = 128;
    hierarchyPanel.resizeMax = 512;
    middle.append(hierarchyPanel);
    // expose
    editor.method('layout.left', function() { return hierarchyPanel; });



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
    center.append(viewport);
    // expose
    editor.method('layout.viewport', function() { return viewport; });

    // assets
    var assetsPanel = new ui.Panel('ASSETS');
    assetsPanel.foldable = true;
    assetsPanel.flexShrink = false;
    assetsPanel.innerElement.style.height = '212px';
    assetsPanel.scroll = true;
    assetsPanel.resizable = 'top';
    assetsPanel.resizeMin = 106;
    assetsPanel.resizeMax = 106 * 6;
    center.append(assetsPanel);
    // expose
    editor.method('layout.assets', function() { return assetsPanel; });



    // attributes
    var attributesPanel = new ui.Panel('INSPECTOR');
    attributesPanel.class.add('attributes');
    attributesPanel.flexShrink = false;
    attributesPanel.style.width = '320px';
    attributesPanel.innerElement.style.width = '320px';
    attributesPanel.horizontal = true;
    attributesPanel.foldable = true;
    // attributesPanel.folded = true;
    attributesPanel.scroll = true;
    attributesPanel.resizable = 'left';
    attributesPanel.resizeMin = 256;
    attributesPanel.resizeMax = 768;
    middle.append(attributesPanel);
    // expose
    editor.method('layout.right', function() { return attributesPanel; });


    editor.on('permissions:write', function(allowed) {
        root.enabled = allowed;
    });
});
