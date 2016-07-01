editor.once('load', function() {
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
    editor.on('permissions:set', function(level) {
        panel.hidden = ! level || editor.call('viewport:expand:state');
    });
    viewport.append(panel);
    editor.method('chat:panel', function() {
        return panel;
    });

    editor.on('viewport:expand', function(state) {
        if (state) {
            panel.class.add('expanded');
        } else {
            panel.class.remove('expanded');
        }
    });

    panel.element.addEventListener('mouseover', function() {
        editor.emit('viewport:hover', false);
    }, false);

    // typers
    var typers = document.createElement('span');
    typers.classList.add('typers');
    panel.headerAppend(typers);

    editor.on('chat:typing', function(count, ids, msg) {
        typers.textContent = msg;
    });

    // number
    var messagesNumber = 0;
    var number = document.createElement('span');
    number.classList.add('number');
    number.textContent = '0';
    panel.headerAppend(number);

    editor.on('chat:post', function(type, msg, element) {
        if (! panel.folded)
            lastMessage = element;

        if (! panel.folded || type === 'typing')
            return;

        messagesNumber++;
        number.classList.add('notify');

        if (! number.classList.contains('typing'))
            number.textContent = messagesNumber;
    });
    editor.on('chat:typing', function(typing) {
        if (! panel.folded)
            return;

        if (typing) {
            number.textContent = '...';
            number.classList.add('typing');
        } else {
            number.textContent = messagesNumber;
            number.classList.remove('typing');
        }
    });
    panel.on('unfold', function() {
        messagesNumber = 0;
        number.textContent = '0';
        number.classList.remove('typing', 'notify');

        if (messageDivider.parentNode)
            messageDivider.parentNode.removeChild(messageDivider);

        if (lastMessage && lastMessage !== messages.innerElement.lastChild) {
            messages.innerElement.scrollTop = lastMessage.offsetTop;
            messages.appendAfter(messageDivider, lastMessage);

            lastMessage = messages.innerElement.lastChild;
        }

        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                input.elementInput.select();
                input.elementInput.focus();
            });
        });
    });

    // messages
    var messages = new ui.Panel();
    messages.class.add('messages');
    messages.scroll = true;
    panel.append(messages);

    editor.method('chat:messagesPanel', function() {
        return messages;
    });

    var messageDivider = document.createElement('div');
    messageDivider.classList.add('divider');

    // input
    var typing = false;
    var typingTimeout = null;
    var typingTimeoutDelay = 1000;
    var input = new ui.TextField();
    input.keyChange = true;
    input.renderChanges = false;
    input.placeholder = '>';
    panel.append(input);

    var clear = document.createElement('div');
    clear.innerHTML = '&#57650;';
    clear.classList.add('clear');
    input.element.appendChild(clear);

    clear.addEventListener('click', function() {
        input.value = '';
        onTypingEnd();
    }, false);

    var onTypingEnd = function() {
        if (typingTimeout) {
            clearTimeout(typingTimeout);
            typingTimeout = null;
        }

        if (! typing)
            return;

        typing = false;
        editor.call('chat:typing', false);
    };

    input.on('change', function(value) {
        value = value.trim();

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

    input.element.addEventListener('keydown', function(evt) {
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
