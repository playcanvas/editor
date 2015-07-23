editor.once('load', function () {
    'use strict';

    document.getElementById('editor').style.display = 'block';

    var saveBtn = document.getElementById('btn-save');
    saveBtn.addEventListener('click', function () {
        editor.call('editor:save');
    });

    var progress = document.getElementById('progress');
    var readonly = document.getElementById('readonly');
    var error = document.getElementById('error');
    var errorMsg = null;

    var refreshSaveButton = function () {
        if (! editor.call('editor:canSave')) {
            saveBtn.setAttribute('disabled', '');
        } else {
            saveBtn.removeAttribute('disabled');
        }
    };

    var refreshButtons = function () {
        refreshSaveButton();
        progress.style.display = editor.call('editor:isSaving') ? 'block' : 'none';
        readonly.style.display = editor.call('editor:isReadonly') ? 'inline-block' : 'none';
        error.style.display = errorMsg ? 'inline-block' : 'none';
    };

    refreshButtons();

    var showError = function (error) {
        console.error('There was an error: ' + error);
    };

    editor.on('editor:save:start', function () {
        errorMsg = null;
        refreshButtons();
    });

    editor.on('editor:save:success', function () {
        refreshButtons();
    });

    editor.on('editor:save:error', function (err) {
        errorMsg = err;
        error.innerHTML = 'Error while saving: ' + err;
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

    editor.on('realtime:error', function (err) {
        errorMsg = err;
        error.innerHTML = 'Error: "' + err + '"';
        refreshButtons();
    });

    editor.on('editor:change', refreshSaveButton);

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
        img.src = '/api/' + id + '/thumbnail?size=25';
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
        for (var id in data) {
            createUser(id);
        }
    });

    editor.on('whoisonline:add', createUser);;
    editor.on('whoisonline:remove', deleteUser);
});