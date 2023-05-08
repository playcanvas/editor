import { Container, Button, BooleanInput, Label } from '@playcanvas/pcui';

editor.once('load', function () {
    const root = editor.call('layout.root');
    const viewport = editor.call('layout.viewport');
    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    const settings = editor.call('settings:projectUser');

    const releaseCandidate = config.engineVersions.latest?.version;

    // panel
    const panel = new Container({
        class: 'top-controls'
    });
    viewport.append(panel);

    editor.method('layout.toolbar.launch', function () {
        return panel;
    });

    // launch
    const launch = new Container({
        class: 'launch',
        enabled: false
    });
    panel.append(launch);

    editor.on('scene:load', () => {
        launch.enabled = true;
    });
    editor.on('scene:unload', () => {
        launch.enabled = false;
    });

    const buttonLaunch = new Button({
        class: 'icon',
        icon: 'E131'
    });

    const launchText = document.createElement('span');
    launchText.innerText = 'Launch';
    buttonLaunch.dom.append(launchText);

    launch.append(buttonLaunch);

    const launchOptions = { };

    const launchApp = function () {
        let url = config.url.launch + config.scene.id;

        const query = [];

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

        if (config.url.useCustomEngine) {
            query.push('use_local_engine=' + config.url.engine);
        } else if (releaseCandidate && launchOptions.releaseCandidate) {
            query.push('version=' + config.engineVersions.latest.version);
            if (metrics) {
                metrics.increment('launch-release-candidate');
            }
        } else {
            const engineVersion = editor.call('settings:session').get('engineVersion');
            if (engineVersion && engineVersion !== 'current') {
                query.push('version=' + config.engineVersions[engineVersion].version);
            }
        }

        if (location.search.includes('use_local_frontend')) {
            query.push('use_local_frontend');
        }

        if (query.length)
            url += '?' + query.join('&');

        const launcher = window.open();
        launcher.opener = null;
        launcher.location = url;
    };

    buttonLaunch.on('click', launchApp);

    const panelOptions = new Container({
        class: 'options',
        hidden: true
    });
    launch.append(panelOptions);

    const createOption = function (name, title) {
        const panel = new Container();
        panelOptions.append(panel);

        const option = new BooleanInput({
            class: 'tick',
            value: false
        });
        option.style.marginTop = '6px';
        panel.append(option);

        option.on('click', (e) => {
            e.stopPropagation();
        });

        const label = new Label({
            text: title
        });
        panel.append(label);

        panel.on('click', () => {
            option.value = !option.value;
        });

        launchOptions[name] = false;
        option.on('change', (value) => {
            launchOptions[name] = value;
        });

        return option;
    };

    const optionProfiler = createOption('profiler', 'Profiler');
    const tooltipProfiler = Tooltip.attach({
        target: optionProfiler.parent.element,
        text: 'Enable the visual performance profiler in the launch page.',
        align: 'right',
        root: root
    });
    tooltipProfiler.class.add('launch-tooltip');

    const optionDebug = createOption('debug', 'Debug');

    let suspendDebug = false;
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

    const tooltipDebug = Tooltip.attach({
        target: optionDebug.parent.element,
        text: 'Enable the logging of warning and error messages to the JavaScript console.',
        align: 'right',
        root: root
    });
    tooltipDebug.class.add('launch-tooltip');


    if (!legacyScripts) {
        const optionConcatenate = createOption('concatenate', 'Concatenate Scripts');
        const tooltipConcatenate = Tooltip.attach({
            target: optionConcatenate.parent.element,
            text: 'Concatenate scripts on launch to reduce scene load time.',
            align: 'right',
            root: root
        });
        tooltipConcatenate.class.add('launch-tooltip');
    }

    if (editor.call('users:hasFlag', 'hasBundles')) {
        const optionDisableBundles = createOption('disableBundles', 'Disable Asset Bundles');

        const tooltipBundles = Tooltip.attach({
            target: optionDisableBundles.parent.element,
            text: 'Disable loading assets from Asset Bundles.',
            align: 'right',
            root: root
        });
        tooltipBundles.class.add('launch-tooltip');
    }

    const preferWebGl1 = createOption('webgl1', 'Prefer WebGL 1.0');

    const tooltipPreferWebGl1 = Tooltip.attach({
        target: preferWebGl1.parent.element,
        text: 'Force the use of WebGL 1 regardless of whether WebGL 2 is preferred in Scene Settings.',
        align: 'right',
        root: root
    });
    tooltipPreferWebGl1.class.add('launch-tooltip');

    if (!editor.call('settings:project').get('preferWebGl2'))
        preferWebGl1.parent.enabled = false;

    editor.call('settings:project').on('preferWebGl2:set', function (value) {
        preferWebGl1.parent.enabled = value;
    });

    // mini-stats
    const optionMiniStats = createOption('ministats', 'Mini stats');
    optionMiniStats.value = settings.get('editor.launchMinistats');
    settings.on('editor.launchMinistats:set', function (value) {
        if (value !== optionMiniStats.value) {
            optionMiniStats.value = value;
        }
    });
    optionMiniStats.on('change', function (value) {
        settings.set('editor.launchMinistats', value);
    });
    Tooltip.attach({
        target: optionMiniStats.parent.element,
        text: 'Show the MiniStats in the launched application.',
        align: 'right',
        root: root
    }).class.add('launch-tooltip');

    // release-candidate
    if (releaseCandidate) {
        const optionReleaseCandidate = createOption('releaseCandidate', 'Use Release Candidate');
        optionReleaseCandidate.value = settings.get('editor.launchReleaseCandidate');
        settings.on('editor.launchReleaseCandidate:set', function (value) {
            if (value !== optionReleaseCandidate.value) {
                optionReleaseCandidate.value = value;
            }
        });
        optionReleaseCandidate.on('change', function (value) {
            settings.set('editor.launchReleaseCandidate', value);
        });
        Tooltip.attach({
            target: optionReleaseCandidate.parent.element,
            text: `Launch the application using the engine release candidate (version ${releaseCandidate}).`,
            align: 'right',
            root: root
        }).class.add('launch-tooltip');
    }

    editor.method('launch', launchApp);

    editor.call('hotkey:register', 'launch', {
        key: 'enter',
        ctrl: true,
        callback: function () {
            if (editor.call('picker:isOpen')) return;
            launchApp();
        }
    });


    let timeout;

    // show dropdown menu
    launch.dom.addEventListener('mouseenter', function () {
        if (!editor.call('permissions:read') || !launch.enabled)
            return;

        panelOptions.hidden = false;
        if (timeout)
            clearTimeout(timeout);
    });

    // hide dropdown menu after a delay
    launch.dom.addEventListener('mouseleave', function () {
        if (!editor.call('permissions:write'))
            return;

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            panelOptions.hidden = true;
            timeout = null;
        }, 50);
    });

    // cancel hide
    panel.dom.addEventListener('mouseenter', function () {
        if (!panelOptions.hidden && timeout)
            clearTimeout(timeout);
    });

    // hide options after a while
    panel.dom.addEventListener('mouseleave', function () {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(function () {
            panelOptions.hidden = true;
            timeout = null;
        }, 50);
    });


    // fullscreen
    const buttonExpand = new Button({
        class: ['icon', 'expand'],
        icon: 'E127'
    });
    panel.append(buttonExpand);

    buttonExpand.on('click', () => {
        editor.call('viewport:expand');
    });

    const tooltipExpand = Tooltip.attach({
        target: buttonExpand.dom,
        text: 'Hide Panels',
        align: 'top',
        root: root
    });

    editor.on('viewport:expand', (state) => {
        if (state) {
            tooltipExpand.text = 'Show Panels';
            buttonExpand.class.add('active');
        } else {
            tooltipExpand.text = 'Hide Panels';
            buttonExpand.class.remove('active');
        }

        tooltipExpand.hidden = true;
    });

});
