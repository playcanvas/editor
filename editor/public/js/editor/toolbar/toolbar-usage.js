editor.once('load', function () {
    'use strict';

    if (config.owner.plan.type !== 'free')
        return;

    var root = editor.call('layout.root');
    var panel = new ui.Panel();
    panel.class.add('usage');

    var label = new ui.Label();
    panel.append(label);

    var btnClose = new ui.Button({
        text: '&#58422;'
    });
    panel.append(btnClose);
    btnClose.class.add('close');
    btnClose.on('click', function () {
        panel.hidden = true;
    });

    var refreshUsage = function () {
        var diff = config.owner.diskAllowance - config.owner.size;
        var upgrade = '<a href="/upgrade" target="_blank">UPGRADE</a> to get more disk space.';
        if (diff > 0 && diff < 30000000) {
            label.text = 'You are close to your disk allowance limit. ' + upgrade;
            panel.hidden = false;
        } else if (diff < 0) {
            label.text = 'You are over your disk allowance limit. ' + upgrade;
            panel.hidden = false;
        } else {
            panel.hidden = true;
        }
    };

    root.append(panel);

    refreshUsage();

    editor.on('user:' + config.owner.id + ':usage', refreshUsage);
});