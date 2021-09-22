editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var viewport = editor.call('layout.viewport');
    var lastMessage = null;

    var panel = new ui.Panel();
    panel.header = 'Chat';
    panel.flexShrink = false;
    panel.foldable = true;
    panel.folded = true;
    panel.class.add('chat-widget');
    panel.hidden = ! editor.call('permissions:read') || editor.call('viewport:expand:state');
    editor.on('permissions:set', function (level) {
        panel.hidden = ! level || editor.call('viewport:expand:state');
    });
    viewport.append(panel);

    const assetPanel = editor.call('layout.assets');

    const adjustPosition = () => {
        panel.style.bottom = assetPanel.collapsed ? '36px' : '4px';
    };

    adjustPosition();
    assetPanel.on('collapse', adjustPosition);
    assetPanel.on('expand', adjustPosition);

    editor.method('chat:panel', function () {
        return panel;
    });

    editor.on('viewport:expand', function (state) {
        if (state) {
            panel.class.add('expanded');
        } else {
            panel.class.remove('expanded');
        }
    });


    panel.element.addEventListener('mouseover', function () {
        editor.emit('viewport:hover', false);
    }, false);

    // notification icon
    var notify = new ui.Button({
        text: '&#57751;'
    });
    notify.class.add('notifyToggle');
    panel.headerAppend(notify);

    var tooltipNotify = Tooltip.attach({
        target: notify.element,
        text: 'Notifications (enabled)',
        align: 'bottom',
        root: root
    });

    notify.on('click', function () {
        var permission = editor.call('notify:state');

        if (permission === 'granted') {
            var granted = editor.call('localStorage:get', 'editor:notifications:chat');
            editor.call('localStorage:set', 'editor:notifications:chat', ! granted);
            editor.emit('chat:notify', ! granted);
        } else if (permission !== 'denied') {
            editor.call('notify:permission');
        }
    });
    var checkNotificationsState = function () {
        var permission = editor.call('notify:state');

        if (permission === 'denied') {
            tooltipNotify.text = 'Notifications Denied in Browser Settings';
            notify.class.remove('active');
        } else if (permission === 'granted') {
            var granted = editor.call('localStorage:get', 'editor:notifications:chat');
            if (granted === false) {
                tooltipNotify.text = 'Notifications Disabled';
                notify.class.remove('active');
            } else {
                tooltipNotify.text = 'Notifications Enabled';
                notify.class.add('active');
            }
        } else {
            tooltipNotify.text = 'Enable Notifications';
            notify.class.remove('active');
        }
    };
    editor.on('notify:permission', checkNotificationsState);
    editor.on('chat:notify', checkNotificationsState);
    checkNotificationsState();

    // typers
    var typersLast = null;
    var typers = document.createElement('span');
    typers.classList.add('typers');
    panel.headerAppend(typers);

    // typers single
    var typersSingle = document.createElement('span');
    typersSingle.classList.add('single');
    typers.appendChild(typersSingle);

    var typersSingleUser = document.createElement('span');
    typersSingleUser.classList.add('user');
    typersSingle.appendChild(typersSingleUser);

    typersSingle.appendChild(document.createTextNode(' is typing...'));

    // typers double
    var typersDouble = document.createElement('span');
    typersDouble.classList.add('double');
    typers.appendChild(typersDouble);

    var typersDoubleUserA = document.createElement('span');
    typersDoubleUserA.classList.add('user');
    typersDouble.appendChild(typersDoubleUserA);

    typersDouble.appendChild(document.createTextNode(' and '));

    var typersDoubleUserB = document.createElement('span');
    typersDoubleUserB.classList.add('user');
    typersDouble.appendChild(typersDoubleUserB);

    typersDouble.appendChild(document.createTextNode(' are typing...'));

    // typers multiple
    var typersMultiple = document.createElement('span');
    typersMultiple.classList.add('multiple');
    typers.appendChild(typersMultiple);

    var typersMultipleUsers = document.createElement('span');
    typersMultipleUsers.classList.add('user');
    typersMultiple.appendChild(typersMultipleUsers);

    typersMultiple.appendChild(document.createTextNode(' users are typing...'));


    editor.on('chat:typing', function (count, ids) {
        var color;
        if (count === 0) {
            if (typersLast) typersLast.classList.remove('active');
            typersLast = null;
        } else if (count === 1) {
            if (typersLast) typersLast.classList.remove('active');
            typersLast = typersSingle;
            typersSingle.classList.add('active');
            // user
            var user = editor.call('users:get', ids[0]);
            color = editor.call('users:color', user && user.id, 'hex');
            typersSingleUser.textContent = user && user.username || 'user';
            typersSingleUser.style.color = color;
        } else if (count === 2) {
            if (typersLast) typersLast.classList.remove('active');
            typersLast = typersDouble;
            typersDouble.classList.add('active');
            // userA
            var userA = editor.call('users:get', ids[0]);
            color = editor.call('users:color', userA && userA.id, 'hex');
            typersDoubleUserA.textContent = userA && userA.username || 'user';
            typersDoubleUserA.style.color = color;
            // userB
            var userB = editor.call('users:get', ids[1]);
            color = editor.call('users:color', userB && userB.id, 'hex');
            typersDoubleUserB.textContent = userB && userB.username || 'userB';
            typersDoubleUserB.style.color = color;
        } else {
            if (typersLast) typersLast.classList.remove('active');
            typersLast = typersMultiple;
            typersMultiple.classList.add('active');
            typersMultipleUsers.textContent = count;
        }
    });

    // number
    var messagesNumber = 0;
    var number = document.createElement('span');
    number.classList.add('number');
    number.textContent = '0';
    panel.headerAppend(number);

    editor.method('chat:unreadCount', function () {
        return messagesNumber;
    });

    editor.on('chat:post', function (type, msg, element) {
        if (! panel.folded)
            lastMessage = element;

        if (! panel.folded || type === 'typing')
            return;

        messagesNumber++;
        panel.class.add('notify');
        number.classList.add('notify');

        if (! number.classList.contains('typing'))
            number.textContent = messagesNumber;
    });

    editor.on('chat:typing', function (typing, ids) {
        if (! panel.folded)
            return;

        if (typing) {
            number.textContent = '...';
            number.classList.add('typing');

            if (typing === 1) {
                var color = editor.call('users:color', ids[0], 'hex');
                number.style.color = color;
            } else {
                number.style.color = '';
            }
        } else {
            number.textContent = messagesNumber;
            number.classList.remove('typing');
            number.style.color = '';
        }
    });

    // messages
    var messages = new ui.Panel();
    messages.class.add('messages');
    messages.innerElement.classList.add('selectable');
    messages.scroll = true;
    panel.append(messages);

    messages.innerElement.addEventListener('contextmenu', function (evt) {
        if (evt.target.tagName !== 'A')
            return;

        evt.stopPropagation();
    });

    var messageDivider = document.createElement('div');
    messageDivider.classList.add('divider');

    // input
    var typing = false;
    var typingTimeout = null;
    var typingTimeoutDelay = 1000;
    var input = new ui.TextField();
    input.blurOnEnter = false;
    input.keyChange = true;
    input.renderChanges = false;
    input.placeholder = '>';
    panel.append(input);

    panel.on('unfold', function () {
        messagesNumber = 0;
        number.textContent = '0';
        number.classList.remove('typing', 'notify');
        panel.class.remove('notify');

        if (messageDivider.parentNode)
            messageDivider.parentNode.removeChild(messageDivider);

        if (lastMessage && lastMessage !== messages.innerElement.lastChild) {
            messages.innerElement.scrollTop = lastMessage.offsetTop;
            messages.appendAfter(messageDivider, lastMessage);

            lastMessage = messages.innerElement.lastChild;
        }

        setTimeout(function () {
            input.elementInput.select();
            input.elementInput.focus();
        }, 200);
    });

    editor.method('chat:messagesPanel', function () {
        return messages;
    });

    editor.method('chat:inputField', function () {
        return input;
    });

    var clear = document.createElement('div');
    clear.innerHTML = '&#57650;';
    clear.classList.add('clear');
    input.element.appendChild(clear);

    var onTypingEnd = function () {
        if (typingTimeout) {
            clearTimeout(typingTimeout);
            typingTimeout = null;
        }

        if (! typing)
            return;

        typing = false;
        editor.call('chat:typing', false);
    };

    clear.addEventListener('click', function () {
        input.value = '';
        onTypingEnd();
    }, false);

    input.on('change', function (value) {
        value = value.trim();

        if (value.length > 1024) {
            input.value = value.slice(0, 1024);
            return;
        }

        if (typingTimeout)
            clearTimeout(typingTimeout);

        typingTimeout = setTimeout(onTypingEnd, typingTimeoutDelay);

        if (value) {
            input.class.add('not-empty');

            if (! typing) {
                typing = true;
                editor.call('chat:typing', true);
            }
        } else {
            input.class.remove('not-empty');
            onTypingEnd();
        }
    });

    input.element.addEventListener('keydown', function (evt) {
        if (evt.keyCode === 27) {
            // esc
            input.value = '';
            onTypingEnd();
        } else if (evt.keyCode === 13) {
            // enter
            editor.call('chat:send', input.value);
            input.value = '';
            onTypingEnd();
        }
    }, false);
});
