editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var viewport = editor.call('layout.viewport');
    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    var settings = editor.call('settings:projectUser');
    var privateSettings = editor.call('settings:projectPrivate');

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

    var launchApp = function () {
        var url = config.url.launch + config.scene.id;

        var query = [ ];

        if (launchOptions.local) {
            url = url.replace(/^https/, 'http');
            query.push('local=' + settings.get('editor.localServer'));
        }

        if (launchOptions.webgl1) {
            query.push('webgl1=true');
        }

        if (launchOptions.profiler) {
            query.push('profile=true');
        }

        if (launchOptions.debug) {
            query.push('debug=true');
        }

        if (launchOptions.concatenate) {
            query.push('concatenateScripts=true');
        }

        if (!launchOptions.local && launchOptions.facebook && privateSettings.get('facebook.appId')) {
            url = 'https://www.facebook.com/embed/instantgames/' +
                  privateSettings.get('facebook.appId') +
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

    buttonLaunch.on('click', launchApp);

    var tooltip = Tooltip.attach({
        target: launch.element,
        text: 'Launch',
        root: root
    });

    var layoutRight = editor.call('layout.right');

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
    };

    var optionProfiler = createOption('profiler', 'Profiler');
    var tooltipProfiler = Tooltip.attach({
        target: optionProfiler.parent.element,
        text: 'Enable to include panel for profiling Frame, Scene and Timeline data.',
        align: 'right',
        root: root
    });
    tooltipProfiler.class.add('launch-tooltip');

    var optionDebug = createOption('debug', 'Debug');

    var suspendDebug = false;
    optionDebug.value = settings.get('editor.launchDebug');
    settings.on('editor.launchDebug:set', function (value) {
        suspendDebug = true;
        optionDebug.value = value;
        suspendDebug = false;
    });
    optionDebug.on('change', function (value) {
        if (suspendDebug) return;
        settings.set('editor.launchDebug', value);
    });

    var tooltipDebug = Tooltip.attach({
        target: optionDebug.parent.element,
        text: 'Enable to ensure engine logs warnings and errors to be addressed during development.',
        align: 'right',
        root: root
    });
    tooltipDebug.class.add('launch-tooltip');


    if (legacyScripts) {
        var local = createOption('local', 'Use Local Server');
        local.on('change', function (value) {
            fb.parent.disabled = value;
        });

        var getTooltipText = function () {
            var tooltipText = 'Enable this if you want to load scripts from your local server.';
            if (settings.get('editor.localServer')) {
                tooltipText +=  ' If enabled scripts will be loaded from <a href="' +
                       settings.get('editor.localServer') + '" target="_blank">' + settings.get('editor.localServer') + '</a>.';
            }

            tooltipText += ' You can change your Local Server URL from the Editor settings.';
            return tooltipText;
        };

        settings.on('editor.localServer:set', function () {
            tooltipLocal.html = getTooltipText();
        });

        var tooltipLocal = Tooltip.attach({
            target: local.parent.element,
            html: getTooltipText(),
            align: 'right',
            root: root
        });

        tooltipLocal.class.add('launch-tooltip');
    } else {
        var optionConcatenate = createOption('concatenate', 'Concatenate Scripts');
        var tooltipConcatenate = Tooltip.attach({
            target: optionConcatenate.parent.element,
            text: 'Enable the concatenation of scripts to reduce network requests.',
            align: 'right',
            root: root
        });
        tooltipConcatenate.class.add('launch-tooltip');
    }

    var preferWebGl1 = createOption('webgl1', 'Prefer WebGL 1.0');

    var tooltipPreferWebGl1 = Tooltip.attach({
        target: preferWebGl1.parent.element,
        text: 'If WebGL 2.0 is preferred in Project Settings, for testing purposes WebGL 1.0 can be enforced.',
        align: 'right',
        root: root
    });
    tooltipPreferWebGl1.class.add('launch-tooltip');

    if (! editor.call('settings:project').get('preferWebGl2'))
        preferWebGl1.parent.disabled = true;

    editor.call('settings:project').on('preferWebGl2:set', function(value) {
        preferWebGl1.parent.disabled = ! value;
    });

    // facebook
    var fb = createOption('facebook', 'Launch on Facebook');

    if (!editor.call('users:hasFlag', 'hasPublishOnFacebook')) {
        fb.parent.hidden = true;
    }

    var tooltipFb = Tooltip.attach({
        target: fb.parent.element,
        text: 'In order to launch on Facebook you have to set your Facebook App ID in the settings.',
        align: 'right',
        root: root
    });
    tooltipFb.class.add('launch-tooltip');

    if (privateSettings.get('facebook.appId'))
        tooltipFb.class.add('invisible');

    privateSettings.on('facebook.appId:set', function (value) {
        if (value) {
            tooltipFb.class.add('invisible');
        } else {
            tooltipFb.class.remove('invisible');
        }
    });

    fb.on('change', function (value) {
        if (! value) return;

        if (! privateSettings.get('facebook.appId')) {
            editor.call('viewport:expand', false);

            // open facebook settings
            editor.call('selector:set', 'editorSettings', [ editor.call('settings:projectUser') ]);
            setTimeout(function() {
                editor.call('editorSettings:panel:unfold', 'facebook');
            }, 0);
        }
    });


    var onLaunchClick = function() {
        panelOptions.hidden = true;
        launchApp();
    };

    editor.method('launch', launchApp);

    editor.call('hotkey:register', 'launch', {
        key: 'enter',
        ctrl: true,
        callback: function () {
            if (editor.call('picker:isOpen')) return;
            launchApp();
        }
    });


    var timeout;

    // show dropdown menu
    launch.element.addEventListener('mouseenter', function () {
        if (! editor.call('permissions:read') || launch.disabled)
            return;

        tooltip.align = (layoutRight && (layoutRight.hidden || layoutRight.folded)) ? 'right' : 'left';

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
