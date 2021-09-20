editor.once('load', function () {
    'use strict';

    const root = editor.call('layout.root');
    const widget = editor.call('chat:panel');
    const messages = editor.call('chat:messagesPanel');
    const lastMessageDelay = 60 * 1000;

    let lastUser = null;
    let lastMessage = 0;

    const regexUrl = /[a-z]+:\/\/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:%_\+.~#?&\/=]*/g;
    const regexEmail = /[-a-zA-Z0-9:%._\+~]{1,256}@[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,16}/g;

    const stringToElements = function (args) {
        const items = [];

        const bits = args.string.match(args.regex);
        if (! bits) return [args.string];

        const parts = args.string.split(args.regex);

        for (let i = 0; i < parts.length; i++) {
            items.push(parts[i]);

            if (bits.length > i)
                items.push(args.filter(bits[i]));
        }

        return items;
    };

    const parseMessageFilterLink = function (string) {
        const link = document.createElement('a');
        link.target = '_blank';
        link.href = string;
        link.textContent = string;
        return link;
    };

    const parseMessageFilterEmail = function (string) {
        const link = document.createElement('a');
        link.href = 'mailto:' + string;
        link.textContent = string;
        return link;
    };

    const parseMessage = function (message) {
        const items = stringToElements({
            string: message,
            regex: regexUrl,
            filter: parseMessageFilterLink
        });

        for (let i = 0; i < items.length; i++) {
            if (typeof(items[i]) !== 'string')
                continue;

            const emails = stringToElements({
                string: items[i],
                regex: regexEmail,
                filter: parseMessageFilterEmail
            });

            for (let e = 0; e < emails.length; e++) {
                let item;

                if (typeof(emails[e]) === 'string') {
                    item = document.createTextNode(emails[e]);
                } else {
                    item = emails[e];
                }

                if (e === 0) {
                    items[i] = item;
                } else {
                    items.splice(i + 1, 0, item);
                    i++;
                }
            }
        }

        return items;
    };

    editor.method('chat:post', function (type, string) {
        if (type !== 'system' && typeof(type) !== 'number')
            return;

        const element = document.createElement('div');
        element.classList.add('selectable');

        const text = element.text = document.createElement('span');
        text.classList.add('selectable');
        element.appendChild(text);

        let message;

        if (type === 'system') {
            lastUser = null;
            lastMessage = 0;
            const date = new Date();
            message = ('00' + date.getHours()).slice(-2) + ':' + ('00' + date.getMinutes()).slice(-2) + ' - ' + string;
            element.classList.add('system');
        } else if (typeof(type) === 'number') {
            element.classList.add('message');
            message = string;

            // if same user posts within 60 seconds,
            // don't add image and username
            if (lastUser !== type || (Date.now() - lastMessage) > lastMessageDelay) {
                const img = document.createElement('img');
                img.classList.add('selectable');
                img.width = 14;
                img.height = 14;
                img.src = '/api/users/' + type + '/thumbnail?size=14';
                element.insertBefore(img, text);

                const date = new Date();

                element.tooltip = Tooltip.attach({
                    target: img,
                    text: ('00' + date.getHours()).slice(-2) + ':' + ('00' + date.getMinutes()).slice(-2),
                    align: 'right',
                    root: root
                });

                const user = editor.call('users:get', type);

                const username = document.createElement('span');
                username.classList.add('username', 'selectable');
                username.textContent = (user ? user.username : '') + ': ';
                if (type !== config.self.id)
                    username.style.color = editor.call('users:color', user.id, 'hex');
                element.insertBefore(username, text);
            } else {
                element.classList.add('multi');
            }

            lastUser = type;
            lastMessage = Date.now();
        }

        const elements = parseMessage(message);
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < elements.length; i++)
            fragment.appendChild(elements[i]);
        text.appendChild(fragment);

        const scrollDown = ! widget.folded && Math.abs((messages.innerElement.scrollHeight - messages.innerElement.clientHeight) - messages.innerElement.scrollTop) < 4;

        messages.append(element);

        if (scrollDown)
            messages.innerElement.scrollTop = messages.innerElement.scrollHeight - messages.innerElement.clientHeight;

        editor.emit('chat:post', type, message, element);

        return element;
    });

    editor.method('chat:sync:msg', function (data) {
        editor.call('chat:post', data.from, data.d);
    });

    editor.method('chat:send', function (message) {
        message = message.trim();
        if (! message)
            return;

        editor.call('relay:broadcast', 'project-' + config.project.id, {
            chat: 'msg',
            d: message
        });
    });

    editor.on('relay:room:leave', function (data) {
        if (data.name !== 'project-' + config.project.id) return;

        if (lastUser === data.userId) {
            lastUser = null;
            lastMessage = 0;
        }
    });

    editor.on('relay:room:msg', data => {
        if (data.msg.chat === 'msg') {
            editor.call('chat:sync:msg', {
                from: data.from,
                d: data.msg.d
            });
        }
    });
});
