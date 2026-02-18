import { Container, Button, BooleanInput, Label, Divider } from '@playcanvas/pcui';

import { LegacyTooltip } from '@/common/ui/tooltip';
import { config } from '@/editor/config';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const viewport = editor.call('layout.viewport');
    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    const settings = editor.call('settings:projectUser');

    const releaseCandidate = config.engineVersions.releaseCandidate?.version;

    // panel
    const panel = new Container({
        class: ['control-strip', 'top-right']
    });
    viewport.append(panel);

    editor.method('layout.toolbar.launch', () => {
        return panel;
    });

    // launch
    const launch = new Container({
        class: 'launch',
        enabled: false
    });
    editor.on('scene:load', () => {
        launch.enabled = true;
    });
    editor.on('scene:unload', () => {
        launch.enabled = false;
    });

    const buttonLaunch = new Button({
        icon: 'E131',
        text: 'Launch'
    });
    launch.append(buttonLaunch);

    const launchOptions = { };

    const launchApp = (deviceOptions?: { webgpu?: boolean; webgl2?: boolean; webgl1?: boolean; [key: string]: boolean | undefined }) => {
        let url = config.url.launch + config.scene.id;

        const query = [];

        if (deviceOptions.webgpu) {
            query.push('device=webgpu');
        } else if (deviceOptions.webgl2) {
            query.push('device=webgl2');
        } else if (deviceOptions.webgl1) {
            query.push('device=webgl1');
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

        const params = new URLSearchParams(location.search);
        if (params.has('use_local_engine')) {
            query.push(`use_local_engine=${params.get('use_local_engine')}`);
        } else if (releaseCandidate && launchOptions.releaseCandidate) {
            query.push(`version=${releaseCandidate}`);
        } else if (launchOptions.force) {
            query.push(`version=${config.engineVersions.force.version}`);
        } else {
            const engineVersion = editor.call('settings:session').get('engineVersion');
            if (engineVersion && engineVersion !== 'current') {
                query.push(`version=${config.engineVersions[engineVersion].version}`);
            }
        }

        if (location.search.includes('use_local_frontend')) {
            query.push('use_local_frontend');
        }

        if (query.length) {
            url += `?${query.join('&')}`;
        }

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

    const createButton = (name, title) => {
        const launch = new Container({
            class: 'launch',
            enabled: false
        });
        panelOptions.append(launch);

        editor.on('scene:load', () => {
            launch.enabled = true;
        });
        editor.on('scene:unload', () => {
            launch.enabled = false;
        });

        const button = new Button({
            icon: 'E131',
            text: title
        });
        launch.append(button);

        const divider = new Divider();
        divider.on('click', (e: MouseEvent) => e.stopPropagation());

        launch.append(divider);
        launch.on('click', () => launchApp({ [name]: true }));

        return button;
    };

    const createOption = (name: string, title: string) => {
        const panel = new Container();
        panelOptions.append(panel);

        const option = new BooleanInput({
            class: 'tick',
            value: false
        });
        option.style.marginTop = '6px';
        panel.append(option);

        option.on('click', (e: MouseEvent) => {
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
        option.on('change', (value: boolean) => {
            launchOptions[name] = value;
        });

        return option;
    };

    const launchWithWebGpu = createButton('webgpu', `Launch with WebGPU${editor.projectEngineV2 ? '' : ' (beta)'}`);
    const tooltipPreferWebGpu = LegacyTooltip.attach({
        target: launchWithWebGpu.parent.element,
        text: `Launch the application using WebGPU${editor.projectEngineV2 ? '' : ' (beta)'}.`,
        align: 'right',
        root: root
    });
    tooltipPreferWebGpu.class.add('launch-tooltip');

    const launchWithWebGL2 = createButton('webgl2', 'Launch with WebGL 2.0');
    const tooltipPreferWebGl2 = LegacyTooltip.attach({
        target: launchWithWebGL2.parent.element,
        text: 'Launch the application using WebGL 2.0.',
        align: 'right',
        root: root
    });
    tooltipPreferWebGl2.class.add('launch-tooltip');

    const launchWithWebGL1 = createButton('webgl1', 'Launch with WebGL 1.0');
    const tooltipPreferWebGl1 = LegacyTooltip.attach({
        target: launchWithWebGL1.parent.element,
        text: 'Launch the application using WebGL 1.0.',
        align: 'right',
        root: root
    });
    tooltipPreferWebGl1.class.add('launch-tooltip');
    launchWithWebGL1.parent.hidden = editor.projectEngineV2;

    const optionProfiler = createOption('profiler', 'Profiler');
    const tooltipProfiler = LegacyTooltip.attach({
        target: optionProfiler.parent.element,
        text: 'Enable the visual performance profiler in the launch page.',
        align: 'right',
        root: root
    });
    tooltipProfiler.class.add('launch-tooltip');

    const optionDebug = createOption('debug', 'Debug');

    let suspendDebug = false;
    optionDebug.value = settings.get('editor.launchDebug');
    settings.on('editor.launchDebug:set', (value: boolean) => {
        suspendDebug = true;
        optionDebug.value = value;
        suspendDebug = false;
    });
    optionDebug.on('change', (value: boolean) => {
        if (suspendDebug) {
            return;
        }
        settings.set('editor.launchDebug', value);
    });

    const tooltipDebug = LegacyTooltip.attach({
        target: optionDebug.parent.element,
        text: 'Enable the logging of warning and error messages to the JavaScript console.',
        align: 'right',
        root: root
    });
    tooltipDebug.class.add('launch-tooltip');

    if (!legacyScripts) {
        const optionConcatenate = createOption('concatenate', 'Concatenate Scripts (Classic)');
        const tooltipConcatenate = LegacyTooltip.attach({
            target: optionConcatenate.parent.element,
            text: 'Concatenate Classic scripts on launch to reduce scene load time.',
            align: 'right',
            root: root
        });
        tooltipConcatenate.class.add('launch-tooltip');
    }

    if (editor.call('users:hasFlag', 'hasBundles')) {
        const optionDisableBundles = createOption('disableBundles', 'Disable Asset Bundles');

        const tooltipBundles = LegacyTooltip.attach({
            target: optionDisableBundles.parent.element,
            text: 'Disable loading assets from Asset Bundles.',
            align: 'right',
            root: root
        });
        tooltipBundles.class.add('launch-tooltip');
    }

    // mini-stats
    const optionMiniStats = createOption('ministats', 'Mini stats');
    optionMiniStats.value = settings.get('editor.launchMinistats');
    settings.on('editor.launchMinistats:set', (value: boolean) => {
        if (value !== optionMiniStats.value) {
            optionMiniStats.value = value;
        }
    });
    optionMiniStats.on('change', (value: boolean) => {
        settings.set('editor.launchMinistats', value);
    });
    LegacyTooltip.attach({
        target: optionMiniStats.parent.element,
        text: 'Show the MiniStats in the launched application.',
        align: 'right',
        root: root
    }).class.add('launch-tooltip');

    // force engine version
    const force = config.engineVersions.force;
    const optionForce = createOption('force', `Force Engine V${force.version[0]}`);
    const tooltipForce = LegacyTooltip.attach({
        target: optionForce.parent.element,
        text: `Force the launcher to use v${force.version}.`,
        align: 'right',
        root: root
    });
    tooltipForce.class.add('launch-tooltip');

    // release-candidate
    if (releaseCandidate) {
        const optionReleaseCandidate = createOption('releaseCandidate', 'Use Release Candidate');
        optionReleaseCandidate.value = settings.get('editor.launchReleaseCandidate');
        settings.on('editor.launchReleaseCandidate:set', (value: boolean) => {
            if (value !== optionReleaseCandidate.value) {
                optionReleaseCandidate.value = value;
            }
        });
        optionReleaseCandidate.on('change', (value: boolean) => {
            settings.set('editor.launchReleaseCandidate', value);
        });
        LegacyTooltip.attach({
            target: optionReleaseCandidate.parent.element,
            text: `Launch the application using the engine release candidate (version ${releaseCandidate}).`,
            align: 'right',
            root: root
        }).class.add('launch-tooltip');
    }

    editor.method('launch', launchApp);

    editor.call('hotkey:register', 'launch', {
        key: 'Enter',
        ctrl: true,
        callback: function () {
            if (editor.call('picker:isOpen')) {
                return;
            }
            launchApp();
        }
    });


    let timeout;

    // show dropdown menu
    launch.dom.addEventListener('mouseenter', () => {
        if (!editor.call('permissions:read') || !launch.enabled) {
            return;
        }

        panelOptions.hidden = false;
        if (timeout) {
            clearTimeout(timeout);
        }
    });

    // hide dropdown menu after a delay
    launch.dom.addEventListener('mouseleave', () => {
        if (!editor.call('permissions:write')) {
            return;
        }

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            panelOptions.hidden = true;
            timeout = null;
        }, 50);
    });

    // cancel hide
    panel.dom.addEventListener('mouseenter', () => {
        if (!panelOptions.hidden && timeout) {
            clearTimeout(timeout);
        }
    });

    // hide options after a while
    panel.dom.addEventListener('mouseleave', () => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            panelOptions.hidden = true;
            timeout = null;
        }, 50);
    });


    // fullscreen
    const buttonExpand = new Button({
        class: 'expand',
        icon: 'E127'
    });
    panel.append(buttonExpand);
    panel.append(launch);

    buttonExpand.on('click', () => {
        editor.call('viewport:expand');
    });

    const tooltipExpand = LegacyTooltip.attach({
        target: buttonExpand.dom,
        text: 'Hide Panels',
        align: 'top',
        root: root
    });

    editor.on('viewport:expand', (state: boolean) => {
        if (state) {
            tooltipExpand.text = 'Show Panels';
            buttonExpand.class.add('active');
        } else {
            tooltipExpand.text = 'Hide Panels';
            buttonExpand.class.remove('active');
        }

        tooltipExpand.hidden = true;
    });

    editor.on('toolbar:launch:refresh', () => {
        const { enableWebGpu, enableWebGl2 } = editor.call('settings:project').json();
        launchWithWebGpu.parent.hidden = enableWebGpu;
        launchWithWebGL2.parent.hidden = !enableWebGpu && enableWebGl2;
        launchWithWebGL1.parent.hidden = editor.projectEngineV2 || (!enableWebGpu && !enableWebGl2);
    });

    // collapse button text to icon-only when the viewport is too narrow
    const topLeft = document.querySelector('.control-strip.top-left');
    const minGap = 20;

    const topStrips = ':is(.control-strip.top-left, .control-strip.top-right)';
    const buttonSelector = [
        `${topStrips} > .pcui-button`,
        `${topStrips} > .render > .pcui-button`,
        `${topStrips} > .camera > .pcui-button`,
        `${topStrips} > .launch > .pcui-button`
    ].join(', ');

    const restoreButtonText = () => {
        document.querySelectorAll(buttonSelector).forEach((btn) => {
            const text = btn.getAttribute('data-full-text');
            if (text !== null) {
                btn.textContent = text;
                btn.removeAttribute('data-full-text');
            }
        });
    };

    const clearButtonText = () => {
        document.querySelectorAll(buttonSelector).forEach((btn) => {
            if (btn.textContent) {
                btn.setAttribute('data-full-text', btn.textContent);
                btn.textContent = '';
            }
        });
    };

    const updateCompact = () => {
        // restore text to measure full width
        restoreButtonText();

        const leftRect = topLeft.getBoundingClientRect();
        const rightRect = panel.dom.getBoundingClientRect();

        if (leftRect.right + minGap > rightRect.left) {
            clearButtonText();
        }
    };

    editor.on('viewport:resize', updateCompact);
    editor.on('scene:name', updateCompact);
});
