// TODO: Remove this file when the legacy scripts are removed
editor.once('load', () => {
    if (!editor.call('settings:project').get('useLegacyScripts')) {
        return;
    }

    // load scripts
    fetch(`${config.url.home}${config.project.repositoryUrl}`, {
        credentials: 'include',
        headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(res => res.json()).then((data) => {
        const filenames = data.result.map((item) => {
            return item.filename;
        });

        editor.emit('sourcefiles:load', filenames);
    }).catch((err) => {
        console.error(err);
        editor.emit('sourcefiles:load', []);
    });
});
