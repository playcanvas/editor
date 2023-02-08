import { Panel, Button, Container, TextInput } from '@playcanvas/pcui';

editor.once('load', function () {
    const root = editor.call('layout.root');
    const viewport = editor.call('layout.viewport');

    const chatPanel = new Panel({
        class: 'chat-widget',
        collapsed: true,
        collapsible: true,
        headerText: 'CHAT',
        hidden: !editor.call('permissions:read') || editor.call('viewport:expand:state')
    });
    viewport.append(chatPanel);

    // HACK: The chat panel is created in a collapsed state. The transition CSS rule is
    // disabled here to prevent the initial collapse animation from playing. Restore the
    // transition animation 100ms from now. This should be considered a PCUI bug.
    chatPanel.style.transition = 'none';
    setTimeout(() => {
        chatPanel.style.transition = 'height 100ms, width 100ms';
    }, 100);

    editor.on('permissions:set', function (level) {
        chatPanel.hidden = !level || editor.call('viewport:expand:state');
    });

    const assetPanel = editor.call('layout.assets');

    const adjustPosition = () => {
        chatPanel.style.bottom = assetPanel.collapsed ? '36px' : '4px';
    };

    adjustPosition();
    assetPanel.on('collapse', adjustPosition);
    assetPanel.on('expand', adjustPosition);

    editor.method('chat:panel', function () {
        return chatPanel;
    });

    editor.on('viewport:expand', function (state) {
        chatPanel.hidden = state;
    });

    chatPanel.element.addEventListener('mouseover', function () {
        editor.emit('viewport:hover', false);
    }, false);

    // notification icon
    const notify = new Button({
        class: 'notifications',
        icon: 'E197'
    });
    chatPanel.header.append(notify);

    const tooltipNotify = Tooltip.attach({
        target: notify.element,
        text: 'Notifications (enabled)',
        align: 'bottom',
        root: root
    });

    notify.on('click', function () {
        const permission = editor.call('notify:state');

        if (permission === 'granted') {
            const granted = editor.call('localStorage:get', 'editor:notifications:chat');
            editor.call('localStorage:set', 'editor:notifications:chat', !granted);
            editor.emit('chat:notify', !granted);
        } else if (permission !== 'denied') {
            editor.call('notify:permission');
        }
    });

    const checkNotificationsState = function () {
        const permission = editor.call('notify:state');

        if (permission === 'denied') {
            tooltipNotify.text = 'Notifications Denied in Browser Settings';
            notify.class.remove('active');
        } else if (permission === 'granted') {
            const granted = editor.call('localStorage:get', 'editor:notifications:chat');
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
    let typersLast = null;
    const typers = document.createElement('span');
    typers.classList.add('typers');
    chatPanel.header.append(typers);

    // typers single
    const typersSingle = document.createElement('span');
    typersSingle.classList.add('single');
    typers.appendChild(typersSingle);

    const typersSingleUser = document.createElement('span');
    typersSingleUser.classList.add('user');
    typersSingle.appendChild(typersSingleUser);

    typersSingle.appendChild(document.createTextNode(' is typing...'));

    // typers double
    const typersDouble = document.createElement('span');
    typersDouble.classList.add('double');
    typers.appendChild(typersDouble);

    const typersDoubleUserA = document.createElement('span');
    typersDoubleUserA.classList.add('user');
    typersDouble.appendChild(typersDoubleUserA);

    typersDouble.appendChild(document.createTextNode(' and '));

    const typersDoubleUserB = document.createElement('span');
    typersDoubleUserB.classList.add('user');
    typersDouble.appendChild(typersDoubleUserB);

    typersDouble.appendChild(document.createTextNode(' are typing...'));

    // typers multiple
    const typersMultiple = document.createElement('span');
    typersMultiple.classList.add('multiple');
    typers.appendChild(typersMultiple);

    const typersMultipleUsers = document.createElement('span');
    typersMultipleUsers.classList.add('user');
    typersMultiple.appendChild(typersMultipleUsers);

    typersMultiple.appendChild(document.createTextNode(' users are typing...'));


    editor.on('chat:typing', function (count, ids) {
        let color;
        if (count === 0) {
            if (typersLast) typersLast.classList.remove('active');
            typersLast = null;
        } else if (count === 1) {
            if (typersLast) typersLast.classList.remove('active');
            typersLast = typersSingle;
            typersSingle.classList.add('active');
            // user
            const user = editor.call('users:get', ids[0]);
            color = editor.call('users:color', user && user.id, 'hex');
            typersSingleUser.textContent = user && user.username || 'user';
            typersSingleUser.style.color = color;
        } else if (count === 2) {
            if (typersLast) typersLast.classList.remove('active');
            typersLast = typersDouble;
            typersDouble.classList.add('active');
            // userA
            const userA = editor.call('users:get', ids[0]);
            color = editor.call('users:color', userA && userA.id, 'hex');
            typersDoubleUserA.textContent = userA && userA.username || 'user';
            typersDoubleUserA.style.color = color;
            // userB
            const userB = editor.call('users:get', ids[1]);
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
    let messagesNumber = 0;
    const number = document.createElement('span');
    number.classList.add('number');
    number.textContent = '0';
    chatPanel.header.append(number);

    editor.method('chat:unreadCount', function () {
        return messagesNumber;
    });

    let lastMessage = null;

    editor.on('chat:post', function (type, msg, element) {
        if (!chatPanel.collapsed)
            lastMessage = element;

        if (!chatPanel.collapsed || type === 'typing')
            return;

        messagesNumber++;
        chatPanel.class.add('notify');
        number.classList.add('notify');

        if (!number.classList.contains('typing'))
            number.textContent = messagesNumber;
    });

    editor.on('chat:typing', function (typing, ids) {
        if (!chatPanel.collapsed)
            return;

        if (typing) {
            number.textContent = '...';
            number.classList.add('typing');

            if (typing === 1) {
                const color = editor.call('users:color', ids[0], 'hex');
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
    const messages = new Container({
        class: 'messages',
        scrollable: true
    });
    chatPanel.append(messages);

    messages.innerElement.addEventListener('contextmenu', function (evt) {
        if (evt.target.tagName !== 'A')
            return;

        evt.stopPropagation();
    });

    const messageDivider = document.createElement('div');
    messageDivider.classList.add('divider');

    // input
    let typing = false;
    let typingTimeout = null;
    const typingTimeoutDelay = 1000;
    const input = new TextInput({
        blurOnEnter: false,
        keyChange: true,
        placeholder: '>'
    });
    chatPanel.append(input);

    chatPanel.on('expand', function () {
        messagesNumber = 0;
        number.textContent = '0';
        number.classList.remove('typing', 'notify');
        chatPanel.class.remove('notify');

        if (messageDivider.parentNode)
            messageDivider.parentNode.removeChild(messageDivider);

        if (lastMessage && lastMessage !== messages.innerElement.lastChild) {
            messages.innerElement.scrollTop = lastMessage.offsetTop;
            messages.appendAfter(messageDivider, lastMessage);

            lastMessage = messages.innerElement.lastChild;
        }

        setTimeout(() => {
            input.focus(true);
        }, 200);
    });

    editor.method('chat:messagesPanel', function () {
        return messages;
    });

    editor.method('chat:inputField', function () {
        return input;
    });

    const clear = document.createElement('div');
    clear.innerHTML = '&#57650;';
    clear.classList.add('clear');
    input.element.appendChild(clear);

    const onTypingEnd = function () {
        if (typingTimeout) {
            clearTimeout(typingTimeout);
            typingTimeout = null;
        }

        if (!typing)
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

            if (!typing) {
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
