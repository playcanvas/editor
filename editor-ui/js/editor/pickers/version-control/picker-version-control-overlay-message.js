editor.once('load', function () {
    'use strict';

    editor.method('picker:versioncontrol:createOverlay', function (args) {
        // overlay
        var overlay = new ui.Overlay();
        overlay.class.add('version-control-overlay');
        overlay.clickable = false;
        overlay.hidden = true;

        var root = editor.call('layout.root');
        root.append(overlay);

        // main panel
        var panel = new ui.Panel();
        panel.class.add('main');
        overlay.append(panel);

        // icon on the left
        var panelIcon = new ui.Panel();
        panelIcon.class.add('left');
        panel.append(panelIcon);

        panelIcon.innerElement.appendChild(args.icon);

        // content on the right
        var panelRight = new ui.Panel();
        panelRight.class.add('right');
        panel.append(panelRight);

        // title
        var labelTitle = new ui.Label({
            text: args.title
        });
        labelTitle.renderChanges = false;
        labelTitle.class.add('title');
        panelRight.append(labelTitle);

        // message
        var labelMessage = new ui.Label({
            text: args.message
        });
        labelMessage.renderChanges = false;
        labelMessage.class.add('message');
        panelRight.append(labelMessage);

        // public methods
        overlay.setMessage = function (msg) {
            labelMessage.text = msg;
        };

        overlay.setTitle = function (title) {
            labelTitle.text = title;
        };

        overlay.on('show', function () {
            if (editor.call('picker:versioncontrol:isProgressWidgetVisible')) {
                overlay.class.add('show-behind-picker');
            }

            // editor-blocking popup opened
            editor.emit('picker:open', 'version-control-overlay');
        });

        overlay.on('hide', function () {
            // editor-blocking popup closed
            editor.emit('picker:close', 'version-control-overlay');
        });

        return overlay;

    });
});
