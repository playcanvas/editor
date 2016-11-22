editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var viewport = editor.call('layout.viewport');
    var legacyScripts = editor.call('project:settings').get('use_legacy_scripts');

    var privateSettings = editor.call('project:privateSettings');

    // panel
    var panel = new ui.Panel();
    panel.class.add('top-controls');
    viewport.append(panel);

    editor.method('layout.toolbar.launch', function () {
        return panel;
    });

    // launch
    var launch = new ui.Panel();
    launch.class.add('launch');
    panel.append(launch);
    launch.disabled = true;

    editor.on('scene:load', function () {
        launch.disabled = false;
    });

    editor.on('scene:unload', function () {
        launch.disabled = true;
    });

    var buttonLaunch = new ui.Button({
        text: '&#57649;'
    });
    buttonLaunch.class.add('icon');
    launch.append(buttonLaunch);

    buttonLaunch.on('click', function () {
        launchApp();
    });

    var tooltip = Tooltip.attach({
        target: launch.element,
        text: 'Launch',
        align: 'left',
        root: root
    });

    var launchOptions = { };

    var panelOptions = new ui.Panel();
    panelOptions.class.add('options');
    launch.append(panelOptions);
    panelOptions.hidden = true;

    var createOption = function (name, title) {
        var panel = new ui.Panel();
        panelOptions.append(panel);

        var option = new ui.Checkbox();
        option.value = false;
        option.class.add('tick');
        panel.append(option);

        option.on('click', function (e) {
            e.stopPropagation();
        });

        var label = new ui.Label({text: title});
        panel.append(label);

        panel.on('click', function () {
            option.value = !option.value;
        });

        launchOptions[name] = false;
        option.on('change', function (value) {
            launchOptions[name] = value;
        });

        return option;
    }

    createOption('profiler', 'Profiler');

    if (legacyScripts) {
        var local = createOption('local', 'Use Local Server');
        local.on('change', function (value) {
            fb.parent.disabled = value;
        });
    }

    var fb = createOption('facebook', 'Launch on Facebook');

    if (!config.self.superUser && !config.self.publishFacebook)
        fb.parent.hidden = true;

    var tooltipFb = Tooltip.attach({
        target: fb.parent.element,
        text: 'In order to launch on Facebook you have to set your Facebook App ID in the settings.',
        align: 'right',
        root: root
    });
    tooltipFb.class.add('launch-facebook');

    if (privateSettings.get('facebook.app_id')) {
        tooltipFb.class.add('invisible');
    }

    privateSettings.on('facebook.app_id:set', function (value) {
        if (value)
            tooltipFb.class.add('invisible');
        else
            tooltipFb.class.remove('invisible');
    });

    fb.on('change', function (value) {
        if (! value) return;

        if (! privateSettings.get('facebook.app_id')) {
            // open facebook settings
            editor.call('selector:set', 'designerSettings', [ editor.call('designerSettings') ]);
            setTimeout(function() {
                editor.call('designerSettings:panel:unfold', 'facebook');
            }, 0);
        }
    });


    var onLaunchClick = function() {
        panelOptions.hidden = true;
        launchApp();
    };

    var launchApp = function () {
        var url = (window.location.origin + window.location.pathname) + '/launch';

        var settings = editor.call('designerSettings');

        var query = [ ];

        if (launchOptions.local) {
            url = url.replace(/^https/, 'http');
            query.push('local=' + settings.get('local_server'));
        }

        if (launchOptions.profiler)
            query.push('profile=true');

        if (!launchOptions.local && launchOptions.facebook && privateSettings.get('facebook.app_id')) {
            url = 'https://www.facebook.com/embed/instantgames/' +
                  privateSettings.get('facebook.app_id') +
                  '/player?game_url=' +
                  url;

            query.push('facebook=true');
        }

        if (query.length)
            url += '?' + query.join('&');

        var launcher = window.open();
        launcher.opener = null;
        launcher.location = url;
    };

    editor.method('launch', function() {
        launchApp();
    });

    editor.call('hotkey:register', 'launch', {
        key: 'enter',
        ctrl: true,
        callback: launchApp
    });


    var timeout;

    // show dropdown menu
    launch.element.addEventListener('mouseenter', function () {
        if (! editor.call('permissions:read') || launch.disabled)
            return;

        panelOptions.hidden = false;
        if (timeout)
            clearTimeout(timeout);
    });

    // hide dropdown menu after a delay
    launch.element.addEventListener('mouseleave', function () {
        if (! editor.call('permissions:write'))
            return;

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(function () {
            panelOptions.hidden = true;
            timeout = null;
        }, 50);
    });

    // cancel hide
    panel.element.addEventListener('mouseenter', function () {
        if (!panelOptions.hidden && timeout)
            clearTimeout(timeout);

    });

    // hide options after a while
    panel.element.addEventListener('mouseleave', function () {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(function () {
            panelOptions.hidden = true;
            timeout = null;
        }, 50);
    });


    // fullscreen
    var buttonExpand = new ui.Button({
        text: '&#57639;'
    });
    buttonExpand.class.add('icon', 'expand');
    panel.append(buttonExpand);

    buttonExpand.on('click', function() {
        editor.call('viewport:expand');
    });
    editor.on('viewport:expand', function(state) {
        if (state) {
            tooltipExpand.text = 'Show Panels';
            buttonExpand.class.add('active');
        } else {
            tooltipExpand.text = 'Hide Panels';
            buttonExpand.class.remove('active');
        }

        tooltipExpand.hidden = true;
    });

    var tooltipExpand = Tooltip.attach({
        target: buttonExpand.element,
        text: 'Hide Panels',
        align: 'top',
        root: root
    });
});
