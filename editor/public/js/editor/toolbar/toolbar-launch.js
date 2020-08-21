editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var viewport = editor.call('layout.viewport');
    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    var settings = editor.call('settings:projectUser');

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

        if (launchOptions.disableBundles) {
            query.push('useBundles=false');
        }

        if (launchOptions.ministats) {
            query.push('ministats=true');
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

    var layoutRight = editor.call('layout.attributes');

    var launchOptions = { };

    var panelOptions = new ui.Panel();
    panelOptions.class.add('options');
    launch.append(panelOptions);
    panelOptions.hidden = true;

    var createOption = function (name, title) {
        var panel = new ui.Panel();
        panel.flex = true;
        panelOptions.append(panel);

        var option = new ui.Checkbox();
        option.style.marginTop = '6px';
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
        text: 'Enable the visual performance profiler in the launch page.',
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
        text: 'Enable the logging of warning and error messages to the JavaScript console.',
        align: 'right',
        root: root
    });
    tooltipDebug.class.add('launch-tooltip');


    if (legacyScripts) {
        var local = createOption('local', 'Use Local Server');

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
            text: 'Concatenate scripts on launch to reduce scene load time.',
            align: 'right',
            root: root
        });
        tooltipConcatenate.class.add('launch-tooltip');
    }

    if (editor.call('users:hasFlag', 'hasBundles')) {
        var optionDisableBundles = createOption('disableBundles', 'Disable Asset Bundles');

        var tooltipBundles = Tooltip.attach({
            target: optionDisableBundles.parent.element,
            text: 'Disable loading assets from Asset Bundles.',
            align: 'right',
            root: root
        });
        tooltipBundles.class.add('launch-tooltip');
    }

    var preferWebGl1 = createOption('webgl1', 'Prefer WebGL 1.0');

    var tooltipPreferWebGl1 = Tooltip.attach({
        target: preferWebGl1.parent.element,
        text: 'Force the use of WebGL 1 regardless of whether WebGL 2 is preferred in Scene Settings.',
        align: 'right',
        root: root
    });
    tooltipPreferWebGl1.class.add('launch-tooltip');

    if (! editor.call('settings:project').get('preferWebGl2'))
        preferWebGl1.parent.disabled = true;

    editor.call('settings:project').on('preferWebGl2:set', function(value) {
        preferWebGl1.parent.disabled = ! value;
    });

    // mini-stats
    var optionMiniStats = createOption('ministats', 'Mini stats');
    optionMiniStats.value = settings.get('editor.ministats');
    settings.on('editor.launchMinistats:set', function (value) {
        if (value !== optionMiniStats.value) {
            optionMiniStats.value = value;
        }
    });
    optionMiniStats.on('change', function (value) {
        settings.set('editor.launchMinistats', value);
    });

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
