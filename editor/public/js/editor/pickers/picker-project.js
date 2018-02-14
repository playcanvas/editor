editor.once('load', function () {
    'use strict';

    // overlay
    var overlay = new ui.Overlay();
    overlay.class.add('picker-project');
    overlay.clickable = true;
    overlay.hidden = true;

    var root = editor.call('layout.root');
    root.append(overlay);

    // main panel
    var panel = new ui.Panel();
    panel.class.add('project');
    overlay.append(panel);

    // left side panel
    var leftPanel = new ui.Panel();
    panel.append(leftPanel);
    leftPanel.class.add('left');

    // project image
    var blankImage = config.url.static + '/platform/images/common/blank_project.png';

    var projectImg = document.createElement('div');
    projectImg.classList.add('image');
    projectImg.style.backgroundImage = 'url("' + (config.project.thumbnails.m || blankImage) + '")';
    leftPanel.append(projectImg);

    var uploadProjectImage = function (file) {
        if (! editor.call('permissions:write'))
            return;

        if (uploadingImage)
            return;

        projectImg.style.backgroundImage = 'url("' + config.url.static + '/platform/images/common/ajax-loader.gif")';
        projectImg.classList.add('progress');

        uploadingImage = true;

        editor.call('images:upload', file, function (data) {
            editor.call('project:save', {image_url: data.url}, function () {
                uploadingImage = false;

            }, function () {
                // error
                uploadingImage = false;

            });
        }, function (status, data) {
            // error
            uploadingImage = false;
        });
    };

    var dropRef = editor.call('drop:target', {
        ref: projectImg,
        filter: function (type, data) {
            return editor.call('permissions:write') &&
                   ! uploadingImage &&
                   type === 'files';
        },
        drop: function (type, data) {
            if (type !== 'files')
                return;

            var file = data[0];
            if (! file)
                return;

            if (! /^image\//.test(file.type))
                return;

            uploadProjectImage(file);
        }
    });

    dropRef.element.classList.add('drop-area-project-img');

    // hidden file input to upload project image
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    var currentSelection = null;
    var uploadingImage = false;

    projectImg.addEventListener('click', function () {
        if (! editor.call('permissions:write'))
            return;

        fileInput.click();
    });


    fileInput.addEventListener('change', function () {
        var file = fileInput.files[0];
        fileInput.value = null;

        uploadProjectImage(file);
    });

    // project info
    var info = document.createElement('div');
    info.classList.add('info');
    leftPanel.append(info);

    // name
    var projectName = new ui.Label({
        text: config.project.name
    });
    projectName.class.add('name');
    info.appendChild(projectName.element);

    // quick stats
    // TODO

    // store all panels for each menu option
    var menuOptions = {};

    var defaultMenuOption = null;

    // menu
    var list = new ui.List();
    leftPanel.append(list);

    // right side panel
    var rightPanel = new ui.Panel('Project');
    panel.append(rightPanel);
    rightPanel.class.add('right');

    // close button
    var btnClose = new ui.Button({
        text: '&#57650;'
    });
    btnClose.class.add('close');
    btnClose.on('click', function () {
        overlay.hidden = true;
    });
    rightPanel.headerElement.appendChild(btnClose.element);

    // register new panel / menu option
    editor.method('picker:project:registerMenu', function (name, title, panel) {
        var menuItem = new ui.ListItem({text: name});
        menuItem.class.add(name);
        list.append(menuItem);

        menuItem.on('click', function () {
            select(name);
        });

        menuOptions[name] = {
            item: menuItem,
            title: title,
            panel: panel
        };
        panel.hidden = true;
        rightPanel.append(panel);
        return menuItem;
    });

    // register panel without a menu option
    editor.method('picker:project:registerPanel', function (name, title, panel) {
        // just do the regular registration but hide the menu
        var item = editor.call('picker:project:registerMenu', name, title, panel);
        item.class.add('hidden');
        return item;
    });

    // set default menu option
    editor.method('picker:project:setDefaultMenu', function (name) {
        defaultMenuOption = name;
    });

    // open popup
    editor.method('picker:project', function (option) {
        overlay.hidden = false;
        select(option || defaultMenuOption);
    });

    // close popup
    editor.method('picker:project:close', function () {
        overlay.hidden = true;
    });

    // ESC key should close popup
    var onKeyDown = function (e) {
        if (e.target && /(input)|(textarea)/i.test(e.target.tagName))
            return;

        if (e.keyCode === 27 && overlay.clickable) {
            overlay.hidden = true;
        }
    };

    // handle show
    overlay.on('show', function () {
        window.addEventListener('keydown', onKeyDown);

        projectImg.classList.remove('progress');
        projectImg.style.backgroundImage = 'url("' + (config.project.thumbnails.m || blankImage) + '")';

        if (editor.call('permissions:write')) {
            projectImg.classList.add('hover');
        } else {
            projectImg.classList.remove('hover');
        }
    });

    // handle hide
    overlay.on('hide', function () {
        currentSelection = null;

        // unsubscribe from keydown
        window.removeEventListener('keydown', onKeyDown);

        // hide all panels
        for (var key in menuOptions) {
            menuOptions[key].panel.hidden = true;
            menuOptions[key].item.class.remove('active');
            menuOptions[key].item.class.remove('selected');
        }
    });

    // prevent user closing popup
    editor.method('picker:project:setClosable', function (closable) {
        btnClose.hidden = !closable;
        overlay.clickable = closable;
    });

    // activate menu option
    var select = function (name) {
        if (! name) return;

        if (currentSelection === name)
            return;

        currentSelection = name;

        // if this is not a scene URL disallow closing the popup
        if (!config.scene.id) {
            editor.call('picker:project:setClosable', false);
        } else {
            // reset closable state
            editor.call('picker:project:setClosable', true);
        }

        // hide all first
        for (var key in menuOptions) {
            menuOptions[key].item.class.remove('active');
            menuOptions[key].panel.hidden = true;
        }

        // show desired option
        menuOptions[name].item.class.add('active');
        menuOptions[name].panel.hidden = false;
        rightPanel.headerElementTitle.textContent = menuOptions[name].title;
        rightPanel.innerElement.scrollTop = 0;
    };

    // subscribe to project image
    editor.on('messenger:project.image', function (data) {
        config.project.thumbnails = data.project.thumbnails;
        projectImg.style.backgroundImage = 'url("' + data.project.thumbnails.m + '")';
        projectImg.classList.remove('progress');
    });


});
