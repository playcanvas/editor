import { Container, Element } from '@playcanvas/pcui';

import { tooltip, tooltipSimpleItem } from '../../common/tooltips';

editor.once('load', () => {
    const panel = editor.call('layout.top');

    const wioPanel = new Container({
        class: 'whoisonline'
    });
    panel.append(wioPanel);

    const itemsIndex = {};
    const tooltips = {};

    const createItem = function (id) {
        const link = document.createElement('a');
        link.href = `/${id}`;
        link.target = '_blank';

        const img = new Image();
        img.onload = function () {
            item.style.borderColor = editor.call('users:color', id, 'hex');
        };

        img.src = `/api/users/${id}/thumbnail?size=28`;
        link.appendChild(img);

        const item = new Element({
            dom: link
        });
        itemsIndex[id] = item;

        wioPanel.append(item);

        editor.call('users:loadOne', id, (user) => {
            link.href = `/user/${user.username}`;

            tooltips[id] = tooltipSimpleItem({
                text: user.username
            });
            tooltip().attach({
                container: tooltips[id],
                target: item,
                align: 'top'
            });
        });
    };


    editor.on('whoisonline:add', (assetId, userId) => {
        // check if this is the focused document
        if (editor.call('documents:getFocused') !== assetId || itemsIndex[userId]) {
            return;
        }

        createItem(userId);
    });

    editor.on('whoisonline:remove', (assetId, userId) => {
        // check if this is the focused document
        const focused = editor.call('documents:getFocused');
        if (focused && focused !== assetId) {
            return;
        }

        const item = itemsIndex[userId];
        if (item) {
            wioPanel.remove(item);
            delete itemsIndex[userId];

            if (tooltips[userId]) {
                tooltips[userId].destroy();
                delete tooltips[userId];
            }
        }
    });

    // when we change documents reset whoisonline panel
    editor.on('documents:focus', (id) => {
        const whoisonline = editor.call('whoisonline:get', id);

        // clear old
        for (const id in itemsIndex) {
            if (whoisonline[id]) {
                continue;
            }

            const item = itemsIndex[id];
            wioPanel.remove(item);
            delete itemsIndex[id];

            if (tooltips[id]) {
                tooltips[id].destroy();
                delete tooltips[id];
            }
        }

        for (const id in whoisonline) {
            if (!itemsIndex[id]) {
                createItem(id);
            }
        }
    });
});
