editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var widget = editor.call('chat:panel');
    var messages = editor.call('chat:messagesPanel');
    var lastUser = null;
    var lastMessage = 0;
    var lastMessageDelay = 60 * 1000;

    var regexUrl = /[a-z]+:\/\/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:%_\+.~#?&\/=]*/g;
    var regexEmail = /[-a-zA-Z0-9:%._\+~]{1,256}@[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,16}/g;

    var stringToElements = function(args) {
        var items = [ ];

        var bits = args.string.match(args.regex);
        if (! bits) return [ args.string ];

        var parts = args.string.split(args.regex);

        for(var i = 0; i < parts.length; i++) {
            items.push(parts[i]);

            if (bits.length > i)
                items.push(args.filter(bits[i]));
        }

        return items;
    };

    var parseMessageFilterLink = function(string) {
        var link = document.createElement('a');
        link.target = '_blank';
        link.href = string;
        link.textContent = string;
        return link;
    };

    var parseMessageFilterEmail = function(string) {
        var link = document.createElement('a');
        link.href = 'mailto:' + string;
        link.textContent = string;
        return link;
    };

    var parseMessage = function(message) {
        var items = stringToElements({
            string: message,
            regex: regexUrl,
            filter: parseMessageFilterLink
        });

        for(var i = 0; i < items.length; i++) {
            if (typeof(items[i]) !== 'string')
                continue;

            var emails = stringToElements({
                string: items[i],
                regex: regexEmail,
                filter: parseMessageFilterEmail
            });

            for(var e = 0; e < emails.length; e++) {
                var item;

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

    editor.on('whoisonline:remove', function(id) {
        if (lastUser === id) {
            lastUser = null;
            lastMessage = 0;
        }
    });

    editor.method('chat:post', function(type, string) {
        if (type !== 'system' && typeof(type) !== 'number')
            return;

        var element = document.createElement('div');

        var text = element.text = document.createElement('span');
        element.appendChild(text);

        var message;

        if (type === 'system') {
            lastUser = null;
            lastMessage = 0;
            var date = new Date();
            message = ('00' + date.getHours()).slice(-2) + ':' + ('00' + date.getMinutes()).slice(-2) + ' - ' + string;
            element.classList.add('system');
        } else if (typeof(type) === 'number') {
            element.classList.add('message');
            message = string;

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
        }

        var elements = parseMessage(message);
        var fragment = document.createDocumentFragment();
        for(var i = 0; i < elements.length; i++)
            fragment.appendChild(elements[i]);
        text.appendChild(fragment);

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
