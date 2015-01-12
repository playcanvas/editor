editor.on('load', function() {
    'use strict';

    // main container
    var root = new ui.Panel();
    root.enabled = false;
    root.element.id = 'ui-root';
    root.flexDirection = 'column';
    root.flexWrap = 'nowrap';
    root.scroll = true;
    root.innerElement.style.overflow = 'hidden';
    document.body.appendChild(root.element);
    // expose
    editor.hook('layout.root', function() { return root; });



    // top (header)
    var header = new ui.Panel();
    header.element.id = 'ui-top';
    header.flexShrink = false;
    // header.innerElement.textContent = 'menu';
    root.append(header);
    // expose
    editor.hook('layout.header', function() { return header; });


    // middle
    var middle = new ui.Panel();
    middle.element.id = 'ui-middle';
    middle.flexGrow = true;
    root.append(middle);

    // bottom (status)
    var bottom = new ui.Panel();
    bottom.element.id = 'ui-bottom';
    bottom.flexShrink = false;
    bottom.innerElement.textContent = 'status';
    root.append(bottom);
    // expose
    editor.hook('layout.bottom', function() { return bottom; });



    // hierarchy
    var hierarchyPanel = new ui.Panel('Hierarchy');
    hierarchyPanel.class.add('hierarchy');
    hierarchyPanel.flexShrink = false;
    hierarchyPanel.style.width = '384px';
    hierarchyPanel.innerElement.style.width = '384px';
    hierarchyPanel.foldable = true;
    hierarchyPanel.horizontal = true;
    hierarchyPanel.scroll = true;
    middle.append(hierarchyPanel);
    // expose
    editor.hook('layout.left', function() { return hierarchyPanel; });



    // center
    var center = new ui.Panel();
    center.flexGrow = true;
    center.flexDirection = 'column';
    middle.append(center);

    // viewport
    var viewport = new ui.Panel();
    viewport.flexGrow = true;
    viewport.innerElement.style.backgroundImage = 'url("https://i.imgur.com/0zVgGIk.jpg")';
    viewport.innerElement.style.backgroundPosition = 'center center';
    viewport.innerElement.style.backgroundSize = 'cover';
    center.append(viewport);
    // expose
    editor.hook('layout.viewport', function() { return viewport; });

    // assets
    var assetsPanel = new ui.Panel('Assets');
    assetsPanel.foldable = true;
    assetsPanel.flexShrink = false;
    assetsPanel.innerElement.style.height = '256px';
    assetsPanel.scroll = true;
    center.append(assetsPanel);
    // expose
    editor.hook('layout.assets', function() { return assetsPanel; });


    // attributes
    var attributesPanel = new ui.Panel('Attributes');
    attributesPanel.class.add('attributes');
    attributesPanel.flexShrink = false;
    attributesPanel.style.width = '384px';
    attributesPanel.innerElement.style.width = '384px';
    attributesPanel.horizontal = true;
    attributesPanel.foldable = true;
    attributesPanel.folded = true;
    attributesPanel.scroll = true;
    middle.append(attributesPanel);
    // expose
    editor.hook('layout.right', function() { return attributesPanel; });
});
