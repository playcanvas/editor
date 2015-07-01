editor.once('load', function () {
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

    editor.on('editor:change', refreshSaveButton);

    editor.on('permissions:set:' + config.self.id, function (level) {
        refreshButtons();
    });
});