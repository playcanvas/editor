import { config } from '@/editor/config';

import { hideAlert, showAlert } from './alert-bar';

editor.once('load', () => {
    if (config.owner.plan.type !== 'free') {
        return;
    }

    const refreshUsage = function () {
        const diff = config.owner.diskAllowance - config.owner.size;
        const upgrade = '<a href="/upgrade" target="_blank">UPGRADE</a> to get more disk space.';
        if (diff > 0 && diff < 30000000) {
            showAlert('usage', {
                tone: 'error',
                text: `You are close to your disk allowance limit. ${upgrade}`,
                unsafe: true
            });
        } else if (diff < 0) {
            showAlert('usage', {
                tone: 'error',
                text: `You are over your disk allowance limit. ${upgrade}`,
                unsafe: true
            });
        } else {
            hideAlert('usage');
        }
    };

    refreshUsage();

    editor.on(`user:${config.owner.id}:usage`, refreshUsage);
});
