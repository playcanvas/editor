editor.once('load', function () {
    'use strict';

    // main panel
    var panel = new ui.Panel();
    panel.class.add('picker-publish');
    panel.flex = true;

    // register panel with project popup
    editor.call('picker:project:registerMenu', 'publish', 'Publish', panel);

    // disables / enables field depending on permissions
    var handlePermissions = function (field) {
        field.disabled = ! editor.call('permissions:write');
        return editor.on('permissions:set:' + config.self.id, function (accessLevel) {
            if (accessLevel === 'write' || accessLevel == 'admin') {
                field.disabled = false;
            } else {
                field.disabled = true;
            }
        });
    };

    // open publishing popup
    editor.method('picker:publish', function () {
        editor.call('picker:project', 'publish');
    });


    // playcanv.as
    var panelPlaycanvas = new ui.Panel();
    panelPlaycanvas.flex = true;
    panelPlaycanvas.class.add('buttons');
    panel.append(panelPlaycanvas);

    var labelIcon = new ui.Label({
        text: '&#57960;',
        unsafe: true
    });
    labelIcon.class.add('icon');
    panelPlaycanvas.append(labelIcon);

    var labelDesc = new ui.Label({
        text: 'Publish your project publicly on PlayCanvas.'
    });
    labelDesc.class.add('desc');
    panelPlaycanvas.append(labelDesc);

    // publish button
    var btnPublish = new ui.Button({text: 'Publish To PlayCanvas'});
    btnPublish.class.add('publish');
    handlePermissions(btnPublish);
    panelPlaycanvas.append(btnPublish);

    panelPlaycanvas.on('click', function () {
        editor.call('picker:publish:new');
    });

    // self host
    var panelSelfHost = new ui.Panel();
    panelSelfHost.flex = true;
    panelSelfHost.class.add('buttons');
    panel.append(panelSelfHost);

    labelIcon = new ui.Label({
        text: '&#57925;',
        unsafe: true
    });
    labelIcon.class.add('icon');
    panelSelfHost.append(labelIcon);

    labelDesc = new ui.Label({
        text: 'Download build and host it on your own server.'
    });
    labelDesc.class.add('desc');
    panelSelfHost.append(labelDesc);

    // download button
    var btnDownload = new ui.Button({text: 'Download .zip'});
    btnDownload.class.add('download');
    handlePermissions(btnDownload);
    panelSelfHost.append(btnDownload);

    panelSelfHost.on('click', function () {
        editor.call('picker:publish:download');
    });

    // on show
    panel.on('show', function () {
        editor.emit('picker:publish:open');

        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', false);
    });

    // on hide
    panel.on('hide', function () {
        editor.emit('picker:publish:close');

        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', true);
    });

    editor.on('viewport:hover', function(state) {
        if (state && ! panel.hidden) {
            setTimeout(function() {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });
});
