editor.once('load', function () {
    const root = editor.call('layout.root');
    const viewport = editor.call('layout.viewport');

    const panel = new pcui.Container();
    panel.class.add('whoisonline');
    viewport.append(panel);

    editor.on('viewport:expand', function (state) {
        if (state) {
            panel.class.add('expanded');
        } else {
            panel.class.remove('expanded');
        }
    });

    const assetPanel = editor.call('layout.assets');

    const adjustPosition = () => {
        panel.style.bottom = assetPanel.collapsed ? '34px' : '2px';
    };

    adjustPosition();
    assetPanel.on('collapse', adjustPosition);
    assetPanel.on('expand', adjustPosition);

    editor.on('whoisonline:add', function (id) {
        for (const childNode of panel.innerElement.childNodes) {
            if (childNode.userId === id)
                return;
        }

        const link = document.createElement('a');
        link.userId = id;
        link.href = '/' + id;
        link.target = "_blank";
        panel.append(link);

        const img = document.createElement('img');
        img.src = `/api/users/${id}/thumbnail?size=28`;
        link.appendChild(img);

        link.tooltip = Tooltip.attach({
            target: link,
            text: '',
            align: 'bottom',
            root: root
        });

        editor.call('users:loadOne', id, function (user) {
            link.href = '/user/' + user.username;
            link.tooltip.text = user.username;
            link.style.backgroundColor = editor.call('users:color', user.id, 'hex');
        });
    });


    editor.on('whoisonline:remove', function (id, index) {
        for (const childNode of panel.innerElement.childNodes) {
            if (childNode.userId === id) {
                if (childNode.tooltip)
                    childNode.tooltip.destroy();
                panel.innerElement.removeChild(childNode);
                return;
            }
        }
    });


    editor.method('whoisonline:panel', function () {
        return panel;
    });

    const chatWidget = editor.call('chat:panel');
    if (chatWidget) {
        panel.class.add('chat-minified');

        chatWidget.on('collapse', function () {
            panel.class.add('chat-minified');
        });
        chatWidget.on('expand', function () {
            panel.class.remove('chat-minified');
        });

        if (!editor.call('permissions:read'))
            panel.class.add('no-chat');
    }

    editor.on('permissions:set', function (level) {
        if (level) {
            panel.class.remove('no-chat');
        } else {
            panel.class.add('no-chat');
        }
    });
});
