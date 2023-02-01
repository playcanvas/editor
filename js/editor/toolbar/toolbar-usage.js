editor.once('load', function () {
    'use strict';

    if (config.owner.plan.type !== 'free')
        return;

    const root = editor.call('layout.root');
    const container = new pcui.Container({
        id: 'usage-alert'
    });

    const label = new pcui.Label({
        unsafe: true
    });
    container.append(label);

    const btnClose = new pcui.Button({
        class: 'close',
        icon: 'E132'
    });
    container.append(btnClose);
    btnClose.on('click', function () {
        container.hidden = true;
    });

    const refreshUsage = function () {
        const diff = config.owner.diskAllowance - config.owner.size;
        const upgrade = '<a href="/upgrade" target="_blank">UPGRADE</a> to get more disk space.';
        if (diff > 0 && diff < 30000000) {
            label.text = 'You are close to your disk allowance limit. ' + upgrade;
            container.hidden = false;
        } else if (diff < 0) {
            label.text = 'You are over your disk allowance limit. ' + upgrade;
            container.hidden = false;
        } else {
            container.hidden = true;
        }
    };

    root.append(container);

    refreshUsage();

    editor.on(`user:${config.owner.id}:usage`, refreshUsage);
});
