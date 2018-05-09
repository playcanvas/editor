editor.once('load', function () {
    'use strict';

    var loadMoreBtn, oldestCheckpointId;

    var listenersToUnbind = [];

    if (shouldHideCheckpoints()) {
        return;
    }

    var checkpointsPanel = makePanel('picker-checkpoint-panel');

    editor.call('picker:project:registerMenu',
            'checkpoints', 'Checkpoints', checkpointsPanel);

    addNewCheckpointBtn(checkpointsPanel);

    var checkpointList = addScrollableList(checkpointsPanel.innerElement);

    checkpointsPanel.on('show', function () {
        loadMoreBtn = addMoreBtn(checkpointList);

        editor.call('checkpoint:get_latest', handleCheckpointApiData);

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    checkpointsPanel.on('hide', function() {
        unbindListeners();

        checkpointList.element.innerHTML = '';

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    editor.on('viewport:hover', function(state) {
        if (state && ! checkpointsPanel.hidden) {
            setTimeout(function() {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    function shouldHideCheckpoints() {
        return !editor.call('users:hasFlag', 'hasCheckpoints') ||
            editor.call('settings:project').get('useLegacyScripts');
    }

    function addNewCheckpointBtn(dst) {
        var btn = makeButton('New Checkpoint', 'btnCheckpointNew');

        dst.append(btn);

        handlePermissions(btn);

        btn.on('click', function () {
            editor.call('picker:checkpoint:new');
        });
    }

    function addScrollableList(dst) {
        var scrollableDiv = makeAndAddDiv('checkpoint-list-div', dst);

        var list = new ui.List();

        list.class.add('checkpoint-list');

        scrollableDiv.appendChild(list.element);

        return list;
    }

    function addMoreBtn(dst) {
        var btn = makeButton('Load more', 'btnCheckpointMore');

        btn.hidden = true;

        dst.append(btn);

        var listener = btn.on('click', addCheckpointsBeforeOldest);

        listenersToUnbind.push(listener);

        return btn;
    }

    function handleCheckpointApiData(data) {
        data.checkpoints.forEach(createCheckpointEntry);

        setVisibilityOfMoreBtn(data);
    }

    function createCheckpointEntry(h) {
        var row = addRowForId(h.checkpoint_id);

        var info = makeAndAddDiv('checkpoint-item-info', row.element);

        h.checkpoint_prefix = checkpointPrefix(h.checkpoint_id);

        addFirstInfoLine(h, info);

        addSecondInfoLine(h, info);

        addRevertCheckpointButton(h, row);
    }

    function addRowForId(checkpoint_id) {
        oldestCheckpointId = checkpoint_id;

        var row = new ui.ListItem();

        row.element.id = checkpoint_id;

        checkpointList.element.insertBefore(row.element, loadMoreBtn.element);

        return row;
    }

    function addFirstInfoLine(h, dst) {
        var text = h.checkpoint_prefix + ': ' + h.description;

        addDivWithTextNode(text, 'ch-info-first-line', dst);
    }

    function addSecondInfoLine(h, dst) {
        var text = '';

        if (h.user_full_name) {
            text += ' by ' + h.user_full_name + ', ';
        }

        text += createdAtToDateStr(h.created_at);

        addDivWithTextNode(text, 'ch-info-second-line', dst);
    }

    function addRevertCheckpointButton(h, dst) {
        var btn = makeButton('Restore', 'btnCheckpointRevert');

        dst.element.appendChild(btn.element);

        listenersToUnbind.push(handlePermissions(btn));

        addRevertClickHandler(btn, h);
    }

    function addRevertClickHandler(btn, h) {
        var data = {
            user_id: config.self.id,
            project_id: config.project.id,
            checkpoint_id: h.checkpoint_id,
            checkpoint_prefix: h.checkpoint_prefix
        };

        var listener = btn.on('click', function () {
            confirmAndRevert(data);
        });

        listenersToUnbind.push(listener);
    }

    function confirmAndRevert(data) {
        editor.call('picker:checkpointRestoreConfirm', data, function() {

            editor.call('checkpoint:revert', data);
        });
    }

    function addCheckpointsBeforeOldest() {
        editor.call( 'checkpoint:get_before_checkpoint',
            oldestCheckpointId,
            handleCheckpointApiData );
    }

    function setVisibilityOfMoreBtn(data) {
        loadMoreBtn.hidden = !oldestCheckpointId || data.nothing_before;
    }

    function hasWritePermissions() {
        return editor.call('permissions:write');
    }

    function handlePermissions(item) {
        item.disabled = !hasWritePermissions();

        var event = 'permissions:set:' + config.self.id;

        return editor.on(event, function (accessLevel) {

            var canWrite = accessLevel === 'write' || accessLevel === 'admin';

            item.disabled = !canWrite;
        });
    }

    function createdAtToDateStr(created_at) {
        var date = new Date(0);

        date.setUTCMilliseconds(created_at);

        var opts = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        };

        return date.toLocaleString('en-US', opts);
    }

    function unbindListeners() {
        listenersToUnbind.forEach(function (listener) {
            listener.unbind();
        });

        listenersToUnbind = [];
    }

    function makeButton(text, klass) {
        var btn = new ui.Button({ text: text });

        btn.class.add(klass);

        return btn;
    }

    function makeAndAddDiv(klass, dstElt) {
        var div = document.createElement('div');

        div.classList.add(klass);

        dstElt.appendChild(div);

        return div;
    }

    function addDivWithTextNode(text, klass, dstElt) { // escapes html
        var div = makeAndAddDiv(klass, dstElt);

        var node = document.createTextNode(text);

        div.appendChild(node);
    }

    function makePanel(klass) {
        var panel = new ui.Panel();

        panel.class.add(klass);

        return panel;
    }

    function checkpointPrefix(checkpoint_id) {
        return checkpoint_id.substr(0, 7);
    }
});
