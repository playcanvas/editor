editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var viewport = editor.call('layout.viewport');


    // panel
    var panel = new ui.Panel();
    panel.class.add('top-controls');
    viewport.append(panel);


    // launch
    var launch = new ui.Panel();
    launch.class.add('launch');
    panel.append(launch);

    var buttonLaunch = new ui.Button({
        text: '&#57922;'
    });
    buttonLaunch.class.add('icon');
    launch.append(buttonLaunch);

    var dropdownMenu = document.createElement('ul');
    dropdownMenu.classList.add('dropdown-menu')
    dropdownMenu.style.visibility = 'hidden';
    launch.append(dropdownMenu);

    var launchRemote = document.createElement('li');
    launchRemote.classList.add('ticked');
    launchRemote.innerHTML = 'Launch'
    dropdownMenu.appendChild(launchRemote);

    var launchLocal = document.createElement('li');
    launchLocal.innerHTML = 'Launch (Local)'
    dropdownMenu.appendChild(launchLocal);

    var launchLocally = false;
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

    // launch remote
    launchRemote.addEventListener('click', function () {
        launchLocally = false;
        launchRemote.classList.add('ticked');
        launchLocal.classList.remove('ticked');
        dropdownMenu.style.visibility = 'hidden';
        launchApp();
    });

    launchLocal.addEventListener('click', function () {
        launchLocally = true;
        launchLocal.classList.add('ticked');
        launchRemote.classList.remove('ticked');
        dropdownMenu.style.visibility = 'hidden';
        launchApp();
    });

    buttonLaunch.on('click', function () {
        launchApp();
    });

    var launchApp = function () {
        var url = window.location.href.replace(/^https/, 'http') + '/launch';

        if (launchLocally)
            url += '?local=true';

        window.open(url, 'pc.launch.' + config.scene.id);
    };


    // fullscreen
    var buttonExpand = new ui.Button({
        text: '&#57665;'
    });
    buttonExpand.class.add('icon', 'expand');
    panel.append(buttonExpand);

    buttonExpand.on('click', function() {
        editor.call('viewport:expand');
    });
    editor.on('viewport:expand', function(state) {
        buttonExpand.text = state ? '&#57656;' : '&#57665;';

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
