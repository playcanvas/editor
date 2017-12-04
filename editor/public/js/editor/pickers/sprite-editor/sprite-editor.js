editor.once('load', function() {
    'use strict';

    // overlay
    var overlay = new ui.Overlay();
    overlay.class.add('sprites-editor');
    overlay.hidden = true;

    var rootPanel = new ui.Panel();
    rootPanel.class.add('root-panel');
    rootPanel.header = 'SPRITE EDITOR';
    overlay.append(rootPanel);
    // close button
    var btnClose = new ui.Button({
        text: '&#57650;'
    });
    btnClose.class.add('close');
    btnClose.on('click', function () {
        overlay.hidden = true;
    });
    rootPanel.headerElement.appendChild(btnClose.element);

    var root = editor.call('layout.root');
    root.append(overlay);

    // Canvas
    var canvasRoot = editor.call('picker:sprites:canvas:root');
    rootPanel.append(canvasRoot);

    // Left panel
    var leftPanel = new ui.Panel();
    leftPanel.class.add('left-panel');
    leftPanel.flexible = true;
    leftPanel.flexGrow = true;
    leftPanel.resizable = 'width';
    rootPanel.append(leftPanel);

    // Bottom panel
    var bottomPanel = new ui.Panel();
    leftPanel.append(bottomPanel);

    var canvasControl = editor.call('picker:sprites:canvas:control');
    leftPanel.append(canvasControl)

    // Right panel
    var rightPanel = new ui.Panel('INSPECTOR');
    rightPanel.class.add('right-panel');
    rightPanel.flexShrink = false;
    rightPanel.style.width = '320px';
    rightPanel.innerElement.style.width = '320px';
    rightPanel.horizontal = true;
    rightPanel.foldable = true;
    rightPanel.scroll = true;
    rightPanel.resizable = 'left';
    rightPanel.resizeMin = 256;
    rightPanel.resizeMax = 512;
    rootPanel.append(rightPanel);

    var spriteAsset;
    var spriteImage = new Image();

    var updateCanvas = function() {
        editor.call('picker:sprites:canvas:draw', spriteImage);
    }

    // call picker
    editor.method('picker:sprites:editor', function(asset) {
        // show overlay
        overlay.hidden = false;
        spriteAsset = asset;
        spriteImage.onload = function() {
            updateCanvas();
        };
        spriteImage.src = config.url.home + asset.get('file.url') + '?t=' + asset.get('file.hash');
        editor.call('picker:sprites:canvas:reset');
    });

    // close picker
    editor.method('picker:sprites:editor:close', function() {
        overlay.hidden = true;
    });
});
