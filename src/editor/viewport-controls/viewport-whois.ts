import { Button, Container } from '@playcanvas/pcui';

import { LegacyTooltip } from '@/common/ui/tooltip';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const viewport = editor.call('layout.viewport');

    const panel = new Container({
        class: ['control-strip', 'bottom-left']
    });
    viewport.append(panel);

    const chatWidget = editor.call('chat:panel');
    if (chatWidget) {
        panel.append(chatWidget);
    }

    const assetPanel = editor.call('layout.assets');

    const adjustPosition = () => {
        panel.style.bottom = assetPanel.collapsed ? '36px' : '4px';
    };

    adjustPosition();
    assetPanel.on('collapse', adjustPosition);
    assetPanel.on('expand', adjustPosition);

    const userMap = new Map<number, { button: Button; tooltip: LegacyTooltip }>();

    editor.on('whoisonline:add', (id: number) => {
        if (userMap.has(id)) {
            return;
        }

        const button = new Button({
            class: ['control-strip-btn', 'whoisonline-user']
        });
        button.style.backgroundImage = `url(/api/users/${id}/thumbnail?size=28)`;
        panel.append(button);

        let clickHandle = button.on('click', () => window.open(`/${id}`, '_blank'));

        const tooltip = LegacyTooltip.attach({
            target: button.dom,
            text: '',
            align: 'bottom',
            root: root
        });

        userMap.set(id, { button, tooltip });

        editor.call('users:loadOne', id, (user: { username: string; id: number }) => {
            clickHandle.unbind();
            clickHandle = button.on('click', () => window.open(`/user/${user.username}`, '_blank'));
            tooltip.text = user.username;
            button.style.backgroundColor = editor.call('users:color', user.id, 'hex');
        });
    });

    editor.on('whoisonline:remove', (id: number) => {
        const entry = userMap.get(id);
        if (entry) {
            entry.tooltip.destroy();
            entry.button.destroy();
            userMap.delete(id);
        }
    });

    editor.method('whoisonline:panel', () => {
        return panel;
    });
});
