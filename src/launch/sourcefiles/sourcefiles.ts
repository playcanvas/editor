// TODO: Remove this file when the legacy scripts are removed
import { config } from '@/launch/config';

editor.once('load', () => {
    if (!editor.call('settings:project').get('useLegacyScripts')) {
        return;
    }

    // load scripts
    fetch(`${config.url.home}${(config.project as { repositoryUrl: string }).repositoryUrl}`, {
        credentials: 'include',
        headers: {
            'Authorization': `Bearer ${'accessToken' in window.config ? (window.config as { accessToken: string }).accessToken : ''}`,
            'Content-Type': 'application/json'
        }
    }).then(res => res.json()).then((data: { result: Array<{ filename: string }> }) => {
        const filenames = data.result.map((item: { filename: string }) => {
            return item.filename;
        });

        editor.emit('sourcefiles:load', filenames);
    }).catch((err: unknown) => {
        console.error(err);
        editor.emit('sourcefiles:load', []);
    });
});
