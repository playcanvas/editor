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

    var message = new ui.Label();
    message.style.color = '#fff';
    message.style.margin = '0 0 0 64px';
    message.style.lineHeight = '48px';
    message.style.fontWeight = 'bold';
    message.text = 'NEW BETA EDITOR';
    top.append(message);

    var messageB = new ui.Label();
    messageB.style.color = '#fff';
    messageB.style.margin = '0 0 0 32px';
    messageB.style.lineHeight = '48px';
    messageB.text = 'We are currently testing our new Editor. Please contact us if you experience any issues or share of what you think.'
    top.append(messageB);

    var closeMessage = new ui.Button({
        text: 'Close'
    });
    closeMessage.style.color = '#fff';
    closeMessage.style.margin = '0';
    closeMessage.style.border = 'none';
    closeMessage.style.padding = '0 16px';
    closeMessage.style.backgroundColor = 'transparent';
    closeMessage.style.lineHeight = '48px';
    closeMessage.style.float = 'right';
    closeMessage.once('click', function() {
        top.destroy();
        toolbar.style.marginTop = '';
    });
    top.append(closeMessage);

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
    toolbar.style.width = '48px';
    middle.append(toolbar);
    // expose
    editor.method('layout.toolbar', function() { return toolbar; });

    toolbar.style.marginTop = '-48px';


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
    assetsPanel.class.add('assets');
    assetsPanel.foldable = true;
    assetsPanel.flexShrink = false;
    assetsPanel.innerElement.style.height = '212px';
    assetsPanel.scroll = true;
    assetsPanel.resizable = 'top';
    assetsPanel.resizeMin = 106;
    assetsPanel.resizeMax = 106 * 6;
    assetsPanel.headerSize = 1;
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

    var isConnected = function () {
        var connection = editor.call('realtime:connection');
        return connection && connection.state === 'connected';
    }

    editor.on('permissions:set:' + config.self.id, function () {
        root.enabled = editor.call('permissions:write') && isConnected();
    });

    editor.on('realtime:disconnected', function () {
        root.enabled = false;
    });

    editor.on('realtime:connected', function () {
        root.enabled = editor.call('permissions:write');
    });

});
