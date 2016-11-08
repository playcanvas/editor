editor.once('load', function () {
    'use strict';

    // main panel
    var panel = new ui.Panel();
    panel.class.add('picker-publish');

    // register panel with project popup
    editor.call('picker:project:registerMenu', 'publish', 'Publish', panel);

    // holds events that need to be destroyed
    var events = [];

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

    // facebook instant
    var panelFbInstant = new ui.Panel();
    panelFbInstant.class.add('buttons');
    panel.append(panelFbInstant);
    panelFbInstant.hidden = !config.self.superUser && !config.self.publishFacebook

    panelFbInstant.append(new ui.Label({
        text: 'Upload build on a Facebook Instant Game.'
    }));

    var btnPublishFb = new ui.Button({text: 'Upload'});
    btnPublishFb.class.add('upload');
    handlePermissions(btnPublishFb);
    panelFbInstant.append(btnPublishFb);

    btnPublishFb.on('click', function () {
        editor.call('picker:publish:facebook');
    });

});
