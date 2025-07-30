editor.once('load', () => {
    fetch(config.url.howdoi).then(res => res.json()).then((data) => {
        if (!data || !data.length) {
            return;
        }

        data.forEach((tip) => {
            editor.call('help:howdoi:register', {
                title: tip.title,
                text: tip.html,
                keywords: tip.keywords
            });
        });

        editor.emit('help:howdoi:load');
    }).catch((err) => {
        log.error(err);
    });
});
