editor.once('load', () => {
    fetch(`${config.url.frontend}static/json/howdoi.json`).then(res => res.json()).then((data) => {
        if (!data || !data.length) {
            return;
        }

        // Replace external image URLs with local paths
        const imgBaseUrl = `${config.url.frontend}static/img/`;

        data.forEach((tip) => {
            const html = tip.html.replace(
                /https:\/\/playcanvas\.com\/static-assets\/instructions\//g,
                imgBaseUrl
            );

            editor.call('help:howdoi:register', {
                title: tip.title,
                text: html,
                keywords: tip.keywords
            });
        });

        editor.emit('help:howdoi:load');
    }).catch((err) => {
        log.error(err);
    });
});
