editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var viewport = editor.call('layout.viewport');


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

    var buttonLaunch = new ui.Button({
        text: '&#57649;'
    });
    buttonLaunch.class.add('icon');
    launch.append(buttonLaunch);

    var dropdownMenu = document.createElement('ul');
    dropdownMenu.classList.add('dropdown-menu')
    dropdownMenu.style.visibility = 'hidden';
    launch.append(dropdownMenu);

    var launchButton = 'default';
    var launchButtons = { };

    launchButtons['default'] = document.createElement('li');
    launchButtons['default'].classList.add('ticked');
    launchButtons['default'].innerHTML = 'Launch';
    launchButtons['default']._launch = 'default';
    dropdownMenu.appendChild(launchButtons['default']);

    launchButtons['profile'] = document.createElement('li');
    launchButtons['profile'].innerHTML = 'Launch (Profiler)'
    launchButtons['profile']._launch = 'profile';
    dropdownMenu.appendChild(launchButtons['profile']);

    launchButtons['local'] = document.createElement('li');
    launchButtons['local'].innerHTML = 'Launch (Local)';
    launchButtons['local']._launch = 'local';
    dropdownMenu.appendChild(launchButtons['local']);

    launchButtons['local,profile'] = document.createElement('li');
    launchButtons['local,profile'].innerHTML = 'Launch (Local, Profiler)'
    launchButtons['local,profile']._launch = 'local,profile';
    dropdownMenu.appendChild(launchButtons['local,profile']);

    var onLaunchClick = function() {
        if (launchButton !== this._launch) {
            launchButtons[launchButton].classList.remove('ticked');
            launchButton = this._launch;
            launchButtons[launchButton].classList.add('ticked');
        }

        dropdownMenu.style.visibility = 'hidden';
        launchApp();
    };

    for(var key in launchButtons) {
        if (! launchButtons.hasOwnProperty(key))
            continue;

        launchButtons[key].addEventListener('click', onLaunchClick, false);
    }

    buttonLaunch.on('click', function () {
        launchApp();
    });

    var launchApp = function () {
        var url = window.location.href.replace(/^https/, 'http') + '/launch';
        var settings = editor.call('designerSettings');

        var query = [ ];

        if (launchButton.indexOf('local') !== -1)
            query.push('local=' + settings.get('local_server'));

        if (launchButton.indexOf('profile') !== -1)
            query.push('profile=true');

        if (query.length)
            url += '?' + query.join('&');

        window.open(url, 'pc.launch.' + config.scene.id);
    };

    editor.call('hotkey:register', 'launch', {
        key: 'enter',
        ctrl: true,
        callback: launchApp
    });


    var timeout;

    // show dropdown menu
    launch.element.addEventListener('mouseenter', function () {
        if (! editor.call('permissions:write'))
            return;

        dropdownMenu.style.visibility = 'visible';
        if (timeout)
            clearTimeout(timeout);
    });

    // hide dropdown menu after a delay
    launch.element.addEventListener('mouseleave', function () {
        if (! editor.call('permissions:write'))
            return;

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(function () {
            dropdownMenu.style.visibility = 'hidden';
            timeout = null;
        }, 50);
    });

    // cancel hide
    dropdownMenu.addEventListener('mouseenter', function () {
        if (dropdownMenu.style.visibility === 'visible' && timeout)
            clearTimeout(timeout);
    });

    // hide dropdown menu after a delay
    dropdownMenu.addEventListener('mouseleave', function () {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(function () {
            dropdownMenu.style.visibility = 'hidden';
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
