// like toolbar-connection.js

editor.once('load', function() {
    'use strict';

    var overlay = new ui.Overlay();
    overlay.class.add('checkpoint-overlay');
    overlay.center = false;
    overlay.transparent = false;
    overlay.clickable = false;
    overlay.hidden = true;

    var root = editor.call('layout.root');
    root.append(overlay);

    var alignHelper = document.createElement('div');
    alignHelper.classList.add('vert-align-helper');
    overlay.innerElement.appendChild(alignHelper);

    var iconClasses = ['in-progress', 'success', 'error'];

    var icon = document.createElement('div');
    icon.classList.add('checkpoint-icon');
    icon.classList.add('in-progress');
    overlay.innerElement.appendChild(icon);

    var content = document.createElement('div');
    content.classList.add('checkpoint-content');
    overlay.innerElement.appendChild(content);

    var btnDiv = document.createElement('div');
    btnDiv.classList.add('checkpoint-error-btn-div');
    overlay.innerElement.appendChild(btnDiv);

    var btnOK = new ui.Button({ text: 'OK' });

    btnOK.class.add('btn-ok');
    btnOK.hidden = true;
    btnOK.on('click', hideOverlay);

    btnDiv.appendChild(btnOK.element);

    editor.on('messenger:checkpoint.createStarted', function(data) {
        hideAndReset();

        setIconClass('in-progress');

        var msg = data.user_full_name + ' is creating a new checkpoint';

        showOverlayWithMessage(msg);
    });

    editor.on('messenger:checkpoint.createEnded', function(data) {
        hideAndReset();

        if (data.status === 'success') {
            handleCreateSuccess(data);
        } else {
            handleCreateError(data);
        }
    });

    editor.on('messenger:checkpoint.revertStarted', function(data) {
        hideAndReset();

        setIconClass('in-progress');

        var msg = data.user_full_name + ' is restoring a checkpoint';

        showOverlayWithMessage(msg);
    });

    editor.on('messenger:checkpoint.revertEnded', function(data) {
        hideAndReset();

        if (data.status === 'success') {
            handleRevertSuccess(data);
        } else {
            handleRevertError(data);
        }
    });

    function handleCreateSuccess(data) {
        setIconClass('success');

        showOverlayWithMessage(data.message);

        setTimeout(hideAndReset, 1000);
    }

    function handleCreateError(data) {
        setIconClass('error');

        var msg = 'There was an error while creating a new checkpoint:' +
            '<br>' + data.message;

        showOverlayWithMessage(msg);

        btnOK.hidden = false;
    }

    function handleRevertSuccess(data) {
        setIconClass('success');

        showOverlayWithMessage('Restore successful. Reloading browser window');

        setTimeout(function() {
            reloadOrRedirect(data);
        }, 1000);
    }

    function reloadOrRedirect(data) {
        if (currentSceneRemoved(data.removedScenes)) {
            window.location = '/editor/project/' + config.project.id + window.location.search;
        } else {
            window.location.reload(true);
        }
    }

    function currentSceneRemoved(removedScenes) {
        return removedScenes.indexOf(config.scene.id) !== -1;
    }

    function handleRevertError(data) {
        setIconClass('error');

        var msg = 'There was an error while restoring a checkpoint:' +
            '<br>' + data.message;

        showOverlayWithMessage(msg);

        btnOK.hidden = false;
    }

    function setIconClass(klass) {
        iconClasses.forEach(function(klass) {
            icon.classList.remove(klass);
        });

        icon.classList.add(klass);
    }

    function showOverlayWithMessage(msg) {
        content.innerHTML = msg;
        overlay.hidden = false;
    }

    function hideAndReset() {
        hideOverlay();

        btnOK.hidden = true;

        editor.call('picker:project:close');
    }

    function hideOverlay() {
        overlay.hidden = true;
    }
});