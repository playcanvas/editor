editor.once('load', function () {
    'use strict';

    document.getElementById('editor').style.display = 'block';

    var saveBtn = document.getElementById('btn-save');
    saveBtn.addEventListener('click', function () {
        editor.call('editor:save');
    });

    var revertBtn = document.getElementById('btn-revert');
    revertBtn.addEventListener('click', function () {
        editor.call('editor:revert');
    });

    var progress = document.getElementById('progress');
    var connecting = document.getElementById('connection-progress');
    var readonly = document.getElementById('readonly');
    var error = document.getElementById('error');
    var errorMsg = null;

    var refreshSaveButton = function () {
        if (editor.call('editor:isDirty')) {
            if (!/^\* /.test(document.title)) {
                document.title = '* ' + document.title;
            }
        } else {
            if (/^\* /.test(document.title)) {
                document.title = document.title.substring(2);
            }
        }

        if (!editor.call('editor:canSave')) {
            saveBtn.setAttribute('disabled', '');
            revertBtn.setAttribute('disabled', '');
        } else {
            saveBtn.removeAttribute('disabled');
            revertBtn.removeAttribute('disabled');
        }
    };

    var shouldShowProgress = function () {
        return editor.call('editor:isConnected') &&
                (editor.call('editor:isSaving') ||  editor.call('editor:isLoading'));
    };

    var shouldShowConnectionProgress = function () {
        return config.asset && !editor.call('editor:isConnected');
    };

    var refreshButtons = function () {
        var isReadonly = editor.call('editor:isReadonly');

        var hide = 'none';
        var show = 'inline-block';

        progress.style.display = shouldShowProgress() ? show : hide;
        connecting.style.display = shouldShowConnectionProgress() ? show : hide;
        readonly.style.display = isReadonly ? show : hide;
        saveBtn.style.display = isReadonly ? hide : show;
        revertBtn.style.display = isReadonly || !config.asset ? hide : show;
        error.style.display = errorMsg ? show : hide;

        refreshSaveButton();
    };

    refreshButtons();

    var showError = function (error) {
        log.error('There was an error: ' + error);
    };

    editor.on('editor:save:start', function () {
        errorMsg = null;
        refreshButtons();
    });

    editor.on('editor:save:end', refreshButtons);
    editor.on('editor:save:cancel', refreshButtons);
    editor.on('editor:dirty', refreshButtons);

    editor.on('editor:save:error', function (err) {
        errorMsg = err;
        error.innerHTML = 'Error while saving: ' + err;
        refreshButtons();
    });

    editor.on('editor:loadScript', function () {
        errorMsg = null;
        refreshButtons();
    });

    editor.on('editor:reloadScript', function () {
        errorMsg = null;
        refreshButtons();
    });

    editor.on('editor:loadScript:error', function (err) {
        errorMsg = err;
        error.innerHTML = 'Error while loading: ' + err;
        refreshButtons();
    });

    editor.on('tern:error', function (err) {
        errorMsg = err;
        error.innerHTML = 'Error while loading autocomplete: ' + err;
        refreshButtons();
    });

    var knownErrors = [
        /Invalid version from server/,
        /Op apply failed/,
        /opAcknowledged called from a null state/
    ];

    editor.on('realtime:error', function (err) {
        for (var i = 0; i < knownErrors.length; i++) {
            if (knownErrors[i].test(err)) {
                err = 'Could not reconnect successfully, please refresh the page.';
            }
        }

        errorMsg = err;
        error.innerHTML = 'Error: ' + err;
        refreshButtons();
    });

    editor.on('realtime:connecting', refreshButtons);

    var reconnectTimeout;

    editor.on('realtime:connected', function () {
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }

        if (disconnectedTimeout) {
            showDisconnectionErrors = false;
            clearTimeout(disconnectedTimeout);
            disconnectedTimeout = null;
        }
    });

    var disconnectedTimeout;
    var showDisconnectionErrors = false;

    var disconnectedDelay = 5; // seconds before we show disconnected messages

    var deferDisconnected = function () {
        refreshButtons();

        if (disconnectedTimeout)
            return;

        disconnectedTimeout = setTimeout(function () {
            showDisconnectionErrors = true;
        }, disconnectedDelay * 1000);
    };

    editor.on('realtime:nextAttempt', function (time) {
        var before = new Date();

        deferDisconnected();

        function setText(remaining) {
            if (!showDisconnectionErrors)
                return;

            errorMsg = 'Disconnected. Reconnecting in ' + time + ' seconds...';
            error.innerHTML = errorMsg;
            refreshButtons();
        }

        function renderTime() {
            var now = new Date();
            var elapsed = now.getTime() - before.getTime();
            before = now;
            time -= Math.round(elapsed / 1000);
            if (time < 0) {
                time = 0;
            } else {
                reconnectTimeout = setTimeout(renderTime, 1000);
            }

            setText(time);
        }

        setText(time);

        reconnectTimeout = setTimeout(renderTime, 1000);
    });

    editor.on('editor:afterChange', refreshSaveButton);

    editor.on('permissions:set:' + config.self.id, function (level) {
        refreshButtons();
    });

    // online users
    var users = document.getElementById('users');

    var createUser = function (id) {
        var a = document.createElement('a');
        a.href = '/' + id;
        a.id = 'user-' + id;
        a.target = '_blank';
        var img = document.createElement('img');
        img.src = '/api/users/' + id + '/thumbnail?size=32';
        a.appendChild(img);
        users.appendChild(a);
    };

    var deleteUser = function (id) {
        var a = document.getElementById('user-' + id);
        if (a) {
            a.parentNode.removeChild(a);
        }
    };

    editor.on('whoisonline:set', function (data) {
        users.innerHTML = '';

        // add users
        for (var id in data)
            createUser(id);
    });

    editor.on('whoisonline:add', createUser);
    editor.on('whoisonline:remove', deleteUser);
});
