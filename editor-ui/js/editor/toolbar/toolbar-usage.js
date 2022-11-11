editor.once('load', function () {
    'use strict';

    if (config.owner.plan.type !== 'free')
        return;

    var root = editor.call('layout.root');
    var container = new pcui.Container({
        id: 'usage-alert'
    });

    var label = new ui.Label({
        unsafe: true
    });
    container.append(label);

    var btnClose = new ui.Button({
        text: '&#57650;'
    });
    container.append(btnClose);
    btnClose.class.add('close');
    btnClose.on('click', function () {
        container.hidden = true;
    });

    var refreshUsage = function () {
        var diff = config.owner.diskAllowance - config.owner.size;
        var upgrade = '<a href="/upgrade" target="_blank">UPGRADE</a> to get more disk space.';
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

    editor.on('user:' + config.owner.id + ':usage', refreshUsage);
});
