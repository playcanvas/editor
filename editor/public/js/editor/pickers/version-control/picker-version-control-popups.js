editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');

    // Defines a popup used by the version control pickers
    var VersionControlPopup = function (args) {
        Events.call(this);

        var self = this;

        self.overlay = new ui.Overlay();
        self.overlay.class.add('version-control-popup');
        if (args.class) {
            self.overlay.class.add(args.class);
        }
        self.overlay.hidden = true;

        var panel = new ui.Panel(args.title);
        panel.class.add('container');
        self.overlay.append(panel);

        self.panelContents = new ui.Panel();
        self.panelContents.class.add('popup-content');
        panel.append(self.panelContents);

        var panelButtons = new ui.Panel();
        panelButtons.class.add('buttons');
        panel.append(panelButtons);

        var btnConfirm = new ui.Button({
            text: args.confirmText || 'OK'
        });
        btnConfirm.class.add('confirm');
        panelButtons.append(btnConfirm);

        var btnCancel = new ui.Button({
            text: args.cancelText || 'CANCEL'
        });
        btnCancel.class.add('cancel', 'left', 'highlighted');
        panelButtons.append(btnCancel);

        root.append(self.overlay);

        btnCancel.on('click', function () {
            self.hide();
            self.emit('cancel');
        });

        btnConfirm.on('click', function () {
            self.emit('confirm');
            self.hide();
        });

        self.overlay.on('show', function () {
            self.emit('show');
        });

        self.overlay.on('hide', function () {
            self.emit('hide');
        });
    };

    VersionControlPopup.prototype = Object.create(Events.prototype);

    VersionControlPopup.prototype.show = function () {
        this.overlay.hidden = false;
    };

    VersionControlPopup.prototype.hide = function () {
        this.overlay.hidden = true;
    };

    VersionControlPopup.prototype.append = function (element) {
        this.panelContents.append(element);
    };

    editor.method('picker:versioncontrol:createPopup', function (args) {
        return new VersionControlPopup(args);
    });
});