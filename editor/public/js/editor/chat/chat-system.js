editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var widget = editor.call('chat:panel');
    var messages = editor.call('chat:messagesPanel');
    var lastUser = null;
    var lastMessage = 0;
    var lastMessageDelay = 60 * 1000;


    editor.on('whoisonline:remove', function(id) {
        if (lastUser === id) {
            lastUser = null;
            lastMessage = 0;
        }
    });

    editor.method('chat:post', function(type, message) {
        var element = document.createElement('div');

        var text = element.text = document.createElement('span');
        element.appendChild(text);

        if (type === 'system') {
            lastUser = null;
            lastMessage = 0;
            var date = new Date();
            text.textContent = ('00' + date.getHours()).slice(-2) + ':' + ('00' + date.getMinutes()).slice(-2) + ' - ' + message;
            element.classList.add('system');
        } else if (typeof(type) === 'number') {
            text.textContent = message;
            element.classList.add('message');

            // if same user posts within 60 seconds,
            // don't add image and username
            if (lastUser !== type || (Date.now() - lastMessage) > lastMessageDelay) {
                var img = document.createElement('img');
                img.width = 14;
                img.height = 14;
                img.src = '/api/' + type + '/thumbnail?size=14';
                element.insertBefore(img, text);

                var date = new Date();

                element.tooltip = Tooltip.attach({
                    target: img,
                    text: ('00' + date.getHours()).slice(-2) + ':' + ('00' + date.getMinutes()).slice(-2),
                    align: 'right',
                    root: root
                });

                var user = editor.call('users:get', type);

                var username = document.createElement('span');
                username.classList.add('username');
                username.textContent = user ? user.username : '';
                if (type !== config.self.id)
                    username.style.color = editor.call('whoisonline:color', user.id, 'hex');
                element.insertBefore(username, text);
            } else {
                element.classList.add('multi');
            }

            lastUser = type;
            lastMessage = Date.now();
        } else {
            lastUser = null;
            lastMessage = 0;
            return;
        }

        var scrollDown = ! widget.folded && Math.abs((messages.innerElement.scrollHeight - messages.innerElement.clientHeight) - messages.innerElement.scrollTop) < 4;

        messages.append(element);

        if (scrollDown)
            messages.innerElement.scrollTop = messages.innerElement.scrollHeight - messages.innerElement.clientHeight;

        editor.emit('chat:post', type, message, element);

        return element;
    });

    editor.method('chat:sync:msg', function(data) {
        editor.call('chat:post', data.user, data.d);
    });

    editor.method('chat:send', function(message) {
        message = message.trim();
        if (! message)
            return;

        editor.call('realtime:send', 'chat', {
            t: 'msg',
            d: message
        });
    });
});
