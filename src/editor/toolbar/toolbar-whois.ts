import { Container } from '@playcanvas/pcui';

import { LegacyTooltip } from '../../common/ui/tooltip.ts';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const viewport = editor.call('layout.viewport');

    const panel = new Container({
        class: 'whoisonline'
    });
    viewport.append(panel);

    editor.on('viewport:expand', (state) => {
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

    editor.on('whoisonline:add', (id) => {
        for (const childNode of panel.innerElement.childNodes) {
            if (childNode.userId === id) {
                return;
            }
        }

        const link = document.createElement('a');
        link.userId = id;
        link.href = `/${id}`;
        link.target = '_blank';
        panel.append(link);

        const img = document.createElement('img');
        img.src = `/api/users/${id}/thumbnail?size=28`;
        link.appendChild(img);

        link.tooltip = LegacyTooltip.attach({
            target: link,
            text: '',
            align: 'bottom',
            root: root
        });

        editor.call('users:loadOne', id, (user) => {
            link.href = `/user/${user.username}`;
            link.tooltip.text = user.username;
            link.style.backgroundColor = editor.call('users:color', user.id, 'hex');
        });
    });


    editor.on('whoisonline:remove', (id, index) => {
        for (const childNode of panel.innerElement.childNodes) {
            if (childNode.userId === id) {
                if (childNode.tooltip) {
                    childNode.tooltip.destroy();
                }
                panel.innerElement.removeChild(childNode);
                return;
            }
        }
    });


    editor.method('whoisonline:panel', () => {
        return panel;
    });

    const chatWidget = editor.call('chat:panel');
    if (chatWidget) {
        panel.class.add('chat-minified');

        chatWidget.on('collapse', () => {
            panel.class.add('chat-minified');
        });
        chatWidget.on('expand', () => {
            panel.class.remove('chat-minified');
        });

        if (!editor.call('permissions:read')) {
            panel.class.add('no-chat');
        }
    }

    editor.on('permissions:set', (level) => {
        if (level) {
            panel.class.remove('no-chat');
        } else {
            panel.class.add('no-chat');
        }
    });
});
