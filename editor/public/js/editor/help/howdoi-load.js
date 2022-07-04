editor.once('load', function () {
    var data = {
        url: config.url.howdoi,
        method: 'GET'
    };

    Ajax(data)
    .on('load', function (status, data) {
        if (!data || !data.length)
            return;

        data.forEach(function (tip) {
            editor.call('help:howdoi:register', {
                title: tip.title,
                text: tip.html,
                keywords: tip.keywords
            });
        });

        editor.emit('help:howdoi:load');
    })
    .on('error', function (status, data) {
        log.error(status);
    });
});
