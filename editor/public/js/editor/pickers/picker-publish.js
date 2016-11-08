editor.once('load', function () {
    'use strict';

    // main panel
    var panel = new ui.Panel();
    panel.class.add('picker-publish');

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
    panelPlaycanvas.class.add('buttons');
    panel.append(panelPlaycanvas);

    panelPlaycanvas.append(new ui.Label({
        text: 'Publish on PlayCanvas.'
    }));

    // publish button
    var btnPublish = new ui.Button({text: 'Publish'});
    btnPublish.class.add('publish');
    handlePermissions(btnPublish);
    panelPlaycanvas.append(btnPublish);

    btnPublish.on('click', function () {
        editor.call('picker:publish:new');
    });

    // facebook instant
    var panelFbInstant = new ui.Panel();
    panelFbInstant.class.add('buttons');
    panel.append(panelFbInstant);
    panelFbInstant.hidden = !config.self.superUser && !config.self.publishFacebook

    panelFbInstant.append(new ui.Label({
        text: 'Publish build to Facebook Instant Games.'
    }));

    var btnPublishFb = new ui.Button({text: 'Publish'});
    btnPublishFb.class.add('upload');
    handlePermissions(btnPublishFb);
    panelFbInstant.append(btnPublishFb);

    btnPublishFb.on('click', function () {
        editor.call('picker:publish:facebook');
    });


    // self host
    var panelSelfHost = new ui.Panel();
    panelSelfHost.class.add('buttons');
    panel.append(panelSelfHost);

    panelSelfHost.append(new ui.Label({
        text: 'Download build and host it on your own server.'
    }));

    // download button
    var btnDownload = new ui.Button({text: 'Download'});
    btnDownload.class.add('download');
    handlePermissions(btnDownload);
    panelSelfHost.append(btnDownload);

    btnDownload.on('click', function () {
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
