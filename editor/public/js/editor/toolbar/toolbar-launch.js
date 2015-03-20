editor.once('load', function() {
    'use strict';

    var viewport = editor.call('layout.viewport');


    // panel
    var panel = new ui.Panel();
    panel.class.add('top-controls');
    viewport.append(panel);


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
            buttonExpand.class.add('active');
        } else {
            buttonExpand.class.remove('active');
        }
    });

    // launch
    var launch = new ui.Panel();
    launch.class.add('launch');
    panel.append(launch);

    var dropdown = new ui.Button();
    dropdown.class.add('icon', 'dropdown');
    launch.append(dropdown);

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
    dropdown.element.addEventListener('mouseenter', function () {
        dropdownMenu.style.visibility = 'visible';
        if (timeout)
            clearTimeout(timeout);
    });

    // hide dropdown menu after a delay
    dropdown.element.addEventListener('mouseleave', function () {
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

        if (launchLocally) {
            url += '?local=true';
        }

        window.open(url, 'pc.launch.' + config.scene.id);
    }
});
